#!/usr/bin/env node
/**
 * UniGuide setup wizard:  npm run configure
 * Asks for your NEW Supabase (and optional Brevo) values, checks them, and writes
 *   services/api/.env      (private: never commit)
 *   apps/web/.env.local    (public values only)
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiEnv = path.join(root, 'services', 'api', '.env');
const webEnv = path.join(root, 'apps', 'web', '.env.local');

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
const lines = rl[Symbol.asyncIterator]();
async function ask(question) {
  process.stdout.write(question);
  const { value } = await lines.next();
  return (value ?? '').trim();
}
const say = (m = '') => console.log(m);
const bad = (m) => console.log(`   ✖ ${m}`);
const good = (m) => console.log(`   ✔ ${m}`);

function decodeJwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload.role;
  } catch {
    return undefined;
  }
}

async function askUntilValid(question, check) {
  for (;;) {
    const v = await ask(question);
    const problem = check(v);
    if (!problem) return v;
    bad(problem);
  }
}

const mask = (v) => (v.length <= 10 ? '****' : `${v.slice(0, 6)}…${v.slice(-4)}`);

say('\n=== UniGuide Gabès — setup wizard ===');
say('Have your NEW Supabase project open (and Brevo if you want emails). See GUIDE.md parts 4–6.');
say('Press Ctrl+C at any time to stop. Nothing is written until the end.\n');

// 1 ---- Supabase project URL
say('1/6  Supabase Project URL   (Project Settings → API, looks like https://abcdefghijklmnopqrst.supabase.co)');
let supabaseUrl = await askUntilValid('     Project URL: ', (v) => {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(v)) return 'It must look like https://YOUR-REF.supabase.co (no extra path).';
});
supabaseUrl = supabaseUrl.replace(/\/+$/, '');
const ref = supabaseUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i)[1].toLowerCase();
good(`project reference: ${ref}`);

// 2 ---- publishable key
say('\n2/6  Publishable key   (Project Settings → API Keys → "Publishable key", starts with sb_publishable_)');
const anonKey = await askUntilValid('     Publishable key: ', (v) => {
  if (!v) return 'Required.';
  if (v.startsWith('sb_secret_')) return 'That is a SECRET key. Never put it in the website. Copy the PUBLISHABLE key instead.';
  if (v.startsWith('sb_publishable_')) return undefined;
  if (v.startsWith('eyJ')) {
    const role = decodeJwtRole(v);
    if (role === 'service_role') return 'That is the service_role key (full admin power). Never use it here. Copy the publishable / anon key.';
    if (role === 'anon') return undefined;
    return 'This JWT is not an anon key.';
  }
  return 'Expected a key starting with sb_publishable_ (or the older anon key starting with eyJ).';
});
good(`key accepted (${mask(anonKey)})`);

// 3 ---- database connection
say('\n3/6  Database connection string   (click Connect → "Session pooler" → copy the whole line)');
say('     It looks like: postgresql://postgres.REF:[YOUR-PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres');
let dbUrl = await askUntilValid('     Connection string: ', (v) => {
  if (!/^postgres(ql)?:\/\//i.test(v)) return 'It must start with postgresql://';
  if (!v.toLowerCase().includes(ref)) return `It does not contain your project reference "${ref}". Is it from the SAME Supabase project?`;
});
if (dbUrl.includes('[YOUR-PASSWORD]')) {
  say('     Now type the database password you chose when creating the project');
  say('     (forgot it? Supabase → Database → Settings → Reset database password). It is shown on screen as you type.');
  const pw = await askUntilValid('     Database password: ', (v) => (v ? undefined : 'Required.'));
  dbUrl = dbUrl.replace('[YOUR-PASSWORD]', encodeURIComponent(pw));
  good('password inserted (special characters are encoded for you)');
} else {
  good('connection string already contains a password; keeping it as is');
}
if (/:6543\//.test(dbUrl)) say('   ! Port 6543 = transaction pooler. It works with this app, but the session pooler (port 5432) is recommended.');

// 4 ---- website address
say('\n4/6  Website address allowed to call the API   (press Enter for local development: http://localhost:3000)');
let site = await ask('     Website address [http://localhost:3000]: ');
site = (site || 'http://localhost:3000').replace(/\/+$/, '');
if (!/^https?:\/\/[^\s/]+$/i.test(site)) {
  bad('Not a valid address, using http://localhost:3000');
  site = 'http://localhost:3000';
}
good(`CORS_ORIGIN = ${site}`);

// 5 ---- Brevo
say('\n5/6  Brevo API key (optional: emails to students)   (Brevo → Settings → SMTP & API → API keys, starts with xkeysib-)');
say('     Press Enter to skip; you can run this wizard again later.');
let brevoKey = '';
for (;;) {
  const v = await ask('     Brevo API key: ');
  if (!v) break;
  if (v.startsWith('xsmtpsib-')) {
    bad('That is an SMTP key. This app needs the API key (starts with xkeysib-). Use the SMTP key only inside Supabase (GUIDE part 6).');
    continue;
  }
  if (!v.startsWith('xkeysib-')) {
    bad('A Brevo API key starts with xkeysib-. Check you copied the API key from the "API keys" tab.');
    continue;
  }
  brevoKey = v;
  good(`key accepted (${mask(v)})`);
  break;
}

// 6 ---- sender
let sender = '';
let senderName = 'UniGuide Gabès';
if (brevoKey) {
  say('\n6/6  Sender email (must be a VERIFIED sender in Brevo → Senders, Domains & Dedicated IPs)');
  sender = await askUntilValid('     Sender email: ', (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'Enter a valid email address.'));
  const n = await ask('     Sender name [UniGuide Gabès]: ');
  if (n) senderName = n;
} else {
  say('\n6/6  Sender email: skipped (no Brevo key).');
}

// ---- write files
function backup(file) {
  if (fs.existsSync(file)) {
    const copy = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.copyFileSync(file, copy);
    return path.relative(root, copy);
  }
  return null;
}
const b1 = backup(apiEnv);
const b2 = backup(webEnv);

const apiText = `# Generated by "npm run configure". PRIVATE: never commit or share this file.
PORT=4000
CORS_ORIGIN=${site}
DATABASE_URL=${dbUrl}
SUPABASE_URL=${supabaseUrl}
SUPABASE_JWKS_URL=${supabaseUrl}/auth/v1/.well-known/jwks.json
BREVO_API_KEY=${brevoKey}
BREVO_SENDER_EMAIL=${sender}
BREVO_SENDER_NAME=${senderName}
`;
const webText = `# Generated by "npm run configure". Public values only (safe in a browser).
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
`;
fs.mkdirSync(path.dirname(apiEnv), { recursive: true });
fs.mkdirSync(path.dirname(webEnv), { recursive: true });
fs.writeFileSync(apiEnv, apiText, { mode: 0o600 });
fs.writeFileSync(webEnv, webText);

say('\n=== Done ===');
say(`Wrote ${path.relative(root, apiEnv)} and ${path.relative(root, webEnv)}`);
if (b1 || b2) say(`Old files were saved as: ${[b1, b2].filter(Boolean).join(', ')}`);
say('\nNext:');
say('  1. In Supabase SQL Editor run database/migrations/001_init.sql, then 002_security.sql');
say('  2. npm run doctor        (must say "All good")');
say('  3. npm run dev');
say('');
rl.close();
