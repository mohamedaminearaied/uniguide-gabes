/**
 * Set a new password for an existing account (development helper, no email needed).
 *   npm run set-password -- you@example.com NewPassword123
 * Also marks the email as confirmed so you can log in immediately.
 */
import 'dotenv/config';
import sql from './db.js';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3];
  if (!email || !email.includes('@') || !password) {
    console.error('Usage: npm run set-password -- you@example.com NewPassword123');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Use at least 8 characters.');
    process.exit(1);
  }

  const rows = await sql`
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(${password}, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    WHERE lower(email) = ${email}
    RETURNING id
  `;

  if (rows.length === 0) {
    console.error(`No account found for ${email}. Sign up first at http://localhost:3000/signup`);
    process.exit(1);
  }
  console.log(`OK: password updated for ${email}. Log in at http://localhost:3000/login`);
}

main()
  .catch((e) => {
    console.error('Failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
