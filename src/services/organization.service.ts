import { supabase } from '../config/supabase';
import { createLogger } from '../lib/logger';
import type { Organization, OrgMember, OrgMemberStatus, OrgMemberWithUser, OrgRole } from '../types/org';

const logger = createLogger('Organization');

/**
 * Get Supabase project URL for Edge Functions
 */
function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('VITE_SUPABASE_URL is not set');
  }
  return url;
}

class OrganizationService {
  /**
   * Create user's first organization during onboarding
   * Uses RPC function to bypass RLS (only works if user has no existing org)
   */
  async createFirstOrganization(name: string = 'My Organization'): Promise<string> {
    if (!name || name.trim().length < 2) {
      throw new Error('Organization name must be at least 2 characters');
    }

    if (name.length > 255) {
      throw new Error('Organization name must not exceed 255 characters');
    }

    const { data, error } = await supabase
      .rpc('create_first_organization', { p_org_name: name.trim() });

    if (error) {
      logger.error('Error creating first organization:', error);
      
      if (error.message?.includes('already has an organization')) {
        throw new Error('You already have an organization');
      }
      
      throw new Error('Failed to create organization');
    }

    if (!data) {
      throw new Error('Failed to create organization - no ID returned');
    }

    return data as string;
  }

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

  /**
   * Update organization logo URL
   * Only owners can update (enforced by RLS)
   */
  async updateLogo(orgId: string, logoUrl: string | null): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({ logo_url: logoUrl })
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating organization logo:', error);
      throw new Error('Failed to update organization logo');
    }

    if (!data) {
      throw new Error('Organization not found');
    }

    return data as Organization;
  }

  /**
   * Get all members of an organization with user details
   * All org members can view (enforced by RLS in RPC)
   * Uses RPC function because PostgREST cannot join public tables with auth.users
   */
  async getMembers(orgId: string): Promise<OrgMemberWithUser[]> {
    const { data, error } = await supabase
      .rpc('get_org_members_with_users', { p_org_id: orgId });

    if (error) {
      logger.error('Error fetching organization members:', error);
      throw new Error('Failed to fetch organization members');
    }

    // Map flat RPC response to nested OrgMemberWithUser structure
    const rows = (data as any[]) || [];
    return rows.map((row: any) => ({
      id: row.id,
      org_id: row.org_id,
      user_id: row.user_id,
      role: row.role as OrgRole,
      status: row.status as OrgMemberStatus,
      invited_by: row.invited_by,
      invited_at: row.invited_at,
      joined_at: row.joined_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        email: row.user_email || '',
        raw_user_meta_data: {
          full_name: row.user_full_name || undefined,
          avatar_url: row.user_avatar_url || undefined,
        },
      },
    })) as OrgMemberWithUser[];
  }

  /**
   * Get count of members in an organization
   */
  async getMemberCount(orgId: string): Promise<number> {
    const { count, error } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (error) {
      logger.error('Error fetching member count:', error);
      throw new Error('Failed to fetch member count');
    }

    return count || 0;
  }

  /**
   * Get count of owners in an organization
   * Used to prevent removing the last owner
   */
  async getOwnerCount(orgId: string): Promise<number> {
    const { count, error } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('role', 'owner')
      .eq('status', 'active');

    if (error) {
      logger.error('Error fetching owner count:', error);
      throw new Error('Failed to fetch owner count');
    }

    return count || 0;
  }

  /**
   * Send invitation email via Edge Function
   * This is called after successful database operations
   * Errors are logged but don't fail the operation
   *
   * @param invitationId - Invitation ID to send email for
   * @returns Promise that resolves when email is sent (or fails silently)
   */
  private async sendInvitationEmail(invitationId: string): Promise<void> {
    try {
      const supabaseUrl = getSupabaseUrl();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        logger.warn('No session found, cannot send invitation email');
        return;
      }

      const functionUrl = `${supabaseUrl}/functions/v1/send-invitation-email`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        logger.error('Failed to send invitation email:', {
          status: response.status,
          error: errorMessage,
          invitationId,
        });
        // Don't throw - email failure shouldn't break the flow
        return;
      }

      const result = await response.json();
      logger.info('Invitation email sent successfully:', {
        emailId: result.emailId,
        invitationId: result.invitationId,
      });
    } catch (error) {
      // Log error but don't throw - invitation exists in DB, can resend later
      logger.error('Error sending invitation email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId,
      });
    }
  }

  /**
   * Get a single member by ID
   */
  async getMemberById(memberId: string): Promise<OrgMember | null> {
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Error fetching member:', error);
      throw new Error('Failed to fetch member');
    }

    return data as OrgMember;
  }

  /**
   * Invite a new member to the organization by email
   * Works for both registered and unregistered users
   * Only owners can invite (enforced by RLS)
   *
   * @param orgId - Organization ID
   * @param email - Email of the user to invite
   * @param role - Role to assign (owner or member)
   * @returns The created invitation
   */
  async inviteMember(orgId: string, email: string, role: OrgRole): Promise<{ type: 'invitation' | 'member'; data: any }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user is already registered
    const { data: users, error: userError } = await supabase
      .rpc('get_user_id_by_email', { email_input: normalizedEmail });

    if (userError) {
      logger.error('Error looking up user by email:', userError);
      throw new Error('Failed to lookup user');
    }

    const userList = users as unknown as { id: string }[];
    const userId = userList && userList.length > 0 ? userList[0].id : null;

    // 2. If user is registered, check if already a member
    if (userId) {
      const { data: existing } = await supabase
        .from('org_members')
        .select('id, status')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'suspended') {
          throw new Error('This user was previously suspended from this organization.');
        }
        throw new Error('This user is already a member of this organization.');
      }
    }

    // 3. Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('org_invitations')
      .select('id, expires_at, accepted_at')
      .eq('org_id', orgId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingInvitation) {
      if (existingInvitation.accepted_at) {
        throw new Error('This user has already accepted an invitation.');
      }
      if (new Date(existingInvitation.expires_at) > new Date()) {
        throw new Error('This user already has a pending invitation.');
      }
      // If invitation is expired, we'll delete it and create a new one below
    }

    // 4. Get current user for invited_by field
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 5. If user is already registered, add them directly to org_members
    if (userId) {
      const { data, error } = await supabase
        .from('org_members')
        .insert({
          org_id: orgId,
          user_id: userId,
          role,
          status: 'active',
          invited_by: currentUser?.id || null,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding member:', error);

        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('Only organization owners can invite members.');
        }

        throw new Error('Failed to add member');
      }

      return { type: 'member', data };
    }

    // 6. User is NOT registered - create invitation
    // Delete expired invitation if exists
    if (existingInvitation && new Date(existingInvitation.expires_at) <= new Date()) {
      await supabase
        .from('org_invitations')
        .delete()
        .eq('id', existingInvitation.id);
    }

    // Generate secure token
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

    if (tokenError || !token) {
      logger.error('Error generating invitation token:', tokenError);
      throw new Error('Failed to generate invitation token');
    }

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data, error } = await supabase
      .from('org_invitations')
      .insert({
        org_id: orgId,
        email: normalizedEmail,
        role,
        invitation_token: token,
        invited_by: currentUser?.id || null,
        invited_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating invitation:', error);

      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Only organization owners can invite members.');
      }

      throw new Error('Failed to create invitation');
    }

    // 7. Send invitation email (after successful DB insert)
    // Email failure doesn't roll back the invitation - owner can resend or copy link
    if (data?.id) {
      await this.sendInvitationEmail(data.id).catch((emailError) => {
        // Already logged in sendInvitationEmail, just ensure it doesn't break the flow
        logger.warn('Email sending failed, but invitation was created:', {
          invitationId: data.id,
          emailError: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      });
    }

    return { type: 'invitation', data };
  }

  /**
   * Get all pending invitations for an organization
   * Only owners can view (enforced by RLS)
   */
  async getInvitations(orgId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('org_invitations')
      .select('*')
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .order('invited_at', { ascending: false });

    if (error) {
      logger.error('Error fetching invitations:', error);
      throw new Error('Failed to fetch invitations');
    }

    return data || [];
  }

  /**
   * Resend an invitation (generates new token and extends expiration)
   * Only owners can resend (enforced by RLS)
   */
  async resendInvitation(invitationId: string): Promise<void> {
    // Generate new token
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

    if (tokenError || !token) {
      logger.error('Error generating invitation token:', tokenError);
      throw new Error('Failed to generate invitation token');
    }

    // Extend expiration by 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('org_invitations')
      .update({
        invitation_token: token,
        expires_at: expiresAt.toISOString(),
        invited_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) {
      logger.error('Error resending invitation:', error);

      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Only organization owners can resend invitations.');
      }

      throw new Error('Failed to resend invitation');
    }

    // Send invitation email (after successful DB update)
    // Email failure doesn't roll back the update - owner can try again
    await this.sendInvitationEmail(invitationId).catch((emailError) => {
      // Already logged in sendInvitationEmail, just ensure it doesn't break the flow
      logger.warn('Email sending failed, but invitation was updated:', {
        invitationId,
        emailError: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
    });
  }

  /**
   * Revoke/delete an invitation
   * Only owners can revoke (enforced by RLS)
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('org_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      logger.error('Error revoking invitation:', error);

      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Only organization owners can revoke invitations.');
      }

      throw new Error('Failed to revoke invitation');
    }
  }

  /**
   * Get invitation info by token (for showing on accept page)
   * This is a public function (no auth required)
   */
  async getInvitationInfo(token: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_invitation_info', { p_token: token });

    if (error) {
      logger.error('Error fetching invitation info:', error);
      throw new Error('Failed to fetch invitation info');
    }

    return data;
  }

  /**
   * Accept an invitation using a token
   * User must be authenticated
   */
  async acceptInvitation(token: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('accept_org_invitation', { p_token: token });

    if (error) {
      logger.error('Error accepting invitation:', error);
      throw new Error('Failed to accept invitation');
    }

    return data;
  }

  /**
   * Update a member's role
   * Only owners can update roles (enforced by RLS)
   * Cannot demote the last owner
   */
  async updateMemberRole(memberId: string, newRole: OrgRole): Promise<OrgMember> {
    // 1. Get the member to check current role and org
    const member = await this.getMemberById(memberId);

    if (!member) {
      throw new Error('Member not found');
    }

    // 2. If demoting from owner to member, check owner count
    if (member.role === 'owner' && newRole === 'member') {
      const ownerCount = await this.getOwnerCount(member.org_id);

      if (ownerCount <= 1) {
        throw new Error('Cannot demote the last owner. Promote another member to owner first.');
      }
    }

    // 3. Update the role
    const { data, error } = await supabase
      .from('org_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating member role:', error);

      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Only organization owners can change member roles.');
      }

      throw new Error('Failed to update member role');
    }

    return data as OrgMember;
  }

  /**
   * Remove a member from the organization
   * Only owners can remove members (enforced by RLS)
   * Cannot remove the last owner
   */
  async removeMember(memberId: string): Promise<void> {
    // 1. Get the member to check role and org
    const member = await this.getMemberById(memberId);

    if (!member) {
      throw new Error('Member not found');
    }

    // 2. If removing an owner, check owner count
    if (member.role === 'owner') {
      const ownerCount = await this.getOwnerCount(member.org_id);

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last owner. Transfer ownership first.');
      }
    }

    // 3. Get current user to prevent self-removal as last owner
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser?.id === member.user_id && member.role === 'owner') {
      const ownerCount = await this.getOwnerCount(member.org_id);
      if (ownerCount <= 1) {
        throw new Error('You cannot remove yourself as the last owner.');
      }
    }

    // 4. Delete the membership
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      logger.error('Error removing member:', error);

      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Only organization owners can remove members.');
      }

      throw new Error('Failed to remove member');
    }
  }
}

export const organizationService = new OrganizationService();
