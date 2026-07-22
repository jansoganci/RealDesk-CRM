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
  brokerage_name?: string | null;
  license_state?: string | null;
  primary_market_city?: string | null;
  primary_market_state?: string | null;
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
 * User data from auth.users (subset)
 */
export interface OrgUserData {
  email: string;
  raw_user_meta_data: {
    full_name?: string;
    avatar_url?: string;
  } | null;
}

/**
 * OrgMember with joined user data (for team members list)
 */
export interface OrgMemberWithUser extends OrgMember {
  user: OrgUserData;
}

/**
 * Organization invitation
 */
export interface OrgInvitation {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  invitation_token: string;
  invited_by: string | null;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * OrgInvitation with organization data (for showing in UI)
 */
export interface OrgInvitationWithOrg extends OrgInvitation {
  organization: Organization;
}

/**
 * Public invitation info (for accept page)
 */
export interface InvitationInfo {
  valid: boolean;
  org_name?: string;
  org_logo?: string | null;
  role?: OrgRole;
  invited_by_name?: string | null;
  invited_at?: string;
  expires_at?: string;
  expired?: boolean;
}

/**
 * Unified team member type (combines active members and pending invitations)
 */
export interface TeamMember {
  id: string;
  type: 'member' | 'invitation';
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: OrgRole;
  status: 'active' | 'pending';
  joinedAt: string | null;
  invitedAt: string | null;
  expiresAt?: string | null;
  invitationToken?: string | null;
  // For type narrowing
  member?: OrgMemberWithUser;
  invitation?: OrgInvitation;
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
  /** Refresh org data. Use silent during in-flow updates to avoid unmounting route children. */
  refreshOrg: (options?: { silent?: boolean }) => Promise<void>;
}
