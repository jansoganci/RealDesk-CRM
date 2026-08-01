import { supabase } from '../config/supabase';
import type { PropertyOwner, PropertyOwnerInsert, PropertyOwnerUpdate } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';
import { getActiveOrgId, softDelete } from '../lib/orgHelpers';
import { isValidRoutingNumber, isValidAccountNumber } from './encryption.service';
import {
  batchEncryptSensitiveFields,
  requireEncryptResult,
  type EncryptFieldRequest,
} from './sensitiveFields.service';

interface OwnerWithPropertyCount extends PropertyOwner {
  property_count: number;
}

/** Form sends plain routing/account; DB stores encrypted columns. */
export type OwnerCreatePayload = Omit<
  PropertyOwnerInsert,
  'user_id' | 'org_id' | 'routing_number_encrypted' | 'account_number_encrypted'
> & {
  routing_number?: string;
  account_number?: string;
};

export type OwnerUpdatePayload = PropertyOwnerUpdate & {
  routing_number?: string;
  account_number?: string;
};

async function buildInsertPayload(
  owner: OwnerCreatePayload,
  userId: string,
  orgId: string
): Promise<PropertyOwnerInsert> {
  const { routing_number, account_number, ...rest } = owner;

  const payload: PropertyOwnerInsert = {
    ...rest,
    user_id: userId,
    org_id: orgId,
  };
  const fields: EncryptFieldRequest[] = [];

  const r = routing_number?.trim();
  if (r) {
    const digits = r.replace(/\D/g, '');
    if (!isValidRoutingNumber(digits)) {
      throw new Error('INVALID_ROUTING_NUMBER');
    }
    fields.push({
      requestId: 'owner-routing-number',
      entityType: 'property_owner',
      field: 'routing_number',
      plaintext: digits,
    });
  }

  const a = account_number?.trim();
  if (a) {
    if (!isValidAccountNumber(a)) {
      throw new Error('INVALID_ACCOUNT_NUMBER');
    }
    const normalized = a.replace(/[\s-]/g, '');
    fields.push({
      requestId: 'owner-account-number',
      entityType: 'property_owner',
      field: 'account_number',
      plaintext: normalized,
    });
  }

  if (fields.length > 0) {
    const encrypted = await batchEncryptSensitiveFields(orgId, fields);
    if (fields.some((field) => field.requestId === 'owner-routing-number')) {
      payload.routing_number_encrypted = requireEncryptResult(encrypted, 'owner-routing-number').ciphertext;
    }
    if (fields.some((field) => field.requestId === 'owner-account-number')) {
      payload.account_number_encrypted = requireEncryptResult(encrypted, 'owner-account-number').ciphertext;
    }
  }

  return payload;
}

async function buildUpdatePayload(owner: OwnerUpdatePayload, orgId: string): Promise<PropertyOwnerUpdate> {
  const { routing_number, account_number, ...rest } = owner;
  const payload: PropertyOwnerUpdate = { ...rest };
  const fields: EncryptFieldRequest[] = [];

  const r = routing_number?.trim();
  if (r) {
    const digits = r.replace(/\D/g, '');
    if (!isValidRoutingNumber(digits)) {
      throw new Error('INVALID_ROUTING_NUMBER');
    }
    fields.push({
      requestId: 'owner-routing-number',
      entityType: 'property_owner',
      field: 'routing_number',
      plaintext: digits,
    });
  }

  const a = account_number?.trim();
  if (a) {
    if (!isValidAccountNumber(a)) {
      throw new Error('INVALID_ACCOUNT_NUMBER');
    }
    const normalized = a.replace(/[\s-]/g, '');
    fields.push({
      requestId: 'owner-account-number',
      entityType: 'property_owner',
      field: 'account_number',
      plaintext: normalized,
    });
  }

  if (fields.length > 0) {
    const encrypted = await batchEncryptSensitiveFields(orgId, fields);
    if (fields.some((field) => field.requestId === 'owner-routing-number')) {
      payload.routing_number_encrypted = requireEncryptResult(encrypted, 'owner-routing-number').ciphertext;
    }
    if (fields.some((field) => field.requestId === 'owner-account-number')) {
      payload.account_number_encrypted = requireEncryptResult(encrypted, 'owner-account-number').ciphertext;
    }
  }

  return payload;
}

export const ownersService = {
  async getAll() {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('property_owners')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PropertyOwner[];
  },

  async getById(id: string) {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('property_owners')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as PropertyOwner | null;
  },

  async create(owner: OwnerCreatePayload) {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const payload = await buildInsertPayload(owner, userId, orgId);
    return insertRow('property_owners', payload);
  },

  async update(id: string, owner: OwnerUpdatePayload) {
    const orgId = await getActiveOrgId();
    const payload = await buildUpdatePayload(owner, orgId);
    return updateRow('property_owners', id, payload);
  },

  async delete(id: string) {
    await softDelete('property_owners', id);
  },

  async getOwnersWithPropertyCount(): Promise<OwnerWithPropertyCount[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('property_owners')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        created_at,
        properties:properties(count)
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    interface OwnerQueryResult extends PropertyOwner {
      properties?: Array<{ count: number }>;
    }

    return (data as OwnerQueryResult[]).map((owner) => ({
      ...owner,
      property_count: owner.properties?.[0]?.count || 0,
    }));
  },

  async getOwnersWithMissingInfo() {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('property_owners')
      .select('id, phone, email')
      .eq('org_id', orgId)
      .is('deleted_at', null);

    if (error) throw error;

    const missingInfo = {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    };

    data?.forEach((o) => {
      const hasPhone = o.phone && o.phone.trim() !== '';
      const hasEmail = o.email && o.email.trim() !== '';

      if (!hasPhone) missingInfo.noPhone++;
      if (!hasEmail) missingInfo.noEmail++;
      if (!hasPhone && !hasEmail) {
        missingInfo.noContact++;
        missingInfo.total++;
      }
    });

    return missingInfo;
  },
};
