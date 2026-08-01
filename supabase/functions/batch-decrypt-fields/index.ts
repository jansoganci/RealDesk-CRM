import {
  asSensitiveError,
  buildAad,
  consumeRateLimit,
  createSensitiveContext,
  decryptCiphertext,
  errorResponse,
  getFieldConfig,
  isUuid,
  jsonResponse,
  SensitiveFieldError,
  sensitiveCorsHeaders,
  verifyOrgOwner,
  writeAudit,
  type AuditEntry,
  type FieldConfig,
  type SensitiveContext,
  type SensitiveEntityType,
  type SensitiveField,
} from '../_shared/sensitive-fields.ts';

interface DecryptItem {
  requestId: string;
  entityType: SensitiveEntityType;
  entityId: string;
  field: SensitiveField;
  config: FieldConfig;
}

interface ResolvedDecryptItem extends DecryptItem {
  orgId: string;
  ciphertext: string;
}

function parseBody(value: unknown): DecryptItem[] {
  if (typeof value !== 'object' || value === null) {
    throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request body is invalid');
  }
  return body.items.map((rawItem) => {
    if (typeof rawItem !== 'object' || rawItem === null) {
      throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request item is invalid');
    }
    const item = rawItem as Record<string, unknown>;
    const requestId = typeof item.requestId === 'string' ? item.requestId : '';
    if (!requestId || requestId.length > 100 || !isUuid(item.entityId)) {
      throw new SensitiveFieldError('INVALID_REQUEST', 400, 'Request item is invalid', requestId || undefined);
    }
    try {
      const config = getFieldConfig(item.entityType, item.field);
      return {
        requestId,
        entityType: item.entityType as SensitiveEntityType,
        entityId: item.entityId,
        field: item.field as SensitiveField,
        config,
      };
    } catch (error) {
      const safeError = asSensitiveError(error);
      throw new SensitiveFieldError(safeError.code, safeError.status, safeError.message, requestId);
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: sensitiveCorsHeaders });
  if (req.method !== 'POST') return errorResponse(new SensitiveFieldError('METHOD_NOT_ALLOWED', 405, 'Method not allowed'));

  let context: SensitiveContext | undefined;
  let resolved: ResolvedDecryptItem[] = [];
  let auditWritten = false;

  try {
    context = await createSensitiveContext(req);
    const items = parseBody(await req.json());

    for (const item of items) {
      const { data: orgData, error: orgError } = await context.userClient
        .from(item.config.table)
        .select('org_id')
        .eq('id', item.entityId)
        .maybeSingle();
      if (orgError || !orgData) {
        const { data: auditTarget } = await context.adminClient
          .from(item.config.table)
          .select('org_id')
          .eq('id', item.entityId)
          .maybeSingle();
        const target = auditTarget as Record<string, unknown> | null;
        if (target && isUuid(target.org_id)) {
          await writeAudit(context, [{
            userId: context.user.id,
            orgId: target.org_id,
            action: 'decrypt',
            entityType: item.entityType,
            entityId: item.entityId,
            fieldName: item.field,
            outcome: 'denied',
            errorCode: 'NOT_FOUND',
            requestId: item.requestId,
          }]);
          auditWritten = true;
        }
        throw new SensitiveFieldError('NOT_FOUND', 404, 'Sensitive field was not found', item.requestId);
      }
      const orgRecord = orgData as Record<string, unknown>;
      const orgId = orgRecord.org_id;
      if (!isUuid(orgId)) {
        throw new SensitiveFieldError('NOT_FOUND', 404, 'Sensitive field was not found', item.requestId);
      }

      try {
        await verifyOrgOwner(context.userClient, orgId);
      } catch (error) {
        const safeError = asSensitiveError(error);
        await writeAudit(context, [{
          userId: context.user.id,
          orgId,
          action: 'decrypt',
          entityType: item.entityType,
          entityId: item.entityId,
          fieldName: item.field,
          outcome: safeError.code === 'FORBIDDEN' ? 'denied' : 'failed',
          errorCode: safeError.code,
          requestId: item.requestId,
        }]);
        auditWritten = true;
        throw safeError;
      }

      const { data: encryptedData, error: encryptedError } = await context.userClient
        .from(item.config.table)
        .select(item.config.encryptedColumn)
        .eq('id', item.entityId)
        .maybeSingle();
      const encryptedRecord = encryptedData as Record<string, unknown> | null;
      const ciphertext = encryptedRecord?.[item.config.encryptedColumn];
      if (encryptedError || typeof ciphertext !== 'string' || ciphertext.length === 0) {
        throw new SensitiveFieldError('NOT_FOUND', 404, 'Sensitive field was not found', item.requestId);
      }
      resolved.push({ ...item, orgId, ciphertext });
    }

    const orgCounts = new Map<string, number>();
    for (const item of resolved) orgCounts.set(item.orgId, (orgCounts.get(item.orgId) ?? 0) + 1);
    for (const [orgId, fieldCount] of orgCounts) {
      await consumeRateLimit(context, orgId, 'decrypt', fieldCount);
    }

    const results = [];
    for (const item of resolved) {
      try {
        const plaintext = await decryptCiphertext(
          item.ciphertext,
          buildAad(item.orgId, item.entityType, item.field),
        );
        results.push({ requestId: item.requestId, plaintext });
      } catch (error) {
        const safeError = asSensitiveError(error);
        throw new SensitiveFieldError(safeError.code, safeError.status, safeError.message, item.requestId);
      }
    }

    await writeAudit(context, resolved.map((item): AuditEntry => ({
      userId: context!.user.id,
      orgId: item.orgId,
      action: 'decrypt',
      entityType: item.entityType,
      entityId: item.entityId,
      fieldName: item.field,
      outcome: 'success',
      errorCode: null,
      requestId: item.requestId,
    })));
    auditWritten = true;

    return jsonResponse({ items: results });
  } catch (error) {
    let safeError = asSensitiveError(error);
    if (context && resolved.length > 0 && !auditWritten && safeError.code !== 'AUDIT_WRITE_FAILED') {
      try {
        await writeAudit(context, resolved.map((item): AuditEntry => ({
          userId: context!.user.id,
          orgId: item.orgId,
          action: 'decrypt',
          entityType: item.entityType,
          entityId: item.entityId,
          fieldName: item.field,
          outcome: safeError.code === 'FORBIDDEN' || safeError.code === 'NOT_FOUND' ? 'denied' : 'failed',
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
