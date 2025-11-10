import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  DollarSign,
  TrendingUp,
  Home,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';
import { commissionsService } from '../../lib/serviceProxy';
import { Commission, CommissionStats } from '../../types';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/currency';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export const Finance = () => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();
  const [stats, setStats] = useState<CommissionStats>({
    totalEarnings: 0,
    rentalCommissions: 0,
    saleCommissions: 0,
    currency: currency || 'USD',
  });
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currency]);

  useEffect(() => {
    filterCommissions();
  }, [typeFilter, commissions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, commissionsData] = await Promise.all([
        commissionsService.getStats(currency || 'USD'),
        commissionsService.getAll(),
      ]);

      setStats(statsData);
      setCommissions(commissionsData);
    } catch (error) {
      console.error('Failed to load finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const filterCommissions = () => {
    let filtered = [...commissions];

    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    setFilteredCommissions(filtered);
  };

  const getCommissionBadge = (type: string) => {
    if (type === 'rental') {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-md">
          {t('finance:commissionHistory.rental')}
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md">
        {t('finance:commissionHistory.sale')}
      </Badge>
    );
  };

  return (
    <MainLayout title={t('finance:title')}>
      <PageContainer>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t('finance:title')}</h2>
          <p className="text-slate-600 mt-1">{t('finance:subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          <StatCard
            title={t('finance:stats.totalEarnings')}
            value={formatCurrency(stats.totalEarnings, currency || 'USD')}
            description={t('finance:stats.totalEarningsDescription')}
            icon={<DollarSign className="h-5 w-5 text-white" />}
            iconColor="gold"
            loading={loading}
          />

          <StatCard
            title={t('finance:stats.rentalCommissions')}
            value={formatCurrency(stats.rentalCommissions, currency || 'USD')}
            description={t('finance:stats.rentalCommissionsDescription')}
            icon={<Home className="h-5 w-5 text-white" />}
            iconColor="emerald"
            loading={loading}
          />

          <StatCard
            title={t('finance:stats.saleCommissions')}
            value={formatCurrency(stats.saleCommissions, currency || 'USD')}
            description={t('finance:stats.saleCommissionsDescription')}
            icon={<Building2 className="h-5 w-5 text-white" />}
            iconColor="navy"
            loading={loading}
          />
        </div>

        {/* Commission List */}
        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-gray-200/50 backdrop-blur-sm bg-white/95 animate-fade-in">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-slate-900 font-bold">{t('finance:commissionHistory.title')}</CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  {t('finance:commissionHistory.description', {
                    count: filteredCommissions.length,
                    s: filteredCommissions.length !== 1 ? 's' : ''
                  })}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('finance:commissionHistory.filterByType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('finance:commissionHistory.allTypes')}</SelectItem>
                    <SelectItem value="rental">{t('finance:commissionHistory.rentals')}</SelectItem>
                    <SelectItem value="sale">{t('finance:commissionHistory.sales')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                <p className="text-sm text-slate-500">{t('finance:commissionHistory.loading')}</p>
              </div>
            ) : filteredCommissions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('finance:commissionHistory.noCommissionsYet')}</h3>
                <p className="text-slate-600">
                  {t('finance:commissionHistory.noCommissionsDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCommissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          commission.type === 'rental'
                            ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700'
                            : 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700'
                        } shadow-md`}>
                          {commission.type === 'rental' ? (
                            <Home className="h-4 w-4 text-white" />
                          ) : (
                            <Building2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{commission.property_address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getCommissionBadge(commission.type)}
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(commission.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {commission.notes && (
                        <p className="text-sm text-slate-600 ml-11">{commission.notes}</p>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-0 sm:ml-4">
                      <div className={`text-right px-4 py-2 rounded-lg ${
                        commission.type === 'rental'
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50'
                          : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50'
                      }`}>
                        <p className="text-xs text-slate-600 font-medium">{t('finance:commissionHistory.commission')}</p>
                        <p className={`text-2xl font-bold ${
                          commission.type === 'rental' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {formatCurrency(commission.amount, commission.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Info Card */}
        <Card className="shadow-luxury border-blue-200/50 bg-gradient-to-br from-blue-50 to-slate-50 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
              {t('finance:commissionStructure.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md flex-shrink-0">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('finance:commissionStructure.rentalTitle')}</p>
                <p className="text-sm text-slate-600">
                  {t('finance:commissionStructure.rentalDescription', {
                    amount: t('finance:commissionStructure.rentalAmount')
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('finance:commissionStructure.saleTitle')}</p>
                <p className="text-sm text-slate-600">
                  {t('finance:commissionStructure.saleDescription', {
                    amount: t('finance:commissionStructure.saleAmount')
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};
