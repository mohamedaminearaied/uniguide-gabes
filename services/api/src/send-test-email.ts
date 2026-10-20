/**
 * Sends one test email through Brevo.
 *   npm run test-email -- you@example.com
 */
import 'dotenv/config';
import { sendEmail } from './email.js';

async function main() {
  const to = process.argv[2]?.trim();
  if (!to || !to.includes('@')) {
    console.error('Usage: npm run test-email -- you@example.com');
    process.exit(1);
  }
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error('BREVO_API_KEY and BREVO_SENDER_EMAIL are not set in services/api/.env (run: npm run configure).');
    process.exit(1);
  }
  const ok = await sendEmail({
    to,
    subject: 'UniGuide Gabès: test email',
    html: '<p>If you can read this, Brevo is connected to the UniGuide API. ✅</p>',
  });
  if (ok) console.log(`\nOK: test email accepted by Brevo for ${to}. Check the inbox (and spam).`);
  else {
    console.error('\nFAILED: read the [email] lines above. Common causes: wrong key type, sender not verified, Brevo Authorized IPs blocking.');
    process.exitCode = 1;
  }
}
main();
