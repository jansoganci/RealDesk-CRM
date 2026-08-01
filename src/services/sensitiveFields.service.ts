import { supabase } from '@/config/supabase';
import { getActiveOrgId } from '@/lib/orgHelpers';

export type SensitiveEntityType = 'property_owner' | 'tenant';
export type SensitiveField = 'tax_id' | 'routing_number' | 'account_number';

export interface EncryptFieldRequest {
  requestId: string;
  entityType: SensitiveEntityType;
  field: SensitiveField;
  plaintext: string;
}

export interface EncryptFieldResult {
  requestId: string;
  ciphertext: string;
  lookupHash?: string;
  hashVersion?: 'legacy-sha256';
}

export interface DecryptFieldRequest {
  requestId: string;
  entityType: SensitiveEntityType;
  entityId: string;
  field: SensitiveField;
}

export interface DecryptFieldResult {
  requestId: string;
  plaintext: string;
}

interface BatchEncryptResponse {
  items: EncryptFieldResult[];
}

interface BatchDecryptResponse {
  items: DecryptFieldResult[];
}

interface HashTaxIdResponse {
  lookupHash: string;
  hashVersion: 'legacy-sha256';
}

function assertUniqueRequestIds(items: Array<{ requestId: string }>): void {
  const ids = new Set(items.map((item) => item.requestId));
  if (ids.size !== items.length) throw new Error('DUPLICATE_SENSITIVE_FIELD_REQUEST_ID');
}

export async function batchEncryptSensitiveFields(
  orgId: string,
  items: EncryptFieldRequest[],
): Promise<EncryptFieldResult[]> {
  assertUniqueRequestIds(items);
  const { data, error } = await supabase.functions.invoke<BatchEncryptResponse>('batch-encrypt-fields', {
    body: { orgId, items },
  });
  if (error || !data?.items || data.items.length !== items.length) {
    throw new Error('SENSITIVE_FIELD_ENCRYPT_FAILED');
  }
  return data.items;
}

export async function batchDecryptSensitiveFields(
  items: DecryptFieldRequest[],
): Promise<DecryptFieldResult[]> {
  assertUniqueRequestIds(items);
  if (items.length === 0) return [];
  const { data, error } = await supabase.functions.invoke<BatchDecryptResponse>('batch-decrypt-fields', {
    body: { items },
  });
  if (error || !data?.items || data.items.length !== items.length) {
    throw new Error('SENSITIVE_FIELD_DECRYPT_FAILED');
  }
  return data.items;
}

export async function hashTaxIdServer(taxId: string): Promise<string> {
  const orgId = await getActiveOrgId();
  const { data, error } = await supabase.functions.invoke<HashTaxIdResponse>('hash-tax-id', {
    body: { orgId, taxId },
  });
  if (error || !data?.lookupHash || data.hashVersion !== 'legacy-sha256') {
    throw new Error('TAX_ID_HASH_FAILED');
  }
  return data.lookupHash;
}

export function requireEncryptResult(
  results: EncryptFieldResult[],
  requestId: string,
): EncryptFieldResult {
  const result = results.find((item) => item.requestId === requestId);
  if (!result) throw new Error('SENSITIVE_FIELD_RESULT_MISSING');
  return result;
}

export function requireDecryptResult(
  results: DecryptFieldResult[],
  requestId: string,
): string {
  const result = results.find((item) => item.requestId === requestId);
  if (!result) throw new Error('SENSITIVE_FIELD_RESULT_MISSING');
  return result.plaintext;
}
