import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { StatCard } from '../../components/dashboard/StatCard';
import { Building2, Chrome as Home, Users, FileText, CircleAlert as AlertCircle, UserCheck, Package, UserPlus, Search, TrendingUp } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import { useExchangeRates } from './hooks/useExchangeRates';
import { ActionItemsCard } from './components/ActionItemsCard';
import { RemindersSection } from './components/RemindersSection';
import { ExchangeRatesCard } from './components/ExchangeRatesCard';
import { COLORS } from '@/config/colors';

export const Dashboard = () => {
  // Data fetching hook
  const {
    stats,
    actionItems,
    reminders,
    loading,
    refreshData: loadStats,
  } = useDashboardData();

  // Exchange rates hook
  const {
    exchangeRates,
    lastUpdated,
    refreshingRates,
    refreshRates: handleRefreshRates,
    formatLastUpdated,
  } = useExchangeRates();

  const { t } = useTranslation('dashboard');


  return (
    <MainLayout title="Dashboard">
      <PageContainer>
        <ExchangeRatesCard
          exchangeRates={exchangeRates}
          lastUpdated={lastUpdated}
          refreshingRates={refreshingRates}
          onRefresh={handleRefreshRates}
          formatLastUpdated={formatLastUpdated}
          onQuickAddSuccess={loadStats}
        />

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

        <RemindersSection reminders={reminders} />

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

        <ActionItemsCard actionItems={actionItems} />

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
