import dotenv from 'dotenv';

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY ?? '';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL ?? '';
const SENDER_NAME = process.env.BREVO_SENDER_NAME ?? 'UniGuide Gabès';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends a transactional email through Brevo.
 * Never throws on failure — logs and returns false so the caller isn't broken
 * by an email outage.
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<boolean> {
  if (!BREVO_API_KEY || !SENDER_EMAIL) {
    console.warn('[email] BREVO_API_KEY or BREVO_SENDER_EMAIL not set — skipping send');
    return false;
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[email] Brevo error', res.status, body.slice(0, 300));
      if (res.status === 401) {
        console.error(
          '[email] Brevo refused the key. Check that BREVO_API_KEY is an API key (starts with xkeysib-), ' +
            'not an SMTP key, and that Brevo > Settings > Security > Authorized IPs is not blocking this server.'
        );
      } else if (res.status === 400) {
        console.error('[email] Brevo rejected the request. Is BREVO_SENDER_EMAIL a verified sender in Brevo?');
      }
      return false;
    }

    console.log(`[email] sent to ${to} — "${subject}"`);
    return true;
  } catch (e) {
    console.error('[email] unexpected error', e);
    return false;
  }
}

// ---------- Templates ----------

export function submissionConfirmationHtml(placeName: string, placeId: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e293b;">Thanks for submitting a place</h2>
      <p style="color: #475569;">
        We received your submission for <strong>${escapeHtml(placeName)}</strong>.
      </p>
      <p style="color: #475569;">
        It's now waiting for review. You'll get another email once an admin
        approves or rejects it.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        Reference ID: ${placeId}
      </p>
    </div>
  `;
}

export function approvalHtml(placeName: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16a34a;">Your place is live</h2>
      <p style="color: #475569;">
        <strong>${escapeHtml(placeName)}</strong> has been approved and is now
        visible on UniGuide Gabès.
      </p>
      <p style="color: #475569;">Thanks for contributing!</p>
    </div>
  `;
}

export function rejectionHtml(placeName: string, reason: string | null): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #dc2626;">Submission not approved</h2>
      <p style="color: #475569;">
        Your submission <strong>${escapeHtml(placeName)}</strong> was not approved.
      </p>
      ${reason ? `<p style="color: #475569;"><em>Reason:</em> ${escapeHtml(reason)}</p>` : ''}
      <p style="color: #475569;">
        You can resubmit with more accurate details (correct coordinates, a
        source link, a clearer description) at any time.
      </p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}