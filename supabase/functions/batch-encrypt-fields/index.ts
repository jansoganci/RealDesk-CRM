import {
  asSensitiveError,
  buildAad,
  consumeRateLimit,
  createSensitiveContext,
  encryptV2,
  errorResponse,
  getFieldConfig,
  isUuid,
  jsonResponse,
  SensitiveFieldError,
  sensitiveCorsHeaders,
  verifyOrgOwner,
  writeAudit,
  type AuditEntry,
  type SensitiveContext,
  type SensitiveEntityType,
  type SensitiveField,
} from '../_shared/sensitive-fields.ts';

interface EncryptItem {
  requestId: string;
  entityType: SensitiveEntityType;
  field: SensitiveField;
  plaintext: string;
}

function parseBody(value: unknown): { orgId: string; items: EncryptItem[] } {
  if (typeof value !== 'object' || value === null) {
    throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const body = value as Record<string, unknown>;
  if (!isUuid(body.orgId) || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const items = body.items.map((rawItem) => {
    if (typeof rawItem !== 'object' || rawItem === null) {
      throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request item is invalid');
    }
    const item = rawItem as Record<string, unknown>;
    const requestId = typeof item.requestId === 'string' ? item.requestId : '';
    if (!requestId || requestId.length > 100 || typeof item.plaintext !== 'string' || item.plaintext.length === 0) {
      throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request item is invalid', requestId || undefined);
    }
    try {
      getFieldConfig(item.entityType, item.field);
    } catch (error) {
      const safeError = asSensitiveError(error);
      throw new SensitiveFieldError(safeError.code, safeError.status, safeError.message, requestId);
    }
    return {
      requestId,
      entityType: item.entityType as SensitiveEntityType,
      field: item.field as SensitiveField,
      plaintext: item.plaintext,
    };
  });
  return { orgId: body.orgId, items };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: sensitiveCorsHeaders });
  if (req.method !== 'POST') return errorResponse(new SensitiveFieldError('METHOD_NOT_ALLOWED', 405, 'Method not allowed'));

  let context: SensitiveContext | undefined;
  let parsed: ReturnType<typeof parseBody> | undefined;
  let auditWritten = false;

  try {
    context = await createSensitiveContext(req);
    parsed = parseBody(await req.json());

    try {
      await verifyOrgOwner(context.userClient, parsed.orgId);
    } catch (error) {
      const safeError = asSensitiveError(error);
      await writeAudit(context, parsed.items.map((item): AuditEntry => ({
        userId: context!.user.id,
        orgId: parsed!.orgId,
        action: 'encrypt',
        entityType: item.entityType,
        entityId: null,
        fieldName: item.field,
        outcome: safeError.code === 'FORBIDDEN' ? 'denied' : 'failed',
        errorCode: safeError.code,
        requestId: item.requestId,
      })));
      auditWritten = true;
      throw safeError;
    }

    await consumeRateLimit(context, parsed.orgId, 'encrypt', parsed.items.length);

    const results = [];
    for (const item of parsed.items) {
      try {
        const ciphertext = await encryptV2(item.plaintext, buildAad(parsed.orgId, item.entityType, item.field));
        results.push({ requestId: item.requestId, ciphertext });
      } catch (error) {
        const safeError = asSensitiveError(error);
        throw new SensitiveFieldError(safeError.code, safeError.status, safeError.message, item.requestId);
      }
    }

    await writeAudit(context, parsed.items.map((item): AuditEntry => ({
      userId: context!.user.id,
      orgId: parsed!.orgId,
      action: 'encrypt',
      entityType: item.entityType,
      entityId: null,
      fieldName: item.field,
      outcome: 'success',
      errorCode: null,
      requestId: item.requestId,
    })));
    auditWritten = true;

    return jsonResponse({ items: results });
  } catch (error) {
    let safeError = asSensitiveError(error);
    if (context && parsed && !auditWritten && safeError.code !== 'AUDIT_WRITE_FAILED') {
      try {
        await writeAudit(context, parsed.items.map((item): AuditEntry => ({
          userId: context!.user.id,
          orgId: parsed!.orgId,
          action: 'encrypt',
          entityType: item.entityType,
          entityId: null,
          fieldName: item.field,
          outcome: safeError.code === 'FORBIDDEN' ? 'denied' : 'failed',
          errorCode: safeError.code,
          requestId: item.requestId,
        })));
      } catch (auditError) {
        safeError = asSensitiveError(auditError);
      }
    }
    return errorResponse(safeError);
  }
});
