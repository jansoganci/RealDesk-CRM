import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Shield, UserMinus, UserCog, Trash2, Link2, MailPlus } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import type { TeamMember } from '@/types/org';
import { cn } from '@/lib/utils';

interface TeamMemberRowProps {
  teamMember: TeamMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  onChangeRole?: (teamMember: TeamMember) => void;
  onRemove?: (teamMember: TeamMember) => void;
  onRevoke?: (teamMember: TeamMember) => void;
  onCopyLink?: (teamMember: TeamMember) => void;
  onResend?: (teamMember: TeamMember) => void;
}

export const TeamMemberRow = memo(({
  teamMember,
  isCurrentUser,
  isOwner,
  onChangeRole,
  onRemove,
  onRevoke,
  onCopyLink,
  onResend,
}: TeamMemberRowProps) => {
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
    <TableRow className={cn(
      isCurrentUser && 'bg-blue-50/50',
      isInvitation && 'bg-amber-50/20'
    )}>
      {/* Member Info */}
      <TableCell>
        <div className="flex items-center gap-3">
          <MemberAvatar
            name={teamMember.name}
            email={teamMember.email}
            avatarUrl={teamMember.avatarUrl}
            size="md"
          />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-slate-50">
              {displayName}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                  {t('you')}
                </span>
              )}
            </span>
            {teamMember.name && (
              <span className="text-sm text-gray-500 dark:text-slate-400">{teamMember.email}</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Email (hidden on smaller screens, shown in member info) */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-gray-600 dark:text-slate-300">{teamMember.email}</span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge status={teamMember.status} />
      </TableCell>

      {/* Role */}
      <TableCell>
        <RoleBadge role={teamMember.role} />
      </TableCell>

      {/* Joined/Invited Date */}
      <TableCell className="hidden md:table-cell">
        <span className="text-gray-600 dark:text-slate-300">{joinedDate}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        {canModifyMember && onChangeRole && onRemove ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">{t('actions.label')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : canModifyInvitation && onRevoke && onCopyLink && onResend ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">{t('actions.label')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isCurrentUser ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('cannotModifySelf')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : !isOwner ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('ownerOnly')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </TableCell>
    </TableRow>
  );
});

TeamMemberRow.displayName = 'TeamMemberRow';
