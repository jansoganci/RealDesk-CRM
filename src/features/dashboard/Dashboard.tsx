import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/dashboard/StatCard';
import { Building2, Chrome as Home, Users, FileText, CircleAlert as AlertCircle, Bell, ArrowRight, Calendar, DollarSign, UserCheck, Package, UserPlus, Search } from 'lucide-react';
import { propertiesService, ownersService, tenantsService, contractsService, remindersService, inquiriesService } from '../../lib/serviceProxy';
import { ReminderWithDetails } from '../../lib/serviceProxy';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/config/colors';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupied: 0,
    empty: 0,
    inactive: 0,
    totalOwners: 0,
    totalTenants: 0,
    unassignedTenants: 0,
    activeContracts: 0,
    expiringSoon: 0,
    activeInquiries: 0,
  });
  const [actionItems, setActionItems] = useState({
    propertiesMissingInfo: {
      noPhotos: 0,
      noLocation: 0,
      total: 0,
    },
    tenantsMissingInfo: {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    },
    ownersMissingInfo: {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    },
  });
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [
        propertyStats,
        owners,
        tenantStats,
        contractStats,
        upcomingReminders,
        propertiesMissingInfo,
        tenantsMissingInfo,
        ownersMissingInfo,
        inquiryStats,
      ] = await Promise.all([
        propertiesService.getStats(),
        ownersService.getAll(),
        tenantsService.getStats(),
        contractsService.getStats(),
        remindersService.getUpcomingReminders(60),
        propertiesService.getPropertiesWithMissingInfo(),
        tenantsService.getTenantsWithMissingInfo(),
        ownersService.getOwnersWithMissingInfo(),
        inquiriesService.getStats(),
      ]);

      setStats({
        totalProperties: propertyStats.total,
        occupied: propertyStats.occupied,
        empty: propertyStats.empty,
        inactive: propertyStats.inactive,
        totalOwners: owners.length,
        totalTenants: tenantStats.total,
        unassignedTenants: tenantStats.unassigned,
        activeContracts: contractStats.active,
        expiringSoon: contractStats.expiringSoon,
        activeInquiries: inquiryStats.active,
      });

      setActionItems({
        propertiesMissingInfo,
        tenantsMissingInfo,
        ownersMissingInfo,
      });

      setReminders(upcomingReminders);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Dashboard">
      <PageContainer>
        <div>
          <h2 className={`text-3xl font-bold ${COLORS.gray.text900}`}>{t('welcomeBack')}</h2>
          <p className={`${COLORS.gray.text600} mt-1`}>{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatCard
            title={t('stats.totalProperties')}
            value={stats.totalProperties}
            description={stats.totalProperties === 0 ? t('stats.noPropertiesYet') : t('stats.totalPropertiesDescription')}
            icon={<Building2 className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="teal"
            loading={loading}
          />

          <StatCard
            title={t('stats.occupied')}
            value={stats.occupied}
            description={t('stats.occupiedDescription')}
            icon={<Home className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="green"
            loading={loading}
          />

          <StatCard
            title={t('stats.totalOwners')}
            value={stats.totalOwners}
            description={t('stats.totalOwnersDescription')}
            icon={<UserCheck className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="teal"
            loading={loading}
          />

          <StatCard
            title={t('stats.emptyProperties')}
            value={stats.empty}
            description={t('stats.emptyPropertiesDescription')}
            icon={<Package className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="yellow"
            loading={loading}
          />

          <StatCard
            title={t('stats.totalTenants')}
            value={stats.totalTenants}
            description={t('stats.totalTenantsDescription')}
            icon={<Users className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="blue"
            loading={loading}
          />

          <StatCard
            title={t('stats.unassignedTenants')}
            value={stats.unassignedTenants}
            description={t('stats.unassignedTenantsDescription')}
            icon={<UserPlus className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="purple"
            loading={loading}
          />

          <StatCard
            title={t('stats.activeContracts')}
            value={stats.activeContracts}
            description={t('stats.activeContractsDescription')}
            icon={<FileText className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="orange"
            loading={loading}
          />

          <StatCard
            title={t('stats.activeInquiries')}
            value={stats.activeInquiries}
            description={t('stats.activeInquiriesDescription')}
            icon={<Search className={`h-4 w-4 ${COLORS.text.white}`} />}
            iconColor="blue"
            loading={loading}
          />
        </div>

        <Card className={`shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur}`}>
          <CardHeader>
            <CardTitle>{t('propertiesSummary.title')}</CardTitle>
            <CardDescription>{t('propertiesSummary.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`${COLORS.gray.text700} font-medium`}>{t('propertiesSummary.empty')}</span>
                <Badge className={`${COLORS.status.empty.gradient} ${COLORS.text.white}`}>
                  {loading ? '-' : stats.empty}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${COLORS.gray.text700} font-medium`}>{t('propertiesSummary.occupied')}</span>
                <Badge className={`${COLORS.status.occupied.gradient} ${COLORS.text.white}`}>
                  {loading ? '-' : stats.occupied}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${COLORS.gray.text700} font-medium`}>{t('propertiesSummary.inactive')}</span>
                <Badge className={`${COLORS.status.inactive.gradient} ${COLORS.text.white}`}>
                  {loading ? '-' : stats.inactive}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {reminders.length > 0 && (
          <Card className={`shadow-lg ${COLORS.warning.border} ${COLORS.warning.bgGradientBr} backdrop-blur-sm`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 ${COLORS.warning.dark} rounded-lg`}>
                    <Bell className={`h-5 w-5 ${COLORS.text.white}`} />
                  </div>
                  <div>
                    <CardTitle className={COLORS.warning.textDarker}>{t('reminders.title')}</CardTitle>
                    <CardDescription className={COLORS.warning.textDark}>
                      {t('reminders.description', { count: reminders.length, s: reminders.length > 1 ? 's' : '' })}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reminders')}
                  className={`${COLORS.warning.borderHover} ${COLORS.warning.hoverBg}`}
                >
                  {t('reminders.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reminders.slice(0, 3).map((reminder) => {
                const urgency = remindersService.getReminderUrgencyCategory(reminder.days_until_end);
                return (
                  <div
                    key={reminder.id}
                    className={`flex items-center justify-between p-3 ${COLORS.card.bg} rounded-lg border ${COLORS.warning.border} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className={`h-4 w-4 ${COLORS.warning.text}`} />
                        <p className={`font-medium ${COLORS.gray.text900}`}>{reminder.property?.address}</p>
                      </div>
                      <div className={`flex items-center gap-4 text-sm ${COLORS.gray.text600}`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t('reminders.contractEnds')}: {format(new Date(reminder.end_date), 'MMM dd, yyyy')}
                        </span>
                        {reminder.expected_new_rent && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${reminder.rent_amount?.toFixed(0)} → ${reminder.expected_new_rent.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        urgency === 'urgent'
                          ? COLORS.danger.bg
                          : urgency === 'soon'
                          ? COLORS.warning.dark
                          : COLORS.primary.bg
                      }
                    >
                      {reminder.days_until_end} days
                    </Badge>
                  </div>
                );
              })}
              {reminders.length > 3 && (
                <p className={`text-sm ${COLORS.warning.textDark} text-center pt-2`}>
                  {t('reminders.moreReminders', { count: reminders.length - 3, s: reminders.length - 3 > 1 ? 's' : '' })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {stats.expiringSoon > 0 && (
          <Card className={`shadow-lg ${COLORS.warning.border} ${COLORS.warning.bgLight}/50 backdrop-blur-sm`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${COLORS.warning.text}`} />
                <CardTitle className={COLORS.warning.textDarker}>{t('contractsExpiringSoon')}</CardTitle>
              </div>
              <CardDescription className={COLORS.warning.textDark}>
                {t('reminders.contractsExpiringDescription', { count: stats.expiringSoon, s: stats.expiringSoon > 1 ? 's' : '' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${COLORS.warning.textDark}`}>{t('reminders.reviewContracts')}</p>
            </CardContent>
          </Card>
        )}

        {(actionItems.propertiesMissingInfo.total > 0 ||
          actionItems.tenantsMissingInfo.total > 0 ||
          actionItems.ownersMissingInfo.total > 0) && (
          <Card className={`shadow-lg ${COLORS.warning.border} ${COLORS.warning.bgLight}/50 backdrop-blur-sm`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${COLORS.warning.text}`} />
                <CardTitle className={COLORS.warning.textDarker}>{t('actionItems.title')}</CardTitle>
              </div>
              <CardDescription className={COLORS.warning.textDark}>
                {t('actionItems.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionItems.propertiesMissingInfo.total > 0 && (
                <div>
                  <p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.properties.title')}</p>
                  <ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>
                    {actionItems.propertiesMissingInfo.noPhotos > 0 && (
                      <li className="flex items-center gap-2">
                        <span>•</span>
                        <span>{t('actionItems.properties.noPhotos', { count: actionItems.propertiesMissingInfo.noPhotos })}</span>
                      </li>
                    )}
                    {actionItems.propertiesMissingInfo.noLocation > 0 && (
                      <li className="flex items-center gap-2">
                        <span>•</span>
                        <span>{t('actionItems.properties.noLocation', { count: actionItems.propertiesMissingInfo.noLocation })}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {actionItems.tenantsMissingInfo.total > 0 && (
                <div>
                  <p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.tenants.title')}</p>
                  <ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>
                    {actionItems.tenantsMissingInfo.noContact > 0 && (
                      <li className="flex items-center gap-2">
                        <span>•</span>
                        <span>{t('actionItems.tenants.noContact', { count: actionItems.tenantsMissingInfo.noContact })}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {actionItems.ownersMissingInfo.total > 0 && (
                <div>
                  <p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.owners.title')}</p>
                  <ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>
                    {actionItems.ownersMissingInfo.noContact > 0 && (
                      <li className="flex items-center gap-2">
                        <span>•</span>
                        <span>{t('actionItems.owners.noContact', { count: actionItems.ownersMissingInfo.noContact })}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={`shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur}`}>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
            <CardDescription>{t('getStarted')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${COLORS.gray.text600}`}>{t('navigationTip')}</p>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};
