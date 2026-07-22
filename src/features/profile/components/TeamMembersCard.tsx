import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users2, ChevronRight, UserPlus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrg } from '@/contexts/OrgContext';
import { organizationService } from '@/services/organization.service';
import { MemberAvatar } from '@/features/organization/components/MemberAvatar';
import { RoleBadge } from '@/features/organization/components/RoleBadge';
import { ROUTES } from '@/config/constants';
import type { OrgMemberWithUser } from '@/types/org';

export function TeamMembersCard() {
  const { t } = useTranslation(['profile', 'team']);
  const navigate = useNavigate();
  const { currentOrg, isOwner, loading: orgLoading } = useOrg();

  const [members, setMembers] = useState<OrgMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      if (!currentOrg) return;

      try {
        const data = await organizationService.getMembers(currentOrg.id);
        setMembers(data);
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading) {
      fetchMembers();
    }
  }, [currentOrg, orgLoading]);

  // Loading skeleton
  if (loading || orgLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if no org
  if (!currentOrg) {
    return null;
  }

  // Show max 5 members in preview
  const previewMembers = members.slice(0, 5);
  const hasMore = members.length > 5;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-xl shadow-lg shadow-green-900/20">
            <Users2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {t('profile:teamMembers.title')}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('profile:teamMembers.count', { count: members.length })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.TEAM)}
          className="gap-2"
        >
          {t('profile:teamMembers.viewAll')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {previewMembers.map((member) => {
            const userName = member.user?.raw_user_meta_data?.full_name || null;
            const userEmail = member.user?.email || 'Unknown';
            const avatarUrl = member.user?.raw_user_meta_data?.avatar_url || null;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 py-1"
              >
                <MemberAvatar
                  name={userName}
                  email={userEmail}
                  avatarUrl={avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-50 truncate">
                    {userName || userEmail.split('@')[0]}
                  </p>
                </div>
                <RoleBadge role={member.role} size="sm" showIcon={false} />
              </div>
            );
          })}

          {hasMore && (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center pt-2">
              {t('profile:teamMembers.andMore', { count: members.length - 5 })}
            </p>
          )}

          {members.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
              {t('profile:teamMembers.empty')}
            </p>
          )}
        </div>

        {/* Add member button for owners */}
        {isOwner && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.TEAM)}
              className="w-full gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {t('profile:teamMembers.addMember')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
