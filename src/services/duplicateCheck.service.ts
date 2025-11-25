/**
 * Duplicate Check Service
 * Provides warnings and confirmations before contract creation
 */

import { supabase } from '@/config/supabase';

export interface DuplicateNameCheck {
  hasDuplicate: boolean;
  count?: number;
  message?: string;
}

export interface DataChangesCheck {
  hasChanges: boolean;
  changes?: string[];
  message?: string;
  existingData?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface MultipleContractsCheck {
  hasMultiple: boolean;
  count?: number;
  contracts?: Array<{
    id: string;
    property_address: string;
    start_date: string;
    end_date: string;
  }>;
  message?: string;
}

/**
 * Check if same name exists with different TC
 * Warns: "⚠️ Ali Yılmaz ismiyle 2 farklı kişi daha var (farklı TC No)"
 */
export async function checkDuplicateName(
  name: string,
  tcHash: string,
  entityType: 'owner' | 'tenant',
  userId: string
): Promise<DuplicateNameCheck> {
  const table = entityType === 'owner' ? 'property_owners' : 'tenants';

  const { data, error } = await supabase
    .from(table)
    .select('name, tc_hash')
    .ilike('name', name)
    .neq('tc_hash', tcHash)
    .eq('user_id', userId);

  if (error) {
    console.error('Duplicate name check failed:', error);
    return { hasDuplicate: false };
  }

  if (data && data.length > 0) {
    return {
      hasDuplicate: true,
      count: data.length,
      message: `⚠️ "${name}" ismiyle ${data.length} farklı kişi daha var sistemde (farklı TC No)`
    };
  }

  return { hasDuplicate: false };
}

/**
 * Check if data changed for existing entity
 * Warns: "⚠️ Sistemdeki bilgiler değişti: Telefon: 5392174782 → 5551234567"
 */
export async function checkDataChanges(
  tcHash: string,
  newData: { phone: string; email?: string; address?: string },
  entityType: 'owner' | 'tenant',
  userId: string
): Promise<DataChangesCheck> {
  const table = entityType === 'owner' ? 'property_owners' : 'tenants';

  const { data: existing, error } = await supabase
    .from(table)
    .select('*')
    .eq('tc_hash', tcHash)
    .eq('user_id', userId)
    .single();

  if (error || !existing) {
    return { hasChanges: false };
  }

  const changes: string[] = [];

  if (existing.phone !== newData.phone) {
    changes.push(`Telefon: ${existing.phone} → ${newData.phone}`);
  }

  if (newData.email && existing.email !== newData.email) {
    changes.push(`Email: ${existing.email || 'yok'} → ${newData.email || 'yok'}`);
  }

  if (entityType === 'tenant' && newData.address && 'address' in existing && existing.address !== newData.address) {
    changes.push(`Adres değişti`);
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    existingData: {
      phone: existing.phone ?? undefined,
      email: existing.email ?? undefined,
      address: 'address' in existing ? existing.address ?? undefined : undefined
    },
    message: changes.length > 0
      ? `⚠️ Sistemdeki bilgiler değişti:\n${changes.join('\n')}\n\nGüncellensin mi?`
      : undefined
  };
}

/**
 * Check if tenant has multiple active contracts
 * Warns: "⚠️ Bu kiracının 2 aktif sözleşmesi var"
 */
export async function checkMultipleContracts(
  tcHash: string,
  userId: string
): Promise<MultipleContractsCheck> {
  // First get tenant by TC hash
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('tc_hash', tcHash)
    .eq('user_id', userId)
    .single();

  if (!tenant) {
    return { hasMultiple: false };
  }

  // Then get active contracts
  const { data: activeContracts, error } = await supabase
    .from('contracts')
    .select(`
      id,
      start_date,
      end_date,
      property:properties (
        full_address
      )
    `)
    .eq('tenant_id', tenant.id)
    .eq('status', 'Active')
    .eq('user_id', userId);

  if (error || !activeContracts || activeContracts.length === 0) {
    return { hasMultiple: false };
  }

  const addresses = activeContracts
    .map((c: any) => c.property?.full_address || 'Bilinmeyen adres')
    .join('\n- ');

  return {
    hasMultiple: activeContracts.length > 0,
    count: activeContracts.length,
    contracts: activeContracts.map((c: any) => ({
      id: c.id,
      property_address: c.property?.full_address || 'Bilinmeyen',
      start_date: c.start_date,
      end_date: c.end_date
    })),
    message: `⚠️ Bu kiracının ${activeContracts.length} aktif sözleşmesi var:\n- ${addresses}\n\nDevam edilsin mi?`
  };
}
