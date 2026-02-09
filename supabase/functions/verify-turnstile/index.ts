/**
 * Supabase Edge Function: Verify Turnstile Token
 *
 * This function verifies Cloudflare Turnstile tokens by calling Cloudflare's API.
 * It's a PUBLIC endpoint (no authentication required) used before user authentication.
 *
 * Setup:
 * 1. Deploy: supabase functions deploy verify-turnstile
 * 2. Set secret: supabase secrets set TURNSTILE_SECRET_KEY="your-secret-key"
 *
 * Usage:
 * POST /functions/v1/verify-turnstile
 * Body: { token: string }
 *
 * Response (success):
 * { success: true }
 *
 * Response (error):
 * { error: string }
 */

import {
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase-admin.ts';

Deno.serve(async (req) => {
  console.log('🔐 [EdgeFunction] verify-turnstile invoked');
  console.log('📥 [EdgeFunction] Request method:', req.method);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ [EdgeFunction] CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Parse request body
    console.log('📦 [EdgeFunction] STEP 1: Parsing request body...');
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return errorResponse('Missing required field: token', 400, corsHeaders);
    }

    console.log('📋 [EdgeFunction] Token received (first 10 chars):', token.substring(0, 10) + '...');

    // 2. Get Turnstile secret key from environment
    console.log('🔍 [EdgeFunction] STEP 2: Getting Turnstile secret key...');
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');

    if (!secretKey) {
      console.error('❌ [EdgeFunction] TURNSTILE_SECRET_KEY not set');
      return errorResponse(
        'Server configuration error: Turnstile secret key not configured',
        500,
        corsHeaders
      );
    }

    // 3. Verify token with Cloudflare API
    console.log('🌐 [EdgeFunction] STEP 3: Verifying token with Cloudflare API...');
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    if (!verifyResponse.ok) {
      const statusText = verifyResponse.statusText || 'Unknown error';
      console.error('❌ [EdgeFunction] Cloudflare API request failed:', {
        status: verifyResponse.status,
        statusText,
      });
      return errorResponse(
        `Failed to verify token with Cloudflare API: HTTP ${verifyResponse.status} ${statusText}`,
        500,
        corsHeaders
      );
    }

    const verifyResult = await verifyResponse.json();
    console.log('📊 [EdgeFunction] Cloudflare verification result:', {
      success: verifyResult.success,
      errorCodes: verifyResult['error-codes'] || [],
    });

    // 4. Check verification result
    if (!verifyResult.success) {
      const errorCodes = verifyResult['error-codes'] || [];
      const errorMessage = errorCodes.length > 0
        ? `Turnstile verification failed: ${errorCodes.join(', ')}`
        : 'Token verification failed - no error codes provided';

      console.warn('⚠️ [EdgeFunction] Token verification failed:', {
        errorCodes,
        hasErrorCodes: errorCodes.length > 0,
      });
      return errorResponse(errorMessage, 400, corsHeaders, {
        errorCodes,
        details: 'Token was rejected by Cloudflare Turnstile',
      });
    }

    // 5. Return success response
    console.log('✅ [EdgeFunction] Token verified successfully');
    return jsonResponse(
      {
        success: true,
      },
      200,
      corsHeaders
    );

  } catch (error) {
    const errorDetails = error instanceof Error
      ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        }
      : { error: String(error) };

    console.error('❌ [EdgeFunction] Unexpected error:', errorDetails);

    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred during token verification';

    return errorResponse(
      `Failed to verify token: ${errorMessage}`,
      500,
      corsHeaders,
      {
        error: errorMessage,
        details: errorDetails,
        type: 'unexpected_error',
      }
    );
  }
});
