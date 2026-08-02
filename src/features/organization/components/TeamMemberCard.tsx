import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Shield, UserMinus, UserCog, Calendar, Trash2, Link2, MailPlus, Percent } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import type { TeamMember } from '@/types/org';
import { cn } from '@/lib/utils';

interface TeamMemberCardProps {
  teamMember: TeamMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  onChangeRole?: (teamMember: TeamMember) => void;
  onRemove?: (teamMember: TeamMember) => void;
  onCommissionSettings?: (teamMember: TeamMember) => void;
  onRevoke?: (teamMember: TeamMember) => void;
  onCopyLink?: (teamMember: TeamMember) => void;
  onResend?: (teamMember: TeamMember) => void;
}

export const TeamMemberCard = memo(({
  teamMember,
  isCurrentUser,
  isOwner,
  onChangeRole,
  onRemove,
  onCommissionSettings,
  onRevoke,
  onCopyLink,
  onResend,
}: TeamMemberCardProps) => {
  const { t } = useTranslation('team');

  const displayName = teamMember.name || teamMember.email.split('@')[0];
  const joinedDate = teamMember.joinedAt
    ? new Date(teamMember.joinedAt).toLocaleDateString()
    : teamMember.invitedAt
    ? new Date(teamMember.invitedAt).toLocaleDateString()
    : '-';

  const isInvitation = teamMember.type === 'invitation';
  const canModifyMember = isOwner && !isCurrentUser && !isInvitation;
  const canEditCommission = isOwner && !isInvitation && Boolean(onCommissionSettings);
  const canModifyInvitation = isOwner && isInvitation;
  const showMenu = canModifyMember || canEditCommission || canModifyInvitation;

  return (
    <Card className={cn(
      'relative',
      isCurrentUser && 'bg-primary/5 ring-2 ring-primary/30',
      isInvitation && 'bg-warning/10'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <MemberAvatar
            name={teamMember.name}
            email={teamMember.email}
            avatarUrl={teamMember.avatarUrl}
            size="lg"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="truncate font-semibold text-foreground">
                {displayName}
              </span>
              {isCurrentUser && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {t('you')}
                </span>
              )}
            </div>

            <p className="mb-2 truncate text-sm text-muted-foreground">
              {teamMember.email}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={teamMember.status} size="sm" />
              <RoleBadge role={teamMember.role} size="sm" />
              <span className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {joinedDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('actions.label')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditCommission && onCommissionSettings && (
                  <DropdownMenuItem onClick={() => onCommissionSettings(teamMember)}>
                    <Percent className="mr-2 h-4 w-4" />
                    {t('actions.commissionSettings')}
                  </DropdownMenuItem>
                )}
                {canModifyMember && onChangeRole && onRemove && (
                  <>
                    {canEditCommission && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={() => onChangeRole(teamMember)}>
                      {teamMember.role === 'owner' ? (
                        <>
                          <UserCog className="mr-2 h-4 w-4" />
                          {t('actions.demoteToMember')}
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          {t('actions.promoteToOwner')}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onRemove(teamMember)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      {t('actions.removeMember')}
                    </DropdownMenuItem>
                  </>
                )}
                {canModifyInvitation && onRevoke && onCopyLink && onResend && (
                  <>
                    <DropdownMenuItem onClick={() => onCopyLink(teamMember)}>
                      <Link2 className="mr-2 h-4 w-4" />
                      {t('actions.copyInviteLink')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResend(teamMember)}>
                      <MailPlus className="mr-2 h-4 w-4" />
                      {t('actions.resendInvite')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onRevoke(teamMember)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('actions.revokeInvite')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TeamMemberCard.displayName = 'TeamMemberCard';
