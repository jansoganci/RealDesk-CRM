import { supabase } from '../config/supabase';
import type { PropertyOwner, PropertyOwnerInsert, PropertyOwnerUpdate } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';
import { getActiveOrgId, softDelete } from '../lib/orgHelpers';
import {
  decryptSensitiveFields,
  encryptSensitiveValue,
  hashTaxId,
  isValidAccountNumber,
  isValidRoutingNumber,
  isValidTaxId,
} from './encryption.service';

interface OwnerWithPropertyCount extends PropertyOwner {
  property_count: number;
}

/** Form sends plain routing/account; DB stores encrypted columns. */
export type OwnerCreatePayload = Omit<
  PropertyOwnerInsert,
  | 'user_id'
  | 'org_id'
  | 'tax_id'
  | 'tc_encrypted'
  | 'tc_hash'
  | 'iban_encrypted'
  | 'routing_number_encrypted'
  | 'account_number_encrypted'
> & {
  tax_id?: string | null;
  routing_number?: string | null;
  account_number?: string | null;
};

export type OwnerUpdatePayload = Omit<
  PropertyOwnerUpdate,
  | 'tax_id'
  | 'tc_encrypted'
  | 'tc_hash'
  | 'iban_encrypted'
  | 'routing_number_encrypted'
  | 'account_number_encrypted'
> & {
  tax_id?: string | null;
  routing_number?: string | null;
  account_number?: string | null;
};

export interface OwnerWithSensitiveFields extends PropertyOwner {
  routing_number: string;
  account_number: string;
}

const SAFE_OWNER_COLUMNS = 'id, name, email, phone, address, notes, created_at, updated_at, deleted_at, org_id, user_id';

function redactSensitiveColumns(
  owner: Omit<
    PropertyOwner,
    | 'account_number_encrypted'
    | 'iban_encrypted'
    | 'routing_number_encrypted'
    | 'tax_id'
    | 'tc_encrypted'
    | 'tc_hash'
  >,
): PropertyOwner {
  return {
    ...owner,
    account_number_encrypted: null,
    iban_encrypted: null,
    routing_number_encrypted: null,
    tax_id: null,
    tc_encrypted: null,
    tc_hash: null,
  };
}

async function buildInsertPayload(
  owner: OwnerCreatePayload,
  userId: string,
  orgId: string
): Promise<PropertyOwnerInsert> {
  const { tax_id, routing_number, account_number, ...rest } = owner;

  const payload: PropertyOwnerInsert = {
    ...rest,
    user_id: userId,
    org_id: orgId,
    tax_id: null,
  };

  const taxId = tax_id?.trim();
  if (taxId) {
    if (!isValidTaxId(taxId)) throw new Error('INVALID_TAX_ID');
    payload.tc_encrypted = await encryptSensitiveValue('tax_id', taxId);
    payload.tc_hash = await hashTaxId(taxId);
  }

  const r = routing_number?.trim();
  if (r) {
    const digits = r.replace(/\D/g, '');
    if (!isValidRoutingNumber(digits)) {
      throw new Error('INVALID_ROUTING_NUMBER');
    }
    payload.routing_number_encrypted = await encryptSensitiveValue('routing_number', digits);
  }

  const a = account_number?.trim();
  if (a) {
    if (!isValidAccountNumber(a)) {
      throw new Error('INVALID_ACCOUNT_NUMBER');
    }
    const normalized = a.replace(/[\s-]/g, '');
    payload.account_number_encrypted = await encryptSensitiveValue('account_number', normalized);
  }

  return payload;
}

async function buildUpdatePayload(owner: OwnerUpdatePayload): Promise<PropertyOwnerUpdate> {
  const { tax_id, routing_number, account_number, ...rest } = owner;
  const payload: PropertyOwnerUpdate = { ...rest };

  if (tax_id !== undefined) {
    const taxId = tax_id?.trim() ?? '';
    payload.tax_id = null;
    if (taxId) {
      if (!isValidTaxId(taxId)) throw new Error('INVALID_TAX_ID');
      payload.tc_encrypted = await encryptSensitiveValue('tax_id', taxId);
      payload.tc_hash = await hashTaxId(taxId);
    } else {
      payload.tc_encrypted = null;
      payload.tc_hash = null;
    }
  }

  if (routing_number !== undefined) {
    const routingNumber = routing_number?.trim() ?? '';
    payload.iban_encrypted = null;
    if (routingNumber) {
      const digits = routingNumber.replace(/\D/g, '');
      if (!isValidRoutingNumber(digits)) {
        throw new Error('INVALID_ROUTING_NUMBER');
      }
      payload.routing_number_encrypted = await encryptSensitiveValue('routing_number', digits);
    } else {
      payload.routing_number_encrypted = null;
    }
  }

  if (account_number !== undefined) {
    const accountNumber = account_number?.trim() ?? '';
    payload.iban_encrypted = null;
    if (accountNumber) {
      if (!isValidAccountNumber(accountNumber)) {
        throw new Error('INVALID_ACCOUNT_NUMBER');
      }
      const normalized = accountNumber.replace(/[\s-]/g, '');
      payload.account_number_encrypted = await encryptSensitiveValue('account_number', normalized);
    } else {
      payload.account_number_encrypted = null;
    }
  }

  return payload;
}

export const ownersService = {
  async getAll() {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('property_owners')
      .select(SAFE_OWNER_COLUMNS)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((owner) => redactSensitiveColumns(owner));
  },

  async getById(id: string) {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('property_owners')
      .select(SAFE_OWNER_COLUMNS)
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data ? redactSensitiveColumns(data) : null;
  },

  async getForEdit(id: string): Promise<OwnerWithSensitiveFields | null> {
    const owner = await this.getById(id);
    if (!owner) return null;

    const sensitive = await decryptSensitiveFields(
      'property_owner',
      id,
      ['tax_id', 'routing_number', 'account_number'],
    );
    return {
      ...owner,
      tax_id: sensitive.tax_id ?? '',
      routing_number: sensitive.routing_number ?? '',
      account_number: sensitive.account_number ?? '',
    };
  },

  async create(owner: OwnerCreatePayload) {
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();
    const payload = await buildInsertPayload(owner, userId, orgId);
    return insertRow('property_owners', payload);
  },

  async update(id: string, owner: OwnerUpdatePayload) {
    const payload = await buildUpdatePayload(owner);
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
