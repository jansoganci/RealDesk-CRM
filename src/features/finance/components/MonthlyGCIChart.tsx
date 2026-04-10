import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import type { MonthlyCommissionData } from '@/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COLORS } from '@/config/colors';

interface MonthlyGCIChartProps {
  data: MonthlyCommissionData[];
}

export const MonthlyGCIChart = ({ data }: MonthlyGCIChartProps) => {
  const { t } = useTranslation('finance');
  const gciBarColor = COLORS.info.hex;
  const netBarColor = COLORS.primary.hex;

  const chartData = data.map((m) => ({
    month: m.monthName.slice(0, 3),
    gci: m.total,
    net: m.total * 0.7,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('commissionDashboard.monthlyChart.title')}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="gci" fill={gciBarColor} name={t('commissionDashboard.monthlyChart.gci')} />
            <Bar dataKey="net" fill={netBarColor} name={t('commissionDashboard.monthlyChart.net')} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
