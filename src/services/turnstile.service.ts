/**
 * Turnstile Verification Service
 * Verifies Cloudflare Turnstile tokens via Supabase Edge Function
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

export interface VerifyTurnstileResponse {
  success: boolean;
  error?: string;
}

/**
 * Verify Turnstile token
 * Calls Edge Function which verifies token with Cloudflare API
 * 
 * @param token - Turnstile token from widget
 * @returns Promise<void> - Throws error if verification fails
 * @throws Error if verification fails or network error occurs
 */
export async function verifyTurnstileToken(token: string): Promise<void> {
  console.log('[TurnstileService] Starting token verification...');
  
  if (!token) {
    console.error('[TurnstileService] Token is missing');
    throw new Error('Turnstile token is required');
  }

  if (!supabaseUrl) {
    console.error('[TurnstileService] VITE_SUPABASE_URL is not set');
    throw new Error('VITE_SUPABASE_URL is not set');
  }

  const functionUrl = `${supabaseUrl}/functions/v1/verify-turnstile`;
  console.log('[TurnstileService] Calling Edge Function:', functionUrl);

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    console.log('[TurnstileService] Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
      console.error('[TurnstileService] Verification failed:', {
        status: response.status,
        error: errorData.error,
        details: errorData.details,
      });
      throw new Error(errorData.error || 'Turnstile verification failed');
    }

    const data: VerifyTurnstileResponse = await response.json();
    
    if (!data.success) {
      console.error('[TurnstileService] Verification returned success=false:', data.error);
      throw new Error(data.error || 'Turnstile verification failed');
    }

    console.log('[TurnstileService] Token verified successfully');
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      console.error('[TurnstileService] Error during verification:', {
        message: error.message,
        name: error.name,
      });
      throw error;
    }
    console.error('[TurnstileService] Unknown error during verification:', error);
    throw new Error('Failed to verify Turnstile token');
  }
}
