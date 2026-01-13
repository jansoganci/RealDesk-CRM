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
import { MoreVertical, Shield, UserMinus, UserCog, Calendar } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';
import type { OrgMemberWithUser } from '@/types/org';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: OrgMemberWithUser;
  isCurrentUser: boolean;
  isOwner: boolean;
  onChangeRole: (member: OrgMemberWithUser) => void;
  onRemove: (member: OrgMemberWithUser) => void;
}

export const MemberCard = memo(({
  member,
  isCurrentUser,
  isOwner,
  onChangeRole,
  onRemove,
}: MemberCardProps) => {
  const { t } = useTranslation('team');

  const userName = member.user?.raw_user_meta_data?.full_name || null;
  const userEmail = member.user?.email || 'Unknown';
  const avatarUrl = member.user?.raw_user_meta_data?.avatar_url || null;

  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString()
    : '-';

  const canModify = isOwner && !isCurrentUser;

  return (
    <Card className={cn(
      'relative',
      isCurrentUser && 'ring-2 ring-blue-200 bg-blue-50/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <MemberAvatar
            name={userName}
            email={userEmail}
            avatarUrl={avatarUrl}
            size="lg"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 truncate">
                {userName || userEmail.split('@')[0]}
              </span>
              {isCurrentUser && (
                <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                  {t('you')}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 truncate mb-2">
              {userEmail}
            </p>

            <div className="flex items-center gap-3">
              <RoleBadge role={member.role} size="sm" />
              <span className="flex items-center text-xs text-gray-400">
                <Calendar className="h-3 w-3 mr-1" />
                {joinedDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          {canModify && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MemberCard.displayName = 'MemberCard';
