/**
 * Shared helpers for anonymous CCPA Edge Functions.
 * Fail-closed; never log plaintext PII (name/email/phone/details).
 */

import { supabaseAdmin, jsonResponse, errorResponse, corsHeaders } from './supabase-admin.ts';

export { jsonResponse, errorResponse, corsHeaders };

export const CCPA_REQUEST_TYPES = [
  'know',
  'delete',
  'opt_out_sale',
  'opt_out_share',
  'correct',
] as const;

export const CCPA_RELATIONSHIPS = [
  'tenant',
  'buyer',
  'seller',
  'lead',
  'other',
] as const;

export type CcpaRequestType = (typeof CCPA_REQUEST_TYPES)[number];
export type CcpaRelationship = (typeof CCPA_RELATIONSHIPS)[number];
export type CcpaAction = 'submit' | 'status_check';
export type CcpaOutcome = 'success' | 'denied' | 'failed';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Submit: 5/hour per IP, 3/hour per email. Status: 30/hour per IP. */
export const RATE_LIMITS = {
  submitIp: { limit: 5, windowSeconds: 3600 },
  submitEmail: { limit: 3, windowSeconds: 3600 },
  statusIp: { limit: 30, windowSeconds: 3600 },
} as const;

export class CcpaError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'CcpaError';
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf && cf.trim()) return cf.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  return 'unknown';
}

export async function hashIp(req: Request): Promise<string> {
  return sha256Hex(`ip:${getClientIp(req)}`);
}

export async function hashEmail(email: string): Promise<string> {
  return sha256Hex(`email:${normalizeEmail(email)}`);
}

export async function verifyTurnstile(token: string, remoteIp?: string): Promise<void> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) {
    console.error('[ccpa] TURNSTILE_SECRET_KEY not configured');
    throw new CcpaError('SERVER_MISCONFIGURED', 500, 'Service temporarily unavailable');
  }

  if (!token || typeof token !== 'string' || token.length > 2048) {
    throw new CcpaError('TURNSTILE_FAILED', 400, 'Captcha verification failed');
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp && remoteIp !== 'unknown') {
    body.set('remoteip', remoteIp);
  }

  let result: { success?: boolean };
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    result = await response.json();
  } catch (err) {
    console.error('[ccpa] Turnstile siteverify network error', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new CcpaError('TURNSTILE_FAILED', 400, 'Captcha verification failed');
  }

  if (!result?.success) {
    throw new CcpaError('TURNSTILE_FAILED', 400, 'Captcha verification failed');
  }
}

export async function consumeRateLimit(
  scopeKind: 'ip' | 'email',
  scopeKey: string,
  operation: CcpaAction,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  // RPC added in migration 0050; generated Database types may lag.
  // deno-lint-ignore no-explicit-any
  const { data, error } = await (supabaseAdmin as any).rpc('consume_ccpa_rate_limit', {
    p_scope_kind: scopeKind,
    p_scope_key: scopeKey,
    p_operation: operation,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('[ccpa] rate limit RPC failed', { code: error.code });
    throw new CcpaError('RATE_LIMIT_ERROR', 500, 'Service temporarily unavailable');
  }

  const result = data as { allowed?: boolean; retry_after?: number } | null;
  if (!result?.allowed) {
    throw new CcpaError(
      'RATE_LIMITED',
      429,
      'Too many requests. Please try again later.',
      typeof result?.retry_after === 'number' ? result.retry_after : 60,
    );
  }
}

export async function writeCcpaAudit(entry: {
  action: CcpaAction;
  orgId?: string | null;
  requestId?: string | null;
  outcome: CcpaOutcome;
  errorCode?: string | null;
  ipHash: string;
  emailHash?: string | null;
}): Promise<void> {
  // Table added in migration 0050; generated Database types may lag.
  // deno-lint-ignore no-explicit-any
  const { error } = await (supabaseAdmin as any).from('ccpa_request_audit').insert({
    action: entry.action,
    org_id: entry.orgId ?? null,
    request_id: entry.requestId ?? null,
    outcome: entry.outcome,
    error_code: entry.errorCode ?? null,
    ip_hash: entry.ipHash,
    email_hash: entry.emailHash ?? null,
  });

  if (error) {
    console.error('[ccpa] audit insert failed', { code: error.code });
  }
}

export function ccpaErrorResponse(err: unknown): Response {
  if (err instanceof CcpaError) {
    const headers: Record<string, string> = { ...corsHeaders };
    if (err.retryAfter !== undefined) {
      headers['Retry-After'] = String(err.retryAfter);
    }
    return errorResponse(err.message, err.status, headers, { code: err.code });
  }

  console.error('[ccpa] unexpected error', {
    error: err instanceof Error ? err.message : 'unknown',
  });
  return errorResponse('Internal server error', 500, corsHeaders, { code: 'INTERNAL' });
}

export function asCcpaError(err: unknown): CcpaError {
  if (err instanceof CcpaError) return err;
  return new CcpaError('INTERNAL', 500, 'Internal server error');
}

export async function orgExists(orgId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[ccpa] org lookup failed', { code: error.code });
    throw new CcpaError('ORG_LOOKUP_FAILED', 500, 'Service temporarily unavailable');
  }

  return !!data?.id;
}
