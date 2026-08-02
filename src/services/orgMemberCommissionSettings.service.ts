import { supabase } from '../config/supabase';
import { getAuthenticatedUserId } from '../lib/auth';
import { getActiveOrgId } from '../lib/orgHelpers';
import { handleServiceError } from '../lib/handleServiceError';
import type { BrokerSettings } from '../types';
import type { Database, Json } from '../types/database.types';

export type BrokerSettingsSource = 'override' | 'profile' | 'defaults';

export interface ResolvedBrokerSettings extends BrokerSettings {
  source: BrokerSettingsSource;
}

export type OrgMemberCommissionSettingsInput = BrokerSettings;

type OverrideRow = Database['public']['Tables']['org_member_commission_settings']['Row'];
type OverrideInsert = Database['public']['Tables']['org_member_commission_settings']['Insert'];

const DEFAULT_BROKER_SETTINGS: BrokerSettings = {
  broker_model: 'split_with_cap',
  broker_split_pct: 30,
  annual_cap_amount: null,
  cap_anniversary_date: null,
  franchise_fee_enabled: false,
  franchise_fee_pct: null,
  franchise_fee_cap: null,
  default_transaction_fee: 0,
  eo_fee_type: 'per_deal',
  eo_fee_amount: 0,
  default_tc_fee: 0,
  default_rental_commission_type: 'one_month',
  default_rental_commission_rate: null,
  default_rental_flat_fee: null,
};

function mapRowToBrokerSettings(row: OverrideRow): BrokerSettings {
  return {
    broker_model: (row.broker_model as BrokerSettings['broker_model']) ?? DEFAULT_BROKER_SETTINGS.broker_model,
    broker_split_pct: row.broker_split_pct ?? DEFAULT_BROKER_SETTINGS.broker_split_pct,
    annual_cap_amount: row.annual_cap_amount,
    cap_anniversary_date: row.cap_anniversary_date,
    franchise_fee_enabled: row.franchise_fee_enabled,
    franchise_fee_pct: row.franchise_fee_pct,
    franchise_fee_cap: row.franchise_fee_cap,
    default_transaction_fee: row.default_transaction_fee,
    eo_fee_type: (row.eo_fee_type as BrokerSettings['eo_fee_type']) ?? DEFAULT_BROKER_SETTINGS.eo_fee_type,
    eo_fee_amount: row.eo_fee_amount,
    default_tc_fee: row.default_tc_fee,
    default_rental_commission_type:
      (row.default_rental_commission_type as BrokerSettings['default_rental_commission_type']) ??
      DEFAULT_BROKER_SETTINGS.default_rental_commission_type,
    default_rental_commission_rate: row.default_rental_commission_rate,
    default_rental_flat_fee: row.default_rental_flat_fee,
  };
}

function parseResolved(data: Json | null): ResolvedBrokerSettings {
  const obj = (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as Record<
    string,
    unknown
  >;
  const sourceRaw = obj.source;
  const source: BrokerSettingsSource =
    sourceRaw === 'override' || sourceRaw === 'profile' || sourceRaw === 'defaults'
      ? sourceRaw
      : 'defaults';

  return {
    source,
    broker_model:
      (obj.broker_model as BrokerSettings['broker_model']) ?? DEFAULT_BROKER_SETTINGS.broker_model,
    broker_split_pct:
      typeof obj.broker_split_pct === 'number'
        ? obj.broker_split_pct
        : DEFAULT_BROKER_SETTINGS.broker_split_pct,
    annual_cap_amount: typeof obj.annual_cap_amount === 'number' ? obj.annual_cap_amount : null,
    cap_anniversary_date:
      typeof obj.cap_anniversary_date === 'string' ? obj.cap_anniversary_date : null,
    franchise_fee_enabled:
      typeof obj.franchise_fee_enabled === 'boolean'
        ? obj.franchise_fee_enabled
        : DEFAULT_BROKER_SETTINGS.franchise_fee_enabled,
    franchise_fee_pct: typeof obj.franchise_fee_pct === 'number' ? obj.franchise_fee_pct : null,
    franchise_fee_cap: typeof obj.franchise_fee_cap === 'number' ? obj.franchise_fee_cap : null,
    default_transaction_fee:
      typeof obj.default_transaction_fee === 'number'
        ? obj.default_transaction_fee
        : DEFAULT_BROKER_SETTINGS.default_transaction_fee,
    eo_fee_type:
      (obj.eo_fee_type as BrokerSettings['eo_fee_type']) ?? DEFAULT_BROKER_SETTINGS.eo_fee_type,
    eo_fee_amount:
      typeof obj.eo_fee_amount === 'number' ? obj.eo_fee_amount : DEFAULT_BROKER_SETTINGS.eo_fee_amount,
    default_tc_fee:
      typeof obj.default_tc_fee === 'number' ? obj.default_tc_fee : DEFAULT_BROKER_SETTINGS.default_tc_fee,
    default_rental_commission_type:
      (obj.default_rental_commission_type as BrokerSettings['default_rental_commission_type']) ??
      DEFAULT_BROKER_SETTINGS.default_rental_commission_type,
    default_rental_commission_rate:
      typeof obj.default_rental_commission_rate === 'number'
        ? obj.default_rental_commission_rate
        : null,
    default_rental_flat_fee:
      typeof obj.default_rental_flat_fee === 'number' ? obj.default_rental_flat_fee : null,
  };
}

function validateBrokerSettings(merged: BrokerSettings): void {
  if (
    merged.broker_model === 'split_with_cap' &&
    (merged.annual_cap_amount == null || merged.annual_cap_amount <= 0)
  ) {
    throw new Error('Annual cap amount is required for split-with-cap model');
  }
  if (merged.broker_model === 'flat_fee_100pct') {
    merged.broker_split_pct = 0;
  }
}

class OrgMemberCommissionSettingsService {
  async getOverride(memberUserId: string): Promise<BrokerSettings | null> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('org_member_commission_settings')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', memberUserId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapRowToBrokerSettings(data);
    } catch (error) {
      throw handleServiceError(error, 'Failed to load member commission settings');
    }
  }

  async resolveBrokerSettingsForMember(memberUserId: string): Promise<ResolvedBrokerSettings> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase.rpc('resolve_member_broker_settings', {
        p_org_id: orgId,
        p_member_user_id: memberUserId,
      });

      if (error) throw error;
      return parseResolved(data);
    } catch (error) {
      throw handleServiceError(error, 'Failed to resolve member broker settings');
    }
  }

  async upsertOverride(
    memberUserId: string,
    settings: OrgMemberCommissionSettingsInput
  ): Promise<BrokerSettings> {
    try {
      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();
      const merged: BrokerSettings = { ...DEFAULT_BROKER_SETTINGS, ...settings };
      validateBrokerSettings(merged);

      const payload: OverrideInsert = {
        org_id: orgId,
        user_id: memberUserId,
        broker_model: merged.broker_model,
        broker_split_pct: merged.broker_split_pct,
        annual_cap_amount: merged.annual_cap_amount,
        cap_anniversary_date: merged.cap_anniversary_date,
        franchise_fee_enabled: merged.franchise_fee_enabled,
        franchise_fee_pct: merged.franchise_fee_pct,
        franchise_fee_cap: merged.franchise_fee_cap,
        default_transaction_fee: merged.default_transaction_fee,
        eo_fee_type: merged.eo_fee_type,
        eo_fee_amount: merged.eo_fee_amount,
        default_tc_fee: merged.default_tc_fee,
        default_rental_commission_type: merged.default_rental_commission_type,
        default_rental_commission_rate: merged.default_rental_commission_rate,
        default_rental_flat_fee: merged.default_rental_flat_fee,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('org_member_commission_settings')
        .upsert(payload, { onConflict: 'org_id,user_id' })
        .select('*')
        .single();

      if (error) throw error;
      return mapRowToBrokerSettings(data);
    } catch (error) {
      throw handleServiceError(error, 'Failed to save member commission settings');
    }
  }

  async clearOverride(memberUserId: string): Promise<void> {
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('org_member_commission_settings')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', memberUserId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to clear member commission settings');
    }
  }
}

export const orgMemberCommissionSettingsService = new OrgMemberCommissionSettingsService();
