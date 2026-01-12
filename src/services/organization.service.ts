import { supabase } from '../config/supabase';
import { createLogger } from '../lib/logger';
import type { Organization, OrgMember, OrgMemberWithUser, OrgRole } from '../types/org';

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
   * All org members can view (enforced by RLS)
   */
  async getMembers(orgId: string): Promise<OrgMemberWithUser[]> {
    const { data, error } = await supabase
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
        user:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('org_id', orgId)
      .order('joined_at', { ascending: true });

    if (error) {
      logger.error('Error fetching organization members:', error);
      throw new Error('Failed to fetch organization members');
    }

    return (data || []) as OrgMemberWithUser[];
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
   * Only owners can invite (enforced by RLS)
   *
   * @param orgId - Organization ID
   * @param email - Email of the user to invite
   * @param role - Role to assign (owner or member)
   */
  async inviteMember(orgId: string, email: string, role: OrgRole): Promise<OrgMember> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // 1. Find user by email using RPC
    const { data: users, error: userError } = await supabase
      .rpc('get_user_id_by_email', { email_input: email.toLowerCase().trim() });

    if (userError) {
      logger.error('Error looking up user by email:', userError);
      throw new Error('Failed to lookup user');
    }

    if (!users || users.length === 0) {
      throw new Error('User not found. They must register first before being invited.');
    }

    const userId = users[0].id;

    // 2. Check if user is already a member
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

    // 3. Get current user for invited_by field
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 4. Create membership
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
      logger.error('Error inviting member:', error);

      // Handle RLS violation
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Only organization owners can invite members.');
      }

      throw new Error('Failed to invite member');
    }

    return data as OrgMember;
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
