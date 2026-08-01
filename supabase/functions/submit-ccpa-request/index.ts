/**
 * Anonymous CCPA request submission.
 *
 * POST /functions/v1/submit-ccpa-request
 * Body: {
 *   orgId, requestType, requesterName, requesterEmail,
 *   requesterPhone?, relationshipToOrg, relationshipDescription?,
 *   details?, turnstileToken
 * }
 * Returns: { requestId }
 *
 * Secrets: TURNSTILE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Deploy: supabase functions deploy submit-ccpa-request
 */

import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  CCPA_RELATIONSHIPS,
  CCPA_REQUEST_TYPES,
  RATE_LIMITS,
  asCcpaError,
  ccpaErrorResponse,
  consumeRateLimit,
  corsHeaders,
  getClientIp,
  hashEmail,
  hashIp,
  isUuid,
  jsonResponse,
  normalizeEmail,
  orgExists,
  verifyTurnstile,
  writeCcpaAudit,
  CcpaError,
  type CcpaRelationship,
  type CcpaRequestType,
} from '../_shared/ccpa.ts';

interface SubmitBody {
  orgId: string;
  requestType: CcpaRequestType;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  relationshipToOrg: CcpaRelationship;
  relationshipDescription: string | null;
  details: string | null;
  turnstileToken: string;
}

function optionalString(value: unknown, maxLen: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  return trimmed;
}

function parseBody(value: unknown): SubmitBody {
  if (typeof value !== 'object' || value === null) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const body = value as Record<string, unknown>;

  if (!isUuid(body.orgId)) {
    throw new CcpaError('INVALID_ORG', 400, 'Invalid or missing organization');
  }

  if (
    typeof body.requestType !== 'string' ||
    !(CCPA_REQUEST_TYPES as readonly string[]).includes(body.requestType)
  ) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }

  if (typeof body.requesterName !== 'string' || body.requesterName.trim().length < 2) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const requesterName = body.requesterName.trim().slice(0, 200);

  if (typeof body.requesterEmail !== 'string') {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const requesterEmail = normalizeEmail(body.requesterEmail);
  if (!requesterEmail || requesterEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }

  if (
    typeof body.relationshipToOrg !== 'string' ||
    !(CCPA_RELATIONSHIPS as readonly string[]).includes(body.relationshipToOrg)
  ) {
    throw new CcpaError('INVALID_REQUEST', 400, 'Request body is invalid');
  }

  if (typeof body.turnstileToken !== 'string' || !body.turnstileToken.trim()) {
    throw new CcpaError('TURNSTILE_FAILED', 400, 'Captcha verification failed');
  }

  return {
    orgId: body.orgId,
    requestType: body.requestType as CcpaRequestType,
    requesterName,
    requesterEmail,
    requesterPhone: optionalString(body.requesterPhone, 40),
    relationshipToOrg: body.relationshipToOrg as CcpaRelationship,
    relationshipDescription: optionalString(body.relationshipDescription, 1000),
    details: optionalString(body.details, 5000),
    turnstileToken: body.turnstileToken.trim(),
  };
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
  let orgId: string | null = null;

  try {
    ipHash = await hashIp(req);
    const parsed = parseBody(await req.json());
    orgId = parsed.orgId;
    emailHash = await hashEmail(parsed.requesterEmail);

    await verifyTurnstile(parsed.turnstileToken, getClientIp(req));

    try {
      await consumeRateLimit(
        'ip',
        ipHash,
        'submit',
        RATE_LIMITS.submitIp.limit,
        RATE_LIMITS.submitIp.windowSeconds,
      );
      await consumeRateLimit(
        'email',
        emailHash,
        'submit',
        RATE_LIMITS.submitEmail.limit,
        RATE_LIMITS.submitEmail.windowSeconds,
      );
    } catch (err) {
      const safe = asCcpaError(err);
      await writeCcpaAudit({
        action: 'submit',
        orgId,
        outcome: safe.code === 'RATE_LIMITED' ? 'denied' : 'failed',
        errorCode: safe.code,
        ipHash,
        emailHash,
      });
      throw safe;
    }

    const exists = await orgExists(parsed.orgId);
    if (!exists) {
      await writeCcpaAudit({
        action: 'submit',
        orgId: parsed.orgId,
        outcome: 'denied',
        errorCode: 'ORG_NOT_FOUND',
        ipHash,
        emailHash,
      });
      throw new CcpaError('ORG_NOT_FOUND', 404, 'Invalid or missing organization');
    }

    // Types may lag until gen:types; service-role insert is intentional.
    // deno-lint-ignore no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('data_subject_requests')
      .insert({
        org_id: parsed.orgId,
        requested_by: null,
        requester_name: parsed.requesterName,
        requester_email: parsed.requesterEmail,
        requester_phone: parsed.requesterPhone,
        relationship_to_org: parsed.relationshipToOrg,
        relationship_description: parsed.relationshipDescription,
        request_type: parsed.requestType,
        details: parsed.details,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      console.error('[submit-ccpa-request] insert failed', { code: error?.code });
      await writeCcpaAudit({
        action: 'submit',
        orgId: parsed.orgId,
        outcome: 'failed',
        errorCode: 'INSERT_FAILED',
        ipHash,
        emailHash,
      });
      throw new CcpaError('INSERT_FAILED', 500, 'Failed to submit request');
    }

    await writeCcpaAudit({
      action: 'submit',
      orgId: parsed.orgId,
      requestId: data.id,
      outcome: 'success',
      ipHash,
      emailHash,
    });

    console.log('[submit-ccpa-request] success', { requestId: data.id });
    return jsonResponse({ requestId: data.id }, 200, corsHeaders);
  } catch (err) {
    if (!(err instanceof CcpaError)) {
      await writeCcpaAudit({
        action: 'submit',
        orgId,
        outcome: 'failed',
        errorCode: 'INTERNAL',
        ipHash,
        emailHash,
      });
    }
    return ccpaErrorResponse(err);
  }
});
