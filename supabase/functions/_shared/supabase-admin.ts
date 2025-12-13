/**
 * Supabase Admin Client
 *
 * This file creates a Supabase client with SERVICE ROLE permissions.
 * Used in Edge Functions that need to bypass RLS (e.g., webhooks).
 *
 * IMPORTANT: Set the secret in Supabase:
 * supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *
 * ⚠️ WARNING: Service role bypasses ALL RLS policies. Use carefully!
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { Database } from '../../../src/types/supabase.ts';

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');

  if (!url) {
    throw new Error(
      'SUPABASE_URL environment variable not set. ' +
      'This should be automatically available in Supabase Edge Functions.'
    );
  }

  return url;
}

/**
 * Get Supabase Service Role Key from environment
 * This key has ADMIN permissions and bypasses RLS
 */
function getServiceRoleKey(): string {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable not set. ' +
      'Please run: supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."'
    );
  }

  if (!key.startsWith('eyJ')) {
    throw new Error(
      'Invalid SUPABASE_SERVICE_ROLE_KEY format. ' +
      'Service role key should start with "eyJ" (JWT format)'
    );
  }

  return key;
}

/**
 * Create Supabase Admin Client
 * This client bypasses Row Level Security (RLS)
 *
 * USE CASES:
 * - Webhook handlers (need to write subscription data regardless of user context)
 * - Admin operations that require elevated permissions
 * - Background jobs that don't run in user context
 *
 * DO NOT USE for:
 * - User-facing endpoints (use user JWT instead)
 * - Operations that should respect RLS
 */
export const supabaseAdmin = createClient<Database>(
  getSupabaseUrl(),
  getServiceRoleKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get Supabase Anon Key from environment
 * Used for creating user-context clients
 */
function getAnonKey(): string {
  const key = Deno.env.get('SUPABASE_ANON_KEY');

  if (!key) {
    throw new Error(
      'SUPABASE_ANON_KEY environment variable not set. ' +
      'This should be automatically available in Supabase Edge Functions.'
    );
  }

  return key;
}

/**
 * Create Supabase Client with User Context
 * This client respects Row Level Security (RLS)
 *
 * @param accessToken - User's JWT access token from Authorization header
 * @returns Supabase client authenticated as the user
 *
 * USE CASES:
 * - User-facing Edge Functions (create-checkout-session)
 * - Operations that should respect RLS
 * - Reading user-specific data
 */
export function createUserClient(accessToken: string) {
  return createClient<Database>(getSupabaseUrl(), getAnonKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extract user from Authorization header
 *
 * @param req - HTTP Request object
 * @returns User object from JWT
 * @throws Error if no valid authorization header
 */
export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('Invalid Authorization header format');
  }

  // Create user-context client to verify token
  const supabase = createUserClient(token);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

/**
 * Helper: Create JSON response
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Helper: Create error response
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): Response {
  return jsonResponse(
    {
      error: message,
      ...(details && { details }),
    },
    status
  );
}

/**
 * Helper: CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};
