/**
 * Promote an existing account to admin.
 *   npm run make-admin -- you@example.com
 * The person must have signed up first (and confirmed their email if Supabase asks).
 */
import 'dotenv/config';
import sql from './db.js';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Usage: npm run make-admin -- you@example.com');
    process.exit(1);
  }

  const [user] = await sql<{ id: string }[]>`
    SELECT id FROM auth.users WHERE lower(email) = ${email} LIMIT 1
  `;
  if (!user) {
    console.error(`No account found for ${email}.`);
    console.error('Sign up at http://localhost:3000/signup first, then run this command again.');
    process.exit(1);
  }

  await sql`
    INSERT INTO public.profiles (id, role)
    VALUES (${user.id}, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin'
  `;

  console.log(`OK: ${email} is now an admin. Log in at http://localhost:3000/admin/login`);
}

main()
  .catch((e) => {
    console.error('Failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
