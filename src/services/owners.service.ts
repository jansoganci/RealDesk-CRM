import { supabase } from '../config/supabase';
import type { PropertyOwner, PropertyOwnerInsert, PropertyOwnerUpdate } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';

interface OwnerWithPropertyCount extends PropertyOwner {
  property_count: number;
}

export const ownersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('property_owners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PropertyOwner[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('property_owners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as PropertyOwner | null;
  },

  async create(owner: PropertyOwnerInsert) {
    // Get authenticated user ID with session fallback
    const userId = await getAuthenticatedUserId();

    // Inject user_id into owner data
    return insertRow('property_owners', {
      ...owner,
      user_id: userId,
    });
  },

  async update(id: string, owner: PropertyOwnerUpdate) {
    return updateRow('property_owners', id, owner);
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('property_owners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getOwnersWithPropertyCount(): Promise<OwnerWithPropertyCount[]> {
    const { data, error } = await supabase
      .from('property_owners')
      .select(`
        *,
        properties:properties(count)
      `)
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
    const { data, error } = await supabase
      .from('property_owners')
      .select('id, phone, email');

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
