import { supabase } from '../config/supabase';
import type { PropertyOwner, PropertyOwnerInsert, PropertyOwnerUpdate } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';
import { getActiveOrgId, softDelete } from '../lib/orgHelpers';

interface OwnerWithPropertyCount extends PropertyOwner {
  property_count: number;
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

  async create(owner: PropertyOwnerInsert) {
    // Get authenticated user ID and org ID
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    // Inject user_id and org_id into owner data
    return insertRow('property_owners', {
      ...owner,
      user_id: userId,
      org_id: orgId,
    });
  },

  async update(id: string, owner: PropertyOwnerUpdate) {
    return updateRow('property_owners', id, owner);
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
