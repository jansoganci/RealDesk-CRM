import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import type { Organization, OrgMember, OrgContextValue } from '../types/org';
import { createLogger } from '../lib/logger';

const orgLogger = createLogger('Org');

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrg = useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      setLoading(true);
      return;
    }

    // No user = no org
    if (!user?.id) {
      setCurrentOrg(null);
      setMembership(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user's active org membership with organization data
      // Use limit(1) + order to handle users with multiple orgs (V1: pick oldest/first)
      const { data, error: fetchError } = await supabase
        .from('org_members')
        .select(`
          id,
          org_id,
          user_id,
          role,
          status,
          invited_by,
          invited_at,
          joined_at,
          created_at,
          updated_at,
          organization:organizations(
            id,
            name,
            slug,
            logo_url,
            settings,
            created_at,
            updated_at,
            onboarding_completed,
            onboarding_completed_at,
            primary_use_case,
            team_size_range,
            onboarding_skipped,
            onboarding_skipped_at,
            onboarding_step
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        orgLogger.error('Failed to fetch org membership:', fetchError);
        setError('Failed to load organization');
        setCurrentOrg(null);
        setMembership(null);
        return;
      }

      if (!data) {
        // User has no active org membership
        orgLogger.warn('User has no active org membership:', user.id);
        // Do NOT set error here, as this is a valid state for new users
        // who need to go through onboarding
        setCurrentOrg(null);
        setMembership(null);
        setLoading(false); // Make sure to set loading false
        return;
      }

      // Extract organization from joined data
      const orgData = data.organization as unknown as Organization;

      // Build membership object (without nested organization)
      const membershipData: OrgMember = {
        id: data.id,
        org_id: data.org_id,
        user_id: data.user_id,
        role: data.role as OrgMember['role'],
        status: data.status as OrgMember['status'],
        invited_by: data.invited_by,
        invited_at: data.invited_at,
        joined_at: data.joined_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setCurrentOrg(orgData);
      setMembership(membershipData);
      setError(null);

      orgLogger.debug('Loaded org:', orgData.name, 'role:', membershipData.role);
    } catch (err) {
      orgLogger.error('Unexpected error fetching org:', err);
      setError('Failed to load organization');
      setCurrentOrg(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  // Fetch org when auth state changes
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.id) {
      setCurrentOrg(null);
      setMembership(null);
      setLoading(false);
      setError(null);
      return;
    }

    refreshOrg();
  }, [authLoading, user?.id, refreshOrg]);

  // Computed values
  const isOwner = membership?.role === 'owner';
  const isMember = membership?.role === 'member';

  const value = useMemo<OrgContextValue>(
    () => ({
      currentOrg,
      membership,
      isOwner,
      isMember,
      loading,
      error,
      refreshOrg,
    }),
    [currentOrg, membership, isOwner, isMember, loading, error, refreshOrg]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

/**
 * Hook to access organization context
 * Must be used within OrgProvider
 */
export const useOrg = (): OrgContextValue => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
