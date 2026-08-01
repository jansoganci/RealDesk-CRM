import {
  asSensitiveError,
  consumeRateLimit,
  createSensitiveContext,
  errorResponse,
  hashTaxIdLegacy,
  isUuid,
  jsonResponse,
  SensitiveFieldError,
  sensitiveCorsHeaders,
  verifyOrgOwner,
  writeAudit,
  type SensitiveContext,
} from '../_shared/sensitive-fields.ts';

function parseBody(value: unknown): { orgId: string; taxId: string } {
  if (typeof value !== 'object' || value === null) {
    throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const body = value as Record<string, unknown>;
  if (!isUuid(body.orgId) || typeof body.taxId !== 'string' || body.taxId.length === 0) {
    throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  return { orgId: body.orgId, taxId: body.taxId };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: sensitiveCorsHeaders });
  if (req.method !== 'POST') return errorResponse(new SensitiveFieldError('METHOD_NOT_ALLOWED', 405, 'Method not allowed'));

  let context: SensitiveContext | undefined;
  let orgId: string | undefined;
  const requestId = crypto.randomUUID();
  let auditWritten = false;

  try {
    context = await createSensitiveContext(req);
    const body = parseBody(await req.json());
    orgId = body.orgId;

    try {
      await verifyOrgOwner(context.userClient, orgId);
    } catch (error) {
      const safeError = asSensitiveError(error);
      await writeAudit(context, [{
        userId: context.user.id,
        orgId,
        action: 'hash',
        entityType: 'organization',
        entityId: null,
        fieldName: 'tax_id',
        outcome: safeError.code === 'FORBIDDEN' ? 'denied' : 'failed',
        errorCode: safeError.code,
        requestId,
      }]);
      auditWritten = true;
      throw safeError;
    }

    await consumeRateLimit(context, orgId, 'hash', 1);
    const lookupHash = await hashTaxIdLegacy(body.taxId);

    await writeAudit(context, [{
      userId: context.user.id,
      orgId,
      action: 'hash',
      entityType: 'organization',
      entityId: null,
      fieldName: 'tax_id',
      outcome: 'success',
      errorCode: null,
      requestId,
    }]);
    auditWritten = true;

    return jsonResponse({ lookupHash, hashVersion: 'legacy-sha256' });
  } catch (error) {
    let safeError = asSensitiveError(error);
    if (context && orgId && !auditWritten && safeError.code !== 'AUDIT_WRITE_FAILED') {
      try {
        await writeAudit(context, [{
          userId: context.user.id,
          orgId,
          action: 'hash',
          entityType: 'organization',
          entityId: null,
          fieldName: 'tax_id',
          outcome: safeError.code === 'FORBIDDEN' ? 'denied' : 'failed',
          errorCode: safeError.code,
          requestId,
        }]);
      } catch (auditError) {
        safeError = asSensitiveError(auditError);
      }
    }
    return errorResponse(safeError);
  }
});
