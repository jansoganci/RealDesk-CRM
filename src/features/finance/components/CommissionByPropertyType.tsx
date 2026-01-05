import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../lib/currency';
import type { CommissionByPropertyType } from '../../../services/finance/analytics.service';

interface CommissionByPropertyTypeProps {
  data: CommissionByPropertyType | null;
  loading?: boolean;
}

export const CommissionByPropertyTypeComponent = ({
  data,
  loading = false,
}: CommissionByPropertyTypeProps) => {
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
              {t('finance:analytics.commissionByPropertyType')}
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Building2 className="h-4 w-4 text-white" />
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

  const rentalPercentage = data.total.value > 0 
    ? (data.rental.value / data.total.value) * 100 
    : 0;
  const salePercentage = data.total.value > 0 
    ? (data.sale.value / data.total.value) * 100 
    : 0;

  const chartData = [
    {
      name: t('finance:analytics.rentalCommissions'),
      value: data.rental.value,
      percentage: rentalPercentage,
      color: '#3b82f6', // blue
    },
    {
      name: t('finance:analytics.saleCommissions'),
      value: data.sale.value,
      percentage: salePercentage,
      color: '#10b981', // green
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

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {t('finance:analytics.commissionByPropertyType')}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">
                {t('finance:analytics.rentalCommissions')}
              </p>
              <p className="text-xl font-bold text-blue-900">
                {formatMetric(data.rental.value)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {rentalPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">
                {t('finance:analytics.saleCommissions')}
              </p>
              <p className="text-xl font-bold text-green-900">
                {formatMetric(data.sale.value)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {salePercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => {
                    const item = chartData.find(d => d.name === value);
                    return item ? `${value} (${item.percentage.toFixed(1)}%)` : value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

