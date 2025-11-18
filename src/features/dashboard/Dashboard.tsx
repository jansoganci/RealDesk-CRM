import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/dashboard/StatCard';
import { Building2, Chrome as Home, Users, FileText, CircleAlert as AlertCircle, Bell, ArrowRight, Calendar, DollarSign, UserCheck, Package, UserPlus, Search, TrendingUp, RefreshCw } from 'lucide-react';
import { propertiesService, ownersService, tenantsService, contractsService, remindersService, inquiriesService } from '../../lib/serviceProxy';
import { ReminderWithDetails } from '../../lib/serviceProxy';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/config/colors';
import { refreshExchangeRates, getCurrentExchangeRates, getExchangeRatesTimestamp, initializeExchangeRates } from '../../lib/currency';
import { toast } from 'sonner';
import { QuickAddButton } from '../quick-add';

export const Dashboard = () => {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshingRates, setRefreshingRates] = useState(false);
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
    rental: {
      total: 0,
      empty: 0,
      occupied: 0,
      inactive: 0,
    },
    sale: {
      total: 0,
      available: 0,
      underOffer: 0,
      sold: 0,
      inactive: 0,
    },
    rentalInquiries: 0,
    saleInquiries: 0,
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
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    await initializeExchangeRates();
    setExchangeRates(getCurrentExchangeRates());
    setLastUpdated(getExchangeRatesTimestamp());
  };

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      await refreshExchangeRates();
      setExchangeRates(getCurrentExchangeRates());
      setLastUpdated(getExchangeRatesTimestamp());
      toast.success(t('exchangeRates.refreshSuccess'));
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      toast.error(t('exchangeRates.refreshError'));
    } finally {
      setRefreshingRates(false);
    }
  };

  const formatLastUpdated = (timestamp: number | null): string => {
    if (!timestamp) return t('exchangeRates.justNow');
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('exchangeRates.justNow');
    if (minutes < 60) return t('exchangeRates.minutesAgo', { minutes });
    if (hours < 24) return t('exchangeRates.hoursAgo', { hours });
    return t('exchangeRates.daysAgo', { days });
  };

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
        rental: propertyStats.rental || { total: 0, empty: 0, occupied: 0, inactive: 0 },
        sale: propertyStats.sale || { total: 0, available: 0, underOffer: 0, sold: 0, inactive: 0 },
        rentalInquiries: inquiryStats.rental?.active || 0,
        saleInquiries: inquiryStats.sale?.active || 0,
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
        {/* Exchange Rates - Horizontal Bar (Full Width) */}
        <Card className="mb-6 shadow-sm border border-gray-200 bg-white">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {t('exchangeRates.title')}
                </span>
              </div>

              {/* Center: Rates */}
              <div className="flex items-center gap-4 flex-1 justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">USD</div>
                  <div className="text-base font-semibold text-gray-900">1.00</div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">TRY</div>
                  <div className="text-base font-semibold text-gray-900">
                    {exchangeRates.TRY?.toFixed(2) || '42.30'}
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">EUR</div>
                  <div className="text-base font-semibold text-gray-900">
                    {exchangeRates.EUR?.toFixed(2) || '49.09'}
                  </div>
                </div>
              </div>

              {/* Right: Last Updated & Refresh */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {lastUpdated && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {t('exchangeRates.lastUpdated')}: {formatLastUpdated(lastUpdated)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshRates}
                  disabled={refreshingRates}
                  className="h-7 w-7 p-0 hover:bg-gray-100"
                  title={t('exchangeRates.refreshButton')}
                >
                  {refreshingRates ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-600" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-gray-600" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Button */}
        <div className="flex justify-end mb-6">
          <QuickAddButton onSuccess={loadStats} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
          <StatCard
            title={t('stats.totalProperties')}
            value={stats.totalProperties}
            description={stats.totalProperties === 0 ? t('stats.noPropertiesYet') : t('stats.totalPropertiesDescription')}
            icon={<Building2 className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="navy"
            loading={loading}
          />

          <StatCard
            title={t('stats.occupied')}
            value={stats.occupied}
            description={t('stats.occupiedDescription')}
            icon={<Home className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="emerald"
            loading={loading}
          />

          <StatCard
            title={t('stats.totalOwners')}
            value={stats.totalOwners}
            description={t('stats.totalOwnersDescription')}
            icon={<UserCheck className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="navy"
            loading={loading}
          />

          <StatCard
            title={t('stats.emptyProperties')}
            value={stats.empty}
            description={t('stats.emptyPropertiesDescription')}
            icon={<Package className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="amber"
            loading={loading}
          />

          <StatCard
            title={t('stats.totalTenants')}
            value={stats.totalTenants}
            description={t('stats.totalTenantsDescription')}
            icon={<Users className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="blue"
            loading={loading}
          />

          <StatCard
            title={t('stats.unassignedTenants')}
            value={stats.unassignedTenants}
            description={t('stats.unassignedTenantsDescription')}
            icon={<UserPlus className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="purple"
            loading={loading}
          />

          <StatCard
            title={t('stats.activeContracts')}
            value={stats.activeContracts}
            description={t('stats.activeContractsDescription')}
            icon={<FileText className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="gold"
            loading={loading}
          />

          <StatCard
            title={t('stats.activeInquiries')}
            value={stats.activeInquiries}
            description={t('stats.activeInquiriesDescription')}
            icon={<Search className={`h-5 w-5 ${COLORS.text.white}`} />}
            iconColor="blue"
            loading={loading}
          />
        </div>

        {/* Properties by Type - Compact View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rental Properties - Compact */}
          <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-blue-200/50 backdrop-blur-sm bg-gradient-to-br from-blue-50 to-slate-50 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {t('propertiesSummary.rentalPropertiesTitle')}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    {t('stats.rentalPropertiesDescription')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/70 border border-blue-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.rentalProperties')}</div>
                  <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.rental.total}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-emerald-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.rentalOccupied')}</div>
                  <div className="text-2xl font-bold text-emerald-700">{loading ? '-' : stats.rental.occupied}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-amber-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.rentalEmpty')}</div>
                  <div className="text-2xl font-bold text-amber-700">{loading ? '-' : stats.rental.empty}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-blue-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.rentalInquiries')}</div>
                  <div className="text-2xl font-bold text-blue-700">{loading ? '-' : stats.rentalInquiries}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Properties - Compact */}
          <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-amber-200/50 backdrop-blur-sm bg-gradient-to-br from-amber-50 to-yellow-50 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600 rounded-lg shadow-md">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {t('propertiesSummary.salePropertiesTitle')}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    {t('stats.salePropertiesDescription')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/70 border border-amber-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.saleProperties')}</div>
                  <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.sale.total}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-emerald-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.saleAvailable')}</div>
                  <div className="text-2xl font-bold text-emerald-700">{loading ? '-' : stats.sale.available}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-amber-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.saleSold')}</div>
                  <div className="text-2xl font-bold text-green-700">{loading ? '-' : stats.sale.sold}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-amber-200/50">
                  <div className="text-xs text-slate-600 mb-1">{t('stats.saleInquiries')}</div>
                  <div className="text-2xl font-bold text-amber-700">{loading ? '-' : stats.saleInquiries}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {reminders.length > 0 && (
          <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-amber-200/50 bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl shadow-gold">
                    <Bell className={`h-5 w-5 ${COLORS.text.white}`} />
                  </div>
                  <div>
                    <CardTitle className="text-amber-900 font-bold">{t('reminders.title')}</CardTitle>
                    <CardDescription className="text-amber-700 font-medium">
                      {t('reminders.description', { count: reminders.length, s: reminders.length > 1 ? 's' : '' })}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reminders')}
                  className="border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all"
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
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200/50 hover:shadow-lg hover:border-amber-300 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4 text-amber-600" />
                        <p className="font-semibold text-slate-900">{reminder.property?.address}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t('reminders.contractEnds')}: {format(new Date(reminder.end_date), 'MMM dd, yyyy')}
                        </span>
                        {reminder.expected_new_rent && (
                          <span className="flex items-center gap-1 font-medium text-amber-700">
                            <DollarSign className="h-3 w-3" />
                            ${reminder.rent_amount?.toFixed(0)} → ${reminder.expected_new_rent.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        urgency === 'urgent'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                          : urgency === 'soon'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg'
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
          <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-amber-200/50 bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl shadow-gold">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-amber-900 font-bold">{t('contractsExpiringSoon')}</CardTitle>
                  <CardDescription className="text-amber-700 font-medium">
                    {t('reminders.contractsExpiringDescription', { count: stats.expiringSoon, s: stats.expiringSoon > 1 ? 's' : '' })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800 font-medium">{t('reminders.reviewContracts')}</p>
            </CardContent>
          </Card>
        )}

        {(actionItems.propertiesMissingInfo.total > 0 ||
          actionItems.tenantsMissingInfo.total > 0 ||
          actionItems.ownersMissingInfo.total > 0) && (
          <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-blue-200/50 bg-gradient-to-br from-blue-50 to-slate-50 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 font-bold">{t('actionItems.title')}</CardTitle>
                  <CardDescription className="text-slate-700 font-medium">
                    {t('actionItems.description')}
                  </CardDescription>
                </div>
              </div>
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

        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-gray-200/50 backdrop-blur-sm bg-white/90 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">{t('quickActions')}</CardTitle>
            <CardDescription className="text-slate-600 font-medium">{t('getStarted')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{t('navigationTip')}</p>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};
