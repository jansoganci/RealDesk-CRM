/**
 * Anonymous CCPA request status check.
 *
 * POST /functions/v1/check-ccpa-request-status
 * Body: { requestId, requesterEmail }
 * Returns: { status, requestType, submittedAt }
 *
 * requestId + email act as a shared-secret pair.
 *
 * Deploy: supabase functions deploy check-ccpa-request-status
 */

import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  RATE_LIMITS,
  asCcpaError,
  ccpaErrorResponse,
  consumeRateLimit,
  corsHeaders,
  hashEmail,
  hashIp,
  isUuid,
  jsonResponse,
  normalizeEmail,
  writeCcpaAudit,
  CcpaError,
} from '../_shared/ccpa.ts';

interface StatusBody {
  requestId: string;
  requesterEmail: string;
}

function parseBody(value: unknown): StatusBody {
  if (typeof value !== 'object' || value === null) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const body = value as Record<string, unknown>;

  if (!isUuid(body.requestId)) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }

  if (typeof body.requesterEmail !== 'string') {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const requesterEmail = normalizeEmail(body.requesterEmail);
  if (!requesterEmail || requesterEmail.length > 320) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }

  return { requestId: body.requestId, requesterEmail };
}

/** Generic not-found — do not reveal whether the ID exists. */
function notFound(): CcpaError {
  return new CcpaError('NOT_FOUND', 404, 'Request not found');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return ccpaErrorResponse(new CcpaError('METHOD_NOT_ALLOWED', 405, 'Method not allowed'));
  }

  let ipHash = 'unknown';
  let emailHash: string | null = null;

  try {
    ipHash = await hashIp(req);
    const parsed = parseBody(await req.json());
    emailHash = await hashEmail(parsed.requesterEmail);

    try {
      await consumeRateLimit(
        'ip',
        ipHash,
        'status_check',
        RATE_LIMITS.statusIp.limit,
        RATE_LIMITS.statusIp.windowSeconds,
      );
    } catch (err) {
      const safe = asCcpaError(err);
      await writeCcpaAudit({
        action: 'status_check',
        requestId: parsed.requestId,
        outcome: safe.code === 'RATE_LIMITED' ? 'denied' : 'failed',
        errorCode: safe.code,
        ipHash,
        emailHash,
      });
      throw safe;
    }

    // deno-lint-ignore no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('data_subject_requests')
      .select('id, org_id, requester_email, request_type, status, created_at, deleted_at')
      .eq('id', parsed.requestId)
      .maybeSingle();

    if (error) {
      console.error('[check-ccpa-request-status] lookup failed', { code: error.code });
      await writeCcpaAudit({
        action: 'status_check',
        requestId: parsed.requestId,
        outcome: 'failed',
        errorCode: 'LOOKUP_FAILED',
        ipHash,
        emailHash,
      });
      throw new CcpaError('LOOKUP_FAILED', 500, 'Service temporarily unavailable');
    }

    if (!data || data.deleted_at) {
      await writeCcpaAudit({
        action: 'status_check',
        requestId: parsed.requestId,
        outcome: 'denied',
        errorCode: 'NOT_FOUND',
        ipHash,
        emailHash,
      });
      throw notFound();
    }

    const storedEmail = normalizeEmail(String(data.requester_email ?? ''));
    if (storedEmail !== parsed.requesterEmail) {
      await writeCcpaAudit({
        action: 'status_check',
        orgId: data.org_id,
        requestId: parsed.requestId,
        outcome: 'denied',
        errorCode: 'EMAIL_MISMATCH',
        ipHash,
        emailHash,
      });
      throw notFound();
    }

    await writeCcpaAudit({
      action: 'status_check',
      orgId: data.org_id,
      requestId: data.id,
      outcome: 'success',
      ipHash,
      emailHash,
    });

    return jsonResponse(
      {
        status: data.status,
        requestType: data.request_type,
        submittedAt: data.created_at,
      },
      200,
      corsHeaders,
    );
  } catch (err) {
    return ccpaErrorResponse(err);
  }
});
