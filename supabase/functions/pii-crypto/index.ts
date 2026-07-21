import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import type { Database } from '../../../src/types/database.ts';
import {
  decryptWithKeys,
  encryptWithKey,
  PiiCryptoError,
} from '../_shared/pii-crypto.ts';

const MAX_REQUEST_BYTES = 8 * 1024;
const MAX_PLAINTEXT_LENGTH = 64;
const MAX_DECRYPT_FIELDS = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 60;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://realdesk.app',
  'https://www.realdesk.app',
  'http://localhost:5173',
] as const;

type PiiField = 'tax_id' | 'routing_number' | 'account_number' | 'legacy_bank_payload';
type DecryptablePiiField = Exclude<PiiField, 'legacy_bank_payload'>;
type EntityType = 'property_owner' | 'tenant';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface EncryptRequest {
  action: 'encrypt';
  field: PiiField;
  plaintext: string;
}

interface DecryptRequest {
  action: 'decrypt';
  entityType: EntityType;
  entityId: string;
  fields: DecryptablePiiField[];
}

class RequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
  }
}

const rateLimits = new Map<string, RateLimitEntry>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPiiField(value: unknown): value is PiiField {
  return value === 'tax_id' ||
    value === 'routing_number' ||
    value === 'account_number' ||
    value === 'legacy_bank_payload';
}

function isDecryptablePiiField(value: unknown): value is DecryptablePiiField {
  return value === 'tax_id' || value === 'routing_number' || value === 'account_number';
}

function isEntityType(value: unknown): value is EntityType {
  return value === 'property_owner' || value === 'tenant';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateRoutingNumber(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1] as const;
  const sum = Array.from(value).reduce(
    (total, digit, index) => total + Number.parseInt(digit, 10) * weights[index]!,
    0,
  );
  return sum % 10 === 0;
}

function validatePlaintext(field: PiiField, plaintext: string): void {
  if (plaintext.length > MAX_PLAINTEXT_LENGTH) {
    throw new RequestError('Sensitive value is too long', 400);
  }

  if (field === 'tax_id' && plaintext !== '' && !/^\d{2}-?\d{7}$/.test(plaintext.trim())) {
    throw new RequestError('Invalid Tax ID format', 400);
  }

  if (field === 'routing_number' && !validateRoutingNumber(plaintext)) {
    throw new RequestError('Invalid routing number', 400);
  }

  if (field === 'account_number' && !/^\d{4,17}$/.test(plaintext)) {
    throw new RequestError('Invalid account number', 400);
  }

  if (field === 'legacy_bank_payload') {
    const [routingNumber, accountNumber, extra] = plaintext.split('|');
    if (
      extra !== undefined ||
      !routingNumber ||
      !accountNumber ||
      !validateRoutingNumber(routingNumber) ||
      !/^\d{4,17}$/.test(accountNumber)
    ) {
      throw new RequestError('Invalid bank data', 400);
    }
  }
}

function parseRequest(value: unknown): EncryptRequest | DecryptRequest {
  if (!isRecord(value)) throw new RequestError('Invalid request body', 400);

  if (value.action === 'encrypt') {
    if (!isPiiField(value.field) || typeof value.plaintext !== 'string') {
      throw new RequestError('Invalid encryption request', 400);
    }
    validatePlaintext(value.field, value.plaintext);
    return { action: 'encrypt', field: value.field, plaintext: value.plaintext };
  }

  if (value.action === 'decrypt') {
    if (
      !isEntityType(value.entityType) ||
      typeof value.entityId !== 'string' ||
      !isUuid(value.entityId) ||
      !Array.isArray(value.fields) ||
      value.fields.length === 0 ||
      value.fields.length > MAX_DECRYPT_FIELDS ||
      !value.fields.every(isDecryptablePiiField)
    ) {
      throw new RequestError('Invalid decryption request', 400);
    }

    const fields = [...new Set(value.fields)];
    if (value.entityType === 'tenant' && fields.some((field) => field !== 'tax_id')) {
      throw new RequestError('Unsupported tenant field', 400);
    }

    return {
      action: 'decrypt',
      entityType: value.entityType,
      entityId: value.entityId,
      fields,
    };
  }

  throw new RequestError('Unsupported action', 400);
}

function getAllowedOrigins(): Set<string> {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };

  if (origin && getAllowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function getAccessToken(req: Request): string {
  const authHeader = req.headers.get('Authorization');
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new RequestError('Unauthorized', 401);
  return match[1];
}

function getEncryptionKeys(): readonly string[] {
  const currentKey = Deno.env.get('PII_ENCRYPTION_KEY');
  if (!currentKey) throw new RequestError('Encryption service unavailable', 503);
  const legacyKey = Deno.env.get('PII_ENCRYPTION_KEY_LEGACY');
  return legacyKey && legacyKey !== currentKey ? [currentKey, legacyKey] : [currentKey];
}

function enforceRateLimit(userId: string): void {
  const now = Date.now();
  if (rateLimits.size > 10_000) {
    for (const [entryUserId, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(entryUserId);
    }
  }
  const current = rateLimits.get(userId);
  if (!current || current.resetAt <= now) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  if (current.count >= RATE_LIMIT_REQUESTS) {
    throw new RequestError('Too many requests', 429);
  }
  current.count += 1;
}

async function readJsonBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new RequestError('Content-Type must be application/json', 415);
  }

  const contentLength = Number(req.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw new RequestError('Request body is too large', 413);
  }

  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    throw new RequestError('Request body is too large', 413);
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new RequestError('Invalid JSON body', 400);
  }
}

async function decryptPropertyOwner(
  client: ReturnType<typeof createUserClient>,
  entityId: string,
  fields: readonly DecryptablePiiField[],
  keys: readonly string[],
): Promise<Partial<Record<DecryptablePiiField, string>>> {
  const { data, error } = await client
    .from('property_owners')
    .select('tc_encrypted, tax_id, routing_number_encrypted, account_number_encrypted, iban_encrypted')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) throw new RequestError('Sensitive record not found', 404);

  const result: Partial<Record<DecryptablePiiField, string>> = {};
  let legacyBankPayload: string | undefined;

  if (
    fields.some((field) => field === 'routing_number' || field === 'account_number') &&
    data.iban_encrypted
  ) {
    legacyBankPayload = await decryptWithKeys(data.iban_encrypted, keys);
  }

  for (const field of fields) {
    if (field === 'tax_id') {
      result.tax_id = data.tc_encrypted
        ? await decryptWithKeys(data.tc_encrypted, keys)
        : data.tax_id ?? '';
    } else if (field === 'routing_number') {
      result.routing_number = legacyBankPayload !== undefined
        ? legacyBankPayload.split('|')[0] ?? ''
        : data.routing_number_encrypted
          ? await decryptWithKeys(data.routing_number_encrypted, keys)
          : '';
    } else {
      result.account_number = legacyBankPayload !== undefined
        ? legacyBankPayload.split('|').slice(1).join('|')
        : data.account_number_encrypted
          ? await decryptWithKeys(data.account_number_encrypted, keys)
          : '';
    }
  }

  return result;
}

async function decryptTenant(
  client: ReturnType<typeof createUserClient>,
  entityId: string,
  keys: readonly string[],
): Promise<Partial<Record<DecryptablePiiField, string>>> {
  const { data, error } = await client
    .from('tenants')
    .select('tc_encrypted')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) throw new RequestError('Sensitive record not found', 404);
  return {
    tax_id: data.tc_encrypted ? await decryptWithKeys(data.tc_encrypted, keys) : '',
  };
}

function createUserClient(accessToken: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) throw new RequestError('Encryption service unavailable', 503);

  return createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get('Origin');

  if (origin && !corsHeaders['Access-Control-Allow-Origin']) {
    return new Response(null, { status: 403, headers: corsHeaders });
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') throw new RequestError('Method not allowed', 405);

    const accessToken = getAccessToken(req);
    const client = createUserClient(accessToken);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new RequestError('Unauthorized', 401);

    enforceRateLimit(user.id);
    const request = parseRequest(await readJsonBody(req));
    const keys = getEncryptionKeys();

    if (request.action === 'encrypt') {
      const ciphertext = await encryptWithKey(request.plaintext, keys[0]!);
      return Response.json(
        { ciphertext },
        { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } },
      );
    }

    const values = request.entityType === 'property_owner'
      ? await decryptPropertyOwner(client, request.entityId, request.fields, keys)
      : await decryptTenant(client, request.entityId, keys);

    return Response.json(
      { values },
      { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 500;
    const message = error instanceof RequestError
      ? error.message
      : error instanceof PiiCryptoError
        ? 'Unable to process sensitive data'
        : 'Encryption service unavailable';
    return Response.json(
      { error: message },
      { status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } },
    );
  }
});
