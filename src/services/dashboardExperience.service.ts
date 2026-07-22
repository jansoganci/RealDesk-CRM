import { supabase } from '@/config/supabase';
import { getActiveOrgId } from '@/lib/orgHelpers';

export interface DashboardDataPresence {
  hasProperties: boolean;
  hasLeads: boolean;
}

class DashboardExperienceService {
  async getDataPresence(): Promise<DashboardDataPresence> {
    const orgId = await getActiveOrgId();

    const [propertiesResult, leadsResult] = await Promise.all([
      supabase
        .from('properties')
        .select('id')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .limit(1),
      supabase
        .from('property_inquiries')
        .select('id')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .limit(1),
    ]);

    if (propertiesResult.error) throw propertiesResult.error;
    if (leadsResult.error) throw leadsResult.error;

    return {
      hasProperties: (propertiesResult.data?.length ?? 0) > 0,
      hasLeads: (leadsResult.data?.length ?? 0) > 0,
    };
  }
}

export const dashboardExperienceService = new DashboardExperienceService();
