import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/dashboard/StatCard';
import { Building2, Chrome as Home, Users, FileText, CircleAlert as AlertCircle, Bell, ArrowRight, Calendar, DollarSign, UserCheck, Package, UserPlus, Search, TrendingUp, ShoppingCart } from 'lucide-react';
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

        {/* Rental Properties Stats */}
        <div>
          <h3 className={`text-xl font-bold ${COLORS.gray.text900} mb-4`}>{t('propertiesSummary.rentalPropertiesTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            <StatCard
              title={t('stats.rentalProperties')}
              value={stats.rental.total}
              description={t('stats.rentalPropertiesDescription')}
              icon={<Home className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="blue"
              loading={loading}
            />

            <StatCard
              title={t('stats.rentalEmpty')}
              value={stats.rental.empty}
              description={t('stats.rentalEmptyDescription')}
              icon={<Package className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="amber"
              loading={loading}
            />

            <StatCard
              title={t('stats.rentalOccupied')}
              value={stats.rental.occupied}
              description={t('stats.rentalOccupiedDescription')}
              icon={<Home className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="emerald"
              loading={loading}
            />

            <StatCard
              title={t('stats.rentalInquiries')}
              value={stats.rentalInquiries}
              description={t('stats.rentalInquiriesDescription')}
              icon={<Search className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="blue"
              loading={loading}
            />
          </div>
        </div>

        {/* Sale Properties Stats */}
        <div>
          <h3 className={`text-xl font-bold ${COLORS.gray.text900} mb-4`}>{t('propertiesSummary.salePropertiesTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            <StatCard
              title={t('stats.saleProperties')}
              value={stats.sale.total}
              description={t('stats.salePropertiesDescription')}
              icon={<Building2 className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="gold"
              loading={loading}
            />

            <StatCard
              title={t('stats.saleAvailable')}
              value={stats.sale.available}
              description={t('stats.saleAvailableDescription')}
              icon={<TrendingUp className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="emerald"
              loading={loading}
            />

            <StatCard
              title={t('stats.saleUnderOffer')}
              value={stats.sale.underOffer}
              description={t('stats.saleUnderOfferDescription')}
              icon={<ShoppingCart className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="amber"
              loading={loading}
            />

            <StatCard
              title={t('stats.saleSold')}
              value={stats.sale.sold}
              description={t('stats.saleSoldDescription')}
              icon={<DollarSign className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="emerald"
              loading={loading}
            />

            <StatCard
              title={t('stats.saleInquiries')}
              value={stats.saleInquiries}
              description={t('stats.saleInquiriesDescription')}
              icon={<Search className={`h-5 w-5 ${COLORS.text.white}`} />}
              iconColor="gold"
              loading={loading}
            />
          </div>
        </div>

        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-gray-200/50 backdrop-blur-sm bg-white/90 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-slate-900">
              {t('propertiesSummary.title')}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t('propertiesSummary.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Rental Properties Section */}
              <div>
                <h4 className={`text-sm font-semibold ${COLORS.gray.text700} mb-3 flex items-center gap-2`}>
                  <Home className="h-4 w-4 text-blue-600" />
                  {t('propertiesSummary.rentalPropertiesTitle')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" />
                      {t('propertiesSummary.rentalEmpty')}
                    </span>
                    <Badge className={`${COLORS.status.empty.gradient} ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.rental.empty}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <Home className="h-4 w-4 text-emerald-600" />
                      {t('propertiesSummary.rentalOccupied')}
                    </span>
                    <Badge className={`${COLORS.status.occupied.gradient} ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.rental.occupied}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      {t('propertiesSummary.rentalInactive')}
                    </span>
                    <Badge className={`${COLORS.status.inactive.gradient} ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.rental.inactive}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Sale Properties Section */}
              <div>
                <h4 className={`text-sm font-semibold ${COLORS.gray.text700} mb-3 flex items-center gap-2`}>
                  <Building2 className="h-4 w-4 text-amber-600" />
                  {t('propertiesSummary.salePropertiesTitle')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      {t('propertiesSummary.saleAvailable')}
                    </span>
                    <Badge className={`${COLORS.status.occupied.gradient} ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.sale.available}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-amber-600" />
                      {t('propertiesSummary.saleUnderOffer')}
                    </span>
                    <Badge className={`${COLORS.status.empty.gradient} ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.sale.underOffer}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {t('propertiesSummary.saleSold')}
                    </span>
                    <Badge className={`bg-gradient-to-r from-green-500 to-emerald-600 ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.sale.sold}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200/50 transition-all hover:shadow-md">
                    <span className="text-slate-800 font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      {t('propertiesSummary.saleInactive')}
                    </span>
                    <Badge className={`${COLORS.status.inactive.gradient} ${COLORS.text.white} shadow-md px-3 py-1`}>
                      {loading ? '-' : stats.sale.inactive}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
