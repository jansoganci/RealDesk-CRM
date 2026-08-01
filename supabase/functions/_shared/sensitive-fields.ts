import {
  createClient,
  type SupabaseClient,
  type User,
} from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const sensitiveCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const FIELD_ALLOWLIST = {
  property_owner: {
    tax_id: {
      table: 'property_owners',
      encryptedColumn: 'tc_encrypted',
      hashColumn: 'tc_hash',
    },
    routing_number: {
      table: 'property_owners',
      encryptedColumn: 'routing_number_encrypted',
    },
    account_number: {
      table: 'property_owners',
      encryptedColumn: 'account_number_encrypted',
    },
  },
  tenant: {
    tax_id: {
      table: 'tenants',
      encryptedColumn: 'tc_encrypted',
      hashColumn: 'tc_hash',
    },
  },
} as const;

export type SensitiveEntityType = keyof typeof FIELD_ALLOWLIST;
export type SensitiveField = 'tax_id' | 'routing_number' | 'account_number';
export type SensitiveOperation = 'encrypt' | 'decrypt' | 'hash';

export interface FieldConfig {
  table: 'property_owners' | 'tenants';
  encryptedColumn:
    | 'tc_encrypted'
    | 'routing_number_encrypted'
    | 'account_number_encrypted';
  hashColumn?: 'tc_hash';
}

export interface SensitiveContext {
  user: User;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
}

export interface AuditEntry {
  userId: string;
  orgId: string;
  action: SensitiveOperation;
  entityType: string;
  entityId: string | null;
  fieldName: string;
  outcome: 'success' | 'denied' | 'failed';
  errorCode: string | null;
  requestId: string;
}

export class SensitiveFieldError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'SensitiveFieldError';
  }
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new SensitiveFieldError('SERVER_CONFIGURATION_ERROR', 500, 'Required server configuration is missing');
  }
  return value;
}

function parseHex(value: string, expectedBytes?: number): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new SensitiveFieldError('INVALID_CIPHERTEXT', 400, 'Ciphertext is malformed');
  }
  if (expectedBytes !== undefined && value.length !== expectedBytes * 2) {
    throw new SensitiveFieldError('INVALID_CIPHERTEXT', 400, 'Ciphertext is malformed');
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function toHex(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function importAesKey(secretName: 'FIELD_ENCRYPTION_KEY_V1' | 'FIELD_ENCRYPTION_KEY_V2'): Promise<CryptoKey> {
  const keyHex = requiredEnv(secretName);
  if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new SensitiveFieldError('SERVER_CONFIGURATION_ERROR', 500, 'Encryption key configuration is invalid');
  }
  return crypto.subtle.importKey('raw', parseHex(keyHex, 32), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export function jsonResponse(body: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...sensitiveCorsHeaders,
      ...extraHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(error: SensitiveFieldError): Response {
  const headers: HeadersInit = {};
  if (error.retryAfter !== undefined) {
    headers['Retry-After'] = String(error.retryAfter);
  }
  return jsonResponse(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.requestId ? { requestId: error.requestId } : {}),
      },
    },
    error.status,
    headers,
  );
}

export function asSensitiveError(error: unknown): SensitiveFieldError {
  if (error instanceof SensitiveFieldError) return error;
  return new SensitiveFieldError('INTERNAL_ERROR', 500, 'Sensitive-field operation failed');
}

export async function createSensitiveContext(req: Request): Promise<SensitiveContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new SensitiveFieldError('UNAUTHORIZED', 401, 'Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length);
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) {
    throw new SensitiveFieldError('UNAUTHORIZED', 401, 'Unauthorized');
  }

  return { user, userClient, adminClient };
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function getFieldConfig(entityType: unknown, field: unknown): FieldConfig {
  if (typeof entityType !== 'string' || typeof field !== 'string') {
    throw new SensitiveFieldError('INVALID_ENTITY_FIELD', 400, 'Unsupported entity/field combination');
  }
  if (entityType !== 'property_owner' && entityType !== 'tenant') {
    throw new SensitiveFieldError('INVALID_ENTITY_FIELD', 400, 'Unsupported entity/field combination');
  }
  const entityFields = FIELD_ALLOWLIST[entityType] as Partial<Record<SensitiveField, FieldConfig>>;
  const config = entityFields[field as SensitiveField];
  if (!config) {
    throw new SensitiveFieldError('INVALID_ENTITY_FIELD', 400, 'Unsupported entity/field combination');
  }
  return config;
}

export async function verifyOrgOwner(userClient: SupabaseClient, orgId: string): Promise<void> {
  const { data, error } = await userClient.rpc('is_org_owner', { check_org_id: orgId });
  if (error) {
    throw new SensitiveFieldError('OWNERSHIP_CHECK_FAILED', 500, 'Organization access could not be verified');
  }
  if (data !== true) {
    throw new SensitiveFieldError('FORBIDDEN', 403, 'Forbidden');
  }
}

export async function consumeRateLimit(
  context: SensitiveContext,
  orgId: string,
  operation: SensitiveOperation,
  fieldCount: number,
): Promise<void> {
  const { data, error } = await context.adminClient.rpc('consume_sensitive_field_rate_limit', {
    p_user_id: context.user.id,
    p_org_id: orgId,
    p_operation: operation,
    p_field_count: fieldCount,
  });
  if (error || typeof data !== 'object' || data === null) {
    throw new SensitiveFieldError('RATE_LIMIT_CHECK_FAILED', 500, 'Rate limit could not be checked');
  }
  const result = data as Record<string, unknown>;
  if (result.allowed !== true) {
    const retryAfter = typeof result.retry_after === 'number' ? result.retry_after : 60;
    throw new SensitiveFieldError('RATE_LIMITED', 429, 'Rate limit exceeded', undefined, retryAfter);
  }
}

export async function writeAudit(context: SensitiveContext, entries: AuditEntry[]): Promise<void> {
  const rows = entries.map((entry) => ({
    user_id: entry.userId,
    org_id: entry.orgId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    field_name: entry.fieldName,
    outcome: entry.outcome,
    error_code: entry.errorCode,
    request_id: entry.requestId,
  }));
  const { error } = await context.adminClient.from('sensitive_field_access_audit').insert(rows);
  if (error) {
    throw new SensitiveFieldError('AUDIT_WRITE_FAILED', 500, 'Security audit could not be recorded');
  }
}

export function buildAad(orgId: string, entityType: SensitiveEntityType, field: SensitiveField): Uint8Array {
  return new TextEncoder().encode(`${orgId}|${entityType}|${field}`);
}

export async function encryptV2(plaintext: string, aad: Uint8Array): Promise<string> {
  const key = await importAesKey('FIELD_ENCRYPTION_KEY_V2');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `v2:k2:${toHex(iv)}:${toHex(ciphertext)}`;
}

export async function decryptCiphertext(ciphertext: string, aad: Uint8Array): Promise<string> {
  let keyName: 'FIELD_ENCRYPTION_KEY_V1' | 'FIELD_ENCRYPTION_KEY_V2';
  let ivHex: string;
  let ciphertextHex: string;
  let additionalData: Uint8Array | undefined;

  if (ciphertext.startsWith('v2:')) {
    const parts = ciphertext.split(':');
    if (parts.length !== 4 || parts[1] !== 'k2') {
      throw new SensitiveFieldError('UNSUPPORTED_CIPHERTEXT_VERSION', 400, 'Ciphertext version is not supported');
    }
    [, , ivHex, ciphertextHex] = parts;
    keyName = 'FIELD_ENCRYPTION_KEY_V2';
    additionalData = aad;
  } else if (/^[0-9a-f]{24}:[0-9a-f]+$/i.test(ciphertext)) {
    [ivHex, ciphertextHex] = ciphertext.split(':');
    keyName = 'FIELD_ENCRYPTION_KEY_V1';
  } else {
    throw new SensitiveFieldError('UNSUPPORTED_CIPHERTEXT_VERSION', 400, 'Ciphertext version is not supported');
  }

  try {
    const key = await importAesKey(keyName);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: parseHex(ivHex, 12),
        ...(additionalData ? { additionalData } : {}),
      },
      key,
      parseHex(ciphertextHex),
    );
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    if (error instanceof SensitiveFieldError) throw error;
    throw new SensitiveFieldError('DECRYPT_FAILED', 422, 'Ciphertext could not be decrypted');
  }
}

export async function hashTaxIdLegacy(taxId: string): Promise<string> {
  const normalized = taxId.replace(/\D/g, '');
  if (!normalized) {
    throw new SensitiveFieldError('INVALID_TAX_ID', 400, 'Tax ID is invalid');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return toHex(digest);
}
