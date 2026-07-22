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
import { MoreHorizontal, Shield, UserMinus, UserCog } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';
import type { OrgMemberWithUser } from '@/types/org';
import { cn } from '@/lib/utils';

interface MemberRowProps {
  member: OrgMemberWithUser;
  isCurrentUser: boolean;
  isOwner: boolean;
  onChangeRole: (member: OrgMemberWithUser) => void;
  onRemove: (member: OrgMemberWithUser) => void;
}

export const MemberRow = memo(({
  member,
  isCurrentUser,
  isOwner,
  onChangeRole,
  onRemove,
}: MemberRowProps) => {
  const { t } = useTranslation('team');

  const userName = member.user?.raw_user_meta_data?.full_name || null;
  const userEmail = member.user?.email || 'Unknown';
  const avatarUrl = member.user?.raw_user_meta_data?.avatar_url || null;

  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString()
    : '-';

  // Cannot modify yourself or if not owner
  const canModify = isOwner && !isCurrentUser;

  return (
    <TableRow className={cn(isCurrentUser && 'bg-blue-50/50')}>
      {/* Member Info */}
      <TableCell>
        <div className="flex items-center gap-3">
          <MemberAvatar
            name={userName}
            email={userEmail}
            avatarUrl={avatarUrl}
            size="md"
          />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-slate-50">
              {userName || userEmail.split('@')[0]}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                  {t('you')}
                </span>
              )}
            </span>
            {userName && (
              <span className="text-sm text-gray-500 dark:text-slate-400">{userEmail}</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Email (hidden on smaller screens, shown in member info) */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-gray-600 dark:text-slate-300">{userEmail}</span>
      </TableCell>

      {/* Role */}
      <TableCell>
        <RoleBadge role={member.role} />
      </TableCell>

      {/* Joined Date */}
      <TableCell className="hidden md:table-cell">
        <span className="text-gray-600 dark:text-slate-300">{joinedDate}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        {canModify ? (
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
              <DropdownMenuItem onClick={() => onChangeRole(member)}>
                {member.role === 'owner' ? (
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
                onClick={() => onRemove(member)}
                className="text-red-600 focus:text-red-600"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                {t('actions.removeMember')}
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

MemberRow.displayName = 'MemberRow';
