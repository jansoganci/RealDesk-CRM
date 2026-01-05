import { supabase } from '../config/supabase';
import { createLogger } from '../lib/logger';
import type { Organization } from '../types/org';

const logger = createLogger('Organization');

class OrganizationService {
  /**
   * Update organization name
   * Only owners can update (enforced by RLS)
   */
  async updateName(orgId: string, name: string): Promise<Organization> {
    if (!name || name.trim().length < 2) {
      throw new Error('Organization name must be at least 2 characters');
    }

    if (name.length > 255) {
      throw new Error('Organization name must not exceed 255 characters');
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({ name: name.trim() })
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating organization name:', error);
      throw new Error('Failed to update organization name');
    }

    if (!data) {
      throw new Error('Organization not found');
    }

    return data as Organization;
  }
}

export const organizationService = new OrganizationService();

