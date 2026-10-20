/**
 * Checks everything the API needs and tells you exactly what is wrong.
 *   npm run doctor
 */
import 'dotenv/config';
import fs from 'node:fs';
import net from 'node:net';

let problems = 0;
const ok = (m: string) => console.log(`  ✔ ${m}`);
const warn = (m: string) => console.log(`  ! ${m}`);
const bad = (m: string, fix?: string) => {
  problems++;
  console.log(`  ✖ ${m}`);
  if (fix) console.log(`      → ${fix}`);
};

const PLACEHOLDER = /YOUR|abcdxyz|REF|\[|xxx|example\.com/i;

function mask(v: string) {
  return v.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
}

async function main() {
  console.log('\nUniGuide API check\n');

  console.log('1. Configuration (services/api/.env)');
  if (!fs.existsSync('.env')) {
    bad('.env file not found in services/api', 'Run:  npm run configure   (from the project folder). It asks a few questions and writes the file for you.');
  } else {
    ok('.env file found');
  }

  const env = process.env;
  const need = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_JWKS_URL'] as const;
  for (const k of need) {
    const v = env[k];
    if (!v) bad(`${k} is empty or missing`, `Run  npm run configure  again, or add ${k}=... to services/api/.env (GUIDE.md, Part 7).`);
    else if (PLACEHOLDER.test(v)) bad(`${k} still looks like a placeholder: ${mask(v)}`, 'Replace it with your real Supabase value.');
    else ok(`${k} = ${mask(v)}`);
  }
  if (env.SUPABASE_URL && env.SUPABASE_JWKS_URL) {
    const expected = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
    if (env.SUPABASE_JWKS_URL !== expected) warn(`SUPABASE_JWKS_URL is usually ${expected}`);
  }
  if (env.SUPABASE_URL?.endsWith('/')) warn('SUPABASE_URL should not end with "/"');
  const ref = env.SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
  if (ref && env.DATABASE_URL && !PLACEHOLDER.test(env.DATABASE_URL) && !env.DATABASE_URL.includes(ref)) {
    warn(`DATABASE_URL does not mention the project "${ref}" from SUPABASE_URL. They must belong to the SAME Supabase project.`);
  }

  const port = Number(env.PORT) || 4000;
  console.log(`\n2. Port ${port}`);
  await new Promise<void>((resolve) => {
    const srv = net.createServer();
    srv.once('error', (e: NodeJS.ErrnoException) => {
      if (e.code === 'EADDRINUSE') {
        warn(`Port ${port} is in use. That is fine if the API is already running; otherwise close the program using it.`);
      }
      resolve();
    });
    srv.once('listening', () => srv.close(() => { ok(`Port ${port} is free`); resolve(); }));
    srv.listen(port);
  });

  console.log('\n3. Database');
  if (!env.DATABASE_URL || PLACEHOLDER.test(env.DATABASE_URL)) {
    bad('Skipped: fix DATABASE_URL first');
  } else {
    const { default: sql } = await import('./db.js');
    try {
      await sql`select 1`;
      ok('Connected to the database');

      const [t] = await sql<{ places: string | null; profiles: string | null }[]>`
        select to_regclass('public.places')::text as places, to_regclass('public.profiles')::text as profiles
      `;
      if (!t.places || !t.profiles) {
        bad('Tables "places" / "profiles" are missing', 'Run database/migrations/001_init.sql in the Supabase SQL Editor.');
      } else {
        ok('Tables places + profiles exist');
        const [c] = await sql<{ n: number }[]>`
          select count(*)::int as n from information_schema.columns
          where table_schema='public' and table_name='places' and column_name in ('location','rejection_reason','submitter_id','reviewed_at')
        `;
        if (c.n < 4) bad('Table "places" is missing some columns', 'Run database/migrations/001_init.sql again (it is safe).');
        else ok('Table places has all required columns');

        const rls = await sql<{ tablename: string; rowsecurity: boolean }[]>`
          select tablename, rowsecurity from pg_tables
          where schemaname = 'public' and tablename in ('profiles', 'places', 'audit_log')
        `;
        const names = rls.map((r) => r.tablename);
        if (!names.includes('audit_log')) {
          bad('Table "audit_log" is missing', 'Run database/migrations/002_security.sql in the Supabase SQL Editor.');
        } else if (rls.some((r) => !r.rowsecurity)) {
          bad('Row level security is OFF on a table', 'Run database/migrations/002_security.sql (and 001_init.sql) again.');
        } else {
          ok('Security rules active (RLS on profiles, places, audit_log)');
        }

        const [u] = await sql<{ users: number; admins: number }[]>`
          select (select count(*) from auth.users)::int as users,
                 (select count(*) from public.profiles where role = 'admin')::int as admins
        `;
        ok(`${u.users} registered account(s), ${u.admins} admin(s)`);
        if (u.admins === 0) warn('No admin yet. After you can log in, run:  npm run make-admin -- your-email@example.com');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let fix = 'Copy the connection string again from Supabase → Connect.';
      if (/password authentication failed/i.test(msg)) fix = 'Wrong database password. Reset it in Supabase → Project Settings → Database, then update DATABASE_URL.';
      else if (/Tenant or user not found/i.test(msg)) fix = 'Wrong user/host. Use the "Session pooler" string exactly as shown in Supabase → Connect.';
      else if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) fix = 'Host name not found. Check the host in DATABASE_URL and your internet connection.';
      else if (/ENETUNREACH|ETIMEDOUT|ECONNREFUSED/i.test(msg)) fix = 'Cannot reach the host. The direct connection needs IPv6: use the "Session pooler" string instead. Also check that the Supabase project is not paused.';
      else if (/SASL|URI|Invalid URL/i.test(msg)) fix = 'DATABASE_URL is malformed. URL-encode special characters in the password (@ becomes %40).';
      bad(`Cannot use the database: ${msg}`, fix);
    } finally {
      await sql.end({ timeout: 3 }).catch(() => {});
    }
  }

  console.log('\n4. Supabase login keys (JWKS)');
  if (env.SUPABASE_JWKS_URL && !PLACEHOLDER.test(env.SUPABASE_JWKS_URL)) {
    try {
      const r = await fetch(env.SUPABASE_JWKS_URL, { signal: AbortSignal.timeout(8000) });
      const j = (await r.json().catch(() => null)) as { keys?: unknown[] } | null;
      if (r.ok && j?.keys?.length) ok('JWKS reachable');
      else bad(`JWKS URL answered ${r.status} without keys`, 'Check SUPABASE_JWKS_URL (project URL + /auth/v1/.well-known/jwks.json).');
    } catch (e) {
      bad(`Cannot reach JWKS URL: ${e instanceof Error ? e.message : e}`, 'Check your internet connection and the project URL.');
    }
  } else {
    bad('Skipped: fix SUPABASE_JWKS_URL first');
  }

  console.log('\n5. Email (Brevo)');
  if (!env.BREVO_API_KEY) {
    warn('BREVO_API_KEY is empty: the site works, but students get no emails. (Optional: see GUIDE Part 6.)');
  } else if (env.BREVO_API_KEY.startsWith('xsmtpsib-')) {
    bad('BREVO_API_KEY is an SMTP key', 'Use the API key from Brevo → SMTP & API → "API keys" (starts with xkeysib-).');
  } else {
    try {
      const r = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (r.status === 401) {
        bad('Brevo refused the key (401)', 'Wrong key, or Brevo → Settings → Security → Authorized IPs is blocking this computer/server.');
      } else if (!r.ok) {
        bad(`Brevo answered ${r.status}`);
      } else {
        ok('Brevo API key works');
        if (!env.BREVO_SENDER_EMAIL) {
          bad('BREVO_SENDER_EMAIL is empty', 'Set it to a verified sender (Brevo → Senders, Domains & Dedicated IPs).');
        } else {
          const sr = await fetch('https://api.brevo.com/v3/senders', {
            headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
          });
          const sj = (await sr.json().catch(() => null)) as { senders?: { email: string; active: boolean }[] } | null;
          const hit = sj?.senders?.find((x) => x.email.toLowerCase() === env.BREVO_SENDER_EMAIL!.toLowerCase());
          if (!hit) bad(`${env.BREVO_SENDER_EMAIL} is not a sender in your Brevo account`, 'Add it in Brevo → Senders, Domains & Dedicated IPs → Senders, then verify it.');
          else if (!hit.active) bad(`${env.BREVO_SENDER_EMAIL} exists but is not verified yet`, 'Open the verification email Brevo sent to that address.');
          else ok(`Sender ${hit.email} is verified`);
        }
      }
    } catch (e) {
      warn(`Could not reach Brevo from here: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (env.NODE_ENV === 'production') {
    console.log('\n6. Production safety');
    if (!env.CORS_ORIGIN || /localhost/.test(env.CORS_ORIGIN)) bad('CORS_ORIGIN must be your real https website address in production');
    else ok(`CORS_ORIGIN = ${env.CORS_ORIGIN}`);
    if (!env.TRUST_PROXY) warn('TRUST_PROXY is not set: behind Render/Vercel set TRUST_PROXY=1 so rate limits see real visitor addresses.');
  }

  console.log(problems === 0 ? '\n✅ All good. Start the API with:  npm run dev\n' : `\n✖ ${problems} problem(s) found. Fix them in the order shown, then run this again.\n`);
  process.exitCode = problems === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error('Doctor crashed:', e);
  process.exitCode = 1;
});
