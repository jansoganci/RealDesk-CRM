/**
 * Organization types for multi-tenant architecture
 *
 * V1 supports:
 * - Single org per user
 * - Two roles: owner (full access) and member (read-only)
 * - Soft delete for data recovery
 */

export type OrgRole = 'owner' | 'member';
export type OrgMemberStatus = 'pending' | 'active' | 'suspended';

/**
 * Organization (agency/company)
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Onboarding fields
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  primary_use_case?: string | null;
  team_size_range?: string | null;
  onboarding_skipped?: boolean;
  onboarding_skipped_at?: string | null;
  onboarding_step?: number;
}

/**
 * Organization membership
 */
export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  status: OrgMemberStatus;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * OrgMember with joined organization data
 */
export interface OrgMemberWithOrg extends OrgMember {
  organization: Organization;
}

/**
 * OrgContext value type
 */
export interface OrgContextValue {
  /** Current organization */
  currentOrg: Organization | null;
  /** Current user's membership */
  membership: OrgMember | null;
  /** Is current user an owner (can edit/delete) */
  isOwner: boolean;
  /** Is current user a member (read-only) */
  isMember: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message if failed to load */
  error: string | null;
  /** Refresh org data */
  refreshOrg: () => Promise<void>;
}
