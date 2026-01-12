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
import type { OrgMemberWithUser } from '@/types/org';

import { MemberRow } from './components/MemberRow';
import { MemberCard } from './components/MemberCard';
import { AddMemberDialog } from './components/AddMemberDialog';
import { ChangeMemberRoleDialog } from './components/ChangeMemberRoleDialog';
import { RemoveMemberDialog } from './components/RemoveMemberDialog';

import { Search, Plus, Info } from 'lucide-react';
import { COLORS } from '@/config/colors';

export function TeamMembersList() {
  const { t } = useTranslation(['team', 'common']);
  const { user } = useAuth();
  const { currentOrg, isOwner } = useOrg();

  // State
  const [members, setMembers] = useState<OrgMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMemberWithUser | null>(null);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);
      const data = await organizationService.getMembers(currentOrg.id);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error(t('common:error'));
    } finally {
      setLoading(false);
    }
  }, [currentOrg, t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filter members by search
  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const name = member.user?.raw_user_meta_data?.full_name?.toLowerCase() || '';
    const email = member.user?.email?.toLowerCase() || '';

    return name.includes(query) || email.includes(query);
  });

  // Handlers
  const handleChangeRole = (member: OrgMemberWithUser) => {
    setSelectedMember(member);
    setShowRoleDialog(true);
  };

  const handleRemove = (member: OrgMemberWithUser) => {
    setSelectedMember(member);
    setShowRemoveDialog(true);
  };

  const handleAddSuccess = () => {
    fetchMembers();
  };

  const handleRoleChangeSuccess = () => {
    fetchMembers();
    setShowRoleDialog(false);
    setSelectedMember(null);
  };

  const handleRemoveSuccess = () => {
    fetchMembers();
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
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${COLORS.muted.textLight}`} />
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
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-48 bg-gray-200 rounded" />
                      <div className="h-5 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            title={searchQuery ? t('common:noSearchResults') : t('team:emptyState.title')}
            description={searchQuery ? t('common:tryDifferentSearch') : t('team:emptyState.description')}
            icon={<Users2 className="h-12 w-12 text-gray-400" />}
            actionLabel={isOwner ? t('team:addMember') : undefined}
            onAction={isOwner ? () => setShowAddDialog(true) : undefined}
            showAction={isOwner && !searchQuery}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300 border-gray-200/50 backdrop-blur-sm bg-white/95 overflow-hidden animate-fade-in">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('team:table.member')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('team:table.email')}</TableHead>
                      <TableHead>{t('team:table.role')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('team:table.joined')}</TableHead>
                      <TableHead className="text-right">{t('team:table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        isCurrentUser={member.user_id === user?.id}
                        isOwner={isOwner}
                        onChangeRole={handleChangeRole}
                        onRemove={handleRemove}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 mt-6">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isCurrentUser={member.user_id === user?.id}
                  isOwner={isOwner}
                  onChangeRole={handleChangeRole}
                  onRemove={handleRemove}
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

      {selectedMember && (
        <>
          <ChangeMemberRoleDialog
            isOpen={showRoleDialog}
            onClose={() => {
              setShowRoleDialog(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            onSuccess={handleRoleChangeSuccess}
          />

          <RemoveMemberDialog
            isOpen={showRemoveDialog}
            onClose={() => {
              setShowRemoveDialog(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            onSuccess={handleRemoveSuccess}
          />
        </>
      )}
    </MainLayout>
  );
}
