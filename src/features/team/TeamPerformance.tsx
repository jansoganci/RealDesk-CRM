import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { useTeamPerformance } from './hooks/useTeamPerformance';
import { TeamSummaryCard } from './components/TeamSummaryCard';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ROUTES } from '../../config/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import {
  DollarSign,
  Handshake,
  FileText,
  RefreshCw,
  Users,
  AlertCircle,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';
import { COLORS } from '../../config/colors';
import type { PeriodFilter, TeamMemberPerformance } from './types/team.types';

/**
 * Team Performance Dashboard
 * Owner-only view of team performance metrics
 */
export function TeamPerformance() {
  const { t } = useTranslation(['team', 'common']);
  const navigate = useNavigate();
  const { currency } = useAuth();
  const { isOwner, loading: orgLoading } = useOrg();
  const { data, loading, error, periodFilter, setPeriodFilter, refetch } = useTeamPerformance();

  const userCurrency = currency || 'USD';

  const periodOptions: { value: PeriodFilter; label: string }[] = useMemo(
    () => [
      { value: 'thisMonth', label: t('periods.thisMonth') },
      { value: 'lastMonth', label: t('periods.lastMonth') },
      { value: 'thisQuarter', label: t('periods.thisQuarter') },
      { value: 'thisYear', label: t('periods.thisYear') },
    ],
    [t]
  );

  // Access denied state
  if (!orgLoading && !isOwner) {
    return (
      <MainLayout title={t('pageTitle')}>
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <ShieldAlert className={`h-16 w-16 ${COLORS.danger.text}`} />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('errors.accessDeniedTitle')}</h3>
              <p className={`text-sm ${COLORS.muted.textLight}`}>
                {t('errors.accessDeniedDescription')}
              </p>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <MainLayout title={t('pageTitle')}>
        <PageContainer>
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>

            {/* Summary cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout title={t('pageTitle')}>
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <AlertCircle className={`h-16 w-16 ${COLORS.danger.text}`} />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('errors.loadFailedTitle')}</h3>
              <p className={`text-sm ${COLORS.muted.textLight} mb-4`}>{error}</p>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('actions.tryAgain')}
              </Button>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Empty state (no team members)
  if (!data || data.members.length === 0) {
    return (
      <MainLayout title={t('pageTitle')}>
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Users className={`h-16 w-16 ${COLORS.muted.text}`} />
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
                <p className={`text-sm ${COLORS.muted.textLight}`}>{t('empty.description')}</p>
              </div>
              <Button onClick={() => navigate(ROUTES.TEAM_MEMBERS)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('inviteToTrack')}
              </Button>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainLayout title={t('pageTitle')}>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
              <p className={`text-sm ${COLORS.muted.textLight}`}>{data.period.label}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.TEAM_MEMBERS)}
                className="w-full sm:w-auto"
              >
                <Users className="h-4 w-4 mr-2" />
                {t('manageMembers')}
              </Button>
              <Select
                value={periodFilter}
                onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Org-wide Company Dollar callout — the headline number for the owner */}
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">{t('orgTotal.companyDollarLabel')}</p>
                  <p className="mt-1 text-3xl font-bold text-white tabular-nums">
                    {formatCurrency(data.summary.totalCompanyDollar, userCurrency)}
                  </p>
                </div>
                <div className="flex-shrink-0 rounded-lg bg-slate-800 p-3">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TeamSummaryCard
              title={t('metrics.commission')}
              value={data.summary.totalGrossCommission}
              trend={data.summary.trend.commission}
              icon={<DollarSign className="h-5 w-5" />}
              variant="primary"
              formatValue={(v) => formatCurrency(Number(v), userCurrency)}
            />
            <TeamSummaryCard
              title={t('metrics.netCommission')}
              value={data.summary.totalNetCommission}
              icon={<DollarSign className="h-5 w-5" />}
              variant="success"
              formatValue={(v) => formatCurrency(Number(v), userCurrency)}
            />
            <TeamSummaryCard
              title={t('metrics.deals')}
              value={data.summary.totalDeals}
              icon={<Handshake className="h-5 w-5" />}
              variant="success"
            />
            <TeamSummaryCard
              title={t('metrics.activeContracts')}
              value={data.summary.activeContracts}
              icon={<FileText className="h-5 w-5" />}
            />
          </div>

          <p className={`text-xs ${COLORS.muted.textLight}`}>{t('caveats.splitAccuracy')}</p>

          {/* Team Members Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('table.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-sm font-medium text-gray-500 pb-3">
                        {t('table.member')}
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-3">
                        {t('table.commission')}
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-3">
                        {t('table.net')}
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-3">
                        {t('table.companyDollar')}
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-3">
                        {t('table.deals')}
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 pb-3">
                        {t('table.contracts')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((member: TeamMemberPerformance) => (
                      <tr key={member.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {member.avatarUrl && (
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                              )}
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 font-medium text-gray-900">
                          {formatCurrency(member.grossCommission, userCurrency)}
                        </td>
                        <td className="text-right py-3 font-medium text-emerald-700">
                          {formatCurrency(member.netCommission, userCurrency)}
                        </td>
                        <td className="text-right py-3 text-gray-600">
                          {formatCurrency(member.companyDollar, userCurrency)}
                        </td>
                        <td className="text-right py-3 text-gray-600">{member.deals}</td>
                        <td className="text-right py-3 text-gray-600">{member.activeContracts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden space-y-3">
                {data.members.map((member: TeamMemberPerformance) => (
                  <div
                    key={member.id}
                    className="py-2 border-b border-gray-100 last:border-0 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {member.avatarUrl && (
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-gray-900">{member.name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-12 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">{t('table.commission')}</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(member.grossCommission, userCurrency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('table.net')}</p>
                        <p className="font-medium text-emerald-700">
                          {formatCurrency(member.netCommission, userCurrency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('table.companyDollar')}</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(member.companyDollar, userCurrency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
