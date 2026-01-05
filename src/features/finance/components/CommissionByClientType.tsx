import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import type { CommissionByClientType } from '../../../services/finance/analytics.service';

interface CommissionByClientTypeProps {
  data: CommissionByClientType | null;
  loading?: boolean;
}

export const CommissionByClientTypeComponent = ({
  data,
  loading = false,
}: CommissionByClientTypeProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { currency } = useAuth();

  const formatMetric = (value: number) => {
    return formatCurrency(value, currency || 'TRY');
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total.value === 0) {
    return (
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('finance:analytics.commissionByClientType')}
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
              <Users className="h-4 w-4 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            {t('finance:commissionTrends.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ownerPercentage = data.total.value > 0 
    ? (data.owner.value / data.total.value) * 100 
    : 0;
  const tenantPercentage = data.total.value > 0 
    ? (data.tenant.value / data.total.value) * 100 
    : 0;
  const buyerPercentage = data.total.value > 0 
    ? (data.buyer.value / data.total.value) * 100 
    : 0;

  const chartData = [
    {
      name: t('finance:analytics.ownerCommissions'),
      value: data.owner.value,
      percentage: ownerPercentage,
      color: '#3b82f6', // blue
    },
    {
      name: t('finance:analytics.tenantCommissions'),
      value: data.tenant.value,
      percentage: tenantPercentage,
      color: '#10b981', // green
    },
    {
      name: t('finance:analytics.buyerCommissions'),
      value: data.buyer.value,
      percentage: buyerPercentage,
      color: '#f59e0b', // amber
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatMetric(data.value)}
          </p>
          <p className="text-xs text-gray-500">
            {data.payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {t('finance:analytics.commissionByClientType')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
            <Users className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">
                {t('finance:analytics.ownerCommissions')}
              </p>
              <p className="text-lg font-bold text-blue-900">
                {formatMetric(data.owner.value)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {ownerPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">
                {t('finance:analytics.tenantCommissions')}
              </p>
              <p className="text-lg font-bold text-green-900">
                {formatMetric(data.tenant.value)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {tenantPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 font-medium mb-1">
                {t('finance:analytics.buyerCommissions')}
              </p>
              <p className="text-lg font-bold text-amber-900">
                {formatMetric(data.buyer.value)}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {buyerPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

