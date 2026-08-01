import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users2 } from 'lucide-react';
import { toast } from 'sonner';

import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/skeletons';

import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { organizationService } from '@/services/organization.service';
import type { OrgMemberWithUser, OrgInvitation, TeamMember } from '@/types/org';

import { TeamMemberRow } from './components/TeamMemberRow';
import { TeamMemberCard } from './components/TeamMemberCard';
import { AddMemberDialog } from './components/AddMemberDialog';
import { ChangeMemberRoleDialog } from './components/ChangeMemberRoleDialog';
import { RemoveMemberDialog } from './components/RemoveMemberDialog';

import { Search, Plus, Info } from 'lucide-react';
export function TeamMembersList() {
  const { t } = useTranslation(['team', 'common']);
  const { user } = useAuth();
  const { currentOrg, isOwner } = useOrg();

  // State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Fetch members and invitations
  const fetchTeamData = useCallback(async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);
      
      // Fetch both members and invitations in parallel
      const [members, invitations] = await Promise.all([
        organizationService.getMembers(currentOrg.id),
        organizationService.getInvitations(currentOrg.id).catch(() => []), // Fail gracefully if invitations aren't supported yet
      ]);

      // Transform members to unified format
      const memberRows: TeamMember[] = members.map((member: OrgMemberWithUser) => ({
        id: member.id,
        type: 'member' as const,
        email: member.user?.email || '',
        name: member.user?.raw_user_meta_data?.full_name || null,
        avatarUrl: member.user?.raw_user_meta_data?.avatar_url || null,
        role: member.role,
        status: 'active' as const,
        joinedAt: member.joined_at,
        invitedAt: member.invited_at,
        member,
      }));

      // Transform invitations to unified format
      const invitationRows: TeamMember[] = invitations.map((invitation: OrgInvitation) => ({
        id: invitation.id,
        type: 'invitation' as const,
        email: invitation.email,
        name: null,
        avatarUrl: null,
        role: invitation.role,
        status: 'pending' as const,
        joinedAt: null,
        invitedAt: invitation.invited_at,
        expiresAt: invitation.expires_at,
        invitationToken: invitation.invitation_token,
        invitation,
      }));

      // Combine and sort: active members first, then pending invitations, both sorted by date
      const combined = [
        ...memberRows.sort((a, b) => 
          new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime()
        ),
        ...invitationRows.sort((a, b) => 
          new Date(b.invitedAt || 0).getTime() - new Date(a.invitedAt || 0).getTime()
        ),
      ];

      setTeamMembers(combined);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      toast.error(t('common:error'));
    } finally {
      setLoading(false);
    }
  }, [currentOrg, t]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Filter team members by search
  const filteredTeamMembers = teamMembers.filter((teamMember) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const name = teamMember.name?.toLowerCase() || '';
    const email = teamMember.email?.toLowerCase() || '';

    return name.includes(query) || email.includes(query);
  });

  // Handlers for members
  const handleChangeRole = (teamMember: TeamMember) => {
    setSelectedMember(teamMember);
    setShowRoleDialog(true);
  };

  const handleRemove = (teamMember: TeamMember) => {
    setSelectedMember(teamMember);
    setShowRemoveDialog(true);
  };

  // Handlers for invitations
  const handleRevoke = async (teamMember: TeamMember) => {
    if (!teamMember.invitation) return;

    try {
      await organizationService.revokeInvitation(teamMember.invitation.id);
      toast.success(t('team:invitationRevoked'));
      fetchTeamData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('common:error'));
    }
  };

  const handleCopyLink = async (teamMember: TeamMember) => {
    if (!teamMember.invitationToken) return;

    const inviteLink = `${window.location.origin}/accept-invite?token=${teamMember.invitationToken}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t('team:inviteLinkCopied'));
    } catch {
      toast.error(t('common:error'));
    }
  };

  const handleResend = async (teamMember: TeamMember) => {
    if (!teamMember.invitation) return;

    try {
      await organizationService.resendInvitation(teamMember.invitation.id);
      toast.success(t('team:invitationResent'));
      fetchTeamData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('common:error'));
    }
  };

  const handleAddSuccess = () => {
    fetchTeamData();
  };

  const handleRoleChangeSuccess = () => {
    fetchTeamData();
    setShowRoleDialog(false);
    setSelectedMember(null);
  };

  const handleRemoveSuccess = () => {
    fetchTeamData();
    setShowRemoveDialog(false);
    setSelectedMember(null);
  };

  // Add button with tooltip for non-owners
  const AddButton = (
    <Button
      onClick={() => setShowAddDialog(true)}
      variant="default"
      className="h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm"
      disabled={!isOwner}
    >
      <Plus className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
      <span className="hidden sm:inline">{t('team:addMember')}</span>
      <span className="sm:hidden">{t('team:addMemberShort')}</span>
    </Button>
  );

  return (
    <MainLayout title={t('team:pageTitle')}>
      <PageContainer className="min-h-[600px]">
        {/* Header with search and add button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <Input
                placeholder={t('team:searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOwner ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      {AddButton}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {t('team:ownerOnly')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              AddButton
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <>
            {/* Desktop skeleton */}
            <div className="hidden md:block">
              <TableSkeleton columnCount={5} rowCount={5} showHeader={true} />
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden space-y-4 mt-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : filteredTeamMembers.length === 0 ? (
          <EmptyState
            title={searchQuery ? t('common:noSearchResults') : t('team:emptyState.title')}
            description={searchQuery ? t('common:tryDifferentSearch') : t('team:emptyState.description')}
            icon={<Users2 className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
            actionLabel={isOwner ? t('team:addMember') : undefined}
            onAction={isOwner ? () => setShowAddDialog(true) : undefined}
            showAction={isOwner && !searchQuery}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300 border-gray-200/50 backdrop-blur-sm bg-white/95 dark:border-gray-700/50 dark:bg-gray-900/95 overflow-hidden animate-fade-in">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('team:table.member')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('team:table.email')}</TableHead>
                      <TableHead>{t('team:table.status')}</TableHead>
                      <TableHead>{t('team:table.role')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('team:table.joined')}</TableHead>
                      <TableHead className="text-right">{t('team:table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeamMembers.map((teamMember) => (
                      <TeamMemberRow
                        key={teamMember.id}
                        teamMember={teamMember}
                        isCurrentUser={teamMember.member?.user_id === user?.id}
                        isOwner={isOwner}
                        onChangeRole={handleChangeRole}
                        onRemove={handleRemove}
                        onRevoke={handleRevoke}
                        onCopyLink={handleCopyLink}
                        onResend={handleResend}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 mt-6">
              {filteredTeamMembers.map((teamMember) => (
                <TeamMemberCard
                  key={teamMember.id}
                  teamMember={teamMember}
                  isCurrentUser={teamMember.member?.user_id === user?.id}
                  isOwner={isOwner}
                  onChangeRole={handleChangeRole}
                  onRemove={handleRemove}
                  onRevoke={handleRevoke}
                  onCopyLink={handleCopyLink}
                  onResend={handleResend}
                />
              ))}
            </div>
          </>
        )}
      </PageContainer>

      {/* Dialogs */}
      <AddMemberDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedMember && selectedMember.member && (
        <>
          <ChangeMemberRoleDialog
            isOpen={showRoleDialog}
            onClose={() => {
              setShowRoleDialog(false);
              setSelectedMember(null);
            }}
            member={selectedMember.member}
            onSuccess={handleRoleChangeSuccess}
          />

          <RemoveMemberDialog
            isOpen={showRemoveDialog}
            onClose={() => {
              setShowRemoveDialog(false);
              setSelectedMember(null);
            }}
            member={selectedMember.member}
            onSuccess={handleRemoveSuccess}
          />
        </>
      )}
    </MainLayout>
  );
}
