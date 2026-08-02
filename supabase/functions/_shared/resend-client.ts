/**
 * Resend Email Client
 *
 * This file initializes the Resend client for sending emails.
 * API key is stored in Supabase Vault as RESEND_API_KEY.
 *
 * Setup:
 * supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxx"
 */

/**
 * Get Resend API Key from environment
 */
function getResendApiKey(): string {
  const key = Deno.env.get('RESEND_API_KEY');

  if (!key) {
    throw new Error(
      'RESEND_API_KEY environment variable not set. ' +
      'Please run: supabase secrets set RESEND_API_KEY="re_xxx"'
    );
  }

  if (!key.startsWith('re_')) {
    throw new Error(
      'Invalid RESEND_API_KEY format. ' +
      'Resend API key should start with "re_"'
    );
  }

  return key;
}

/**
 * Resend API endpoint
 */
const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send email via Resend API
 *
 * @param options - Email options
 * @returns Promise with email ID or error
 */
export async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ id: string }> {
  const apiKey = getResendApiKey();

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo && { reply_to: options.replyTo }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    
    console.error('Resend API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      details: errorData,
    });

    throw new Error(`Failed to send email: ${errorMessage}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Default sender email
 * Can be overridden per email
 */
export const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';

/**
 * Production sender email (when domain is verified)
 * Domain: mail.closewell.app (verified subdomain in Resend)
 */
export const PRODUCTION_FROM_EMAIL = 'support@mail.closewell.app';
