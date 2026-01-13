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
import { MoreVertical, Shield, UserMinus, UserCog, Calendar, Trash2, Link2, MailPlus } from 'lucide-react';
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
  const canModifyInvitation = isOwner && isInvitation;

  return (
    <Card className={cn(
      'relative',
      isCurrentUser && 'ring-2 ring-blue-200 bg-blue-50/30',
      isInvitation && 'bg-amber-50/20'
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
              <span className="font-semibold text-gray-900 truncate">
                {displayName}
              </span>
              {isCurrentUser && (
                <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                  {t('you')}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 truncate mb-2">
              {teamMember.email}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={teamMember.status} size="sm" />
              <RoleBadge role={teamMember.role} size="sm" />
              <span className="flex items-center text-xs text-gray-400">
                <Calendar className="h-3 w-3 mr-1" />
                {joinedDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          {(canModifyMember || canModifyInvitation) && (
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
                {canModifyMember && onChangeRole && onRemove && (
                  <>
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
                      className="text-red-600 focus:text-red-600"
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
                      className="text-red-600 focus:text-red-600"
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
