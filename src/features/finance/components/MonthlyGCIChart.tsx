import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import type { MonthlyCommissionData } from '@/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

interface MonthlyGCIChartProps {
  data: MonthlyCommissionData[];
}

export const MonthlyGCIChart = ({ data }: MonthlyGCIChartProps) => {
  const { t } = useTranslation('finance');
  const chartColors = useChartColors();

  const chartData = data.map((m) => ({
    month: m.monthName.slice(0, 3),
    gci: m.total,
    net: m.total * 0.7,
  }));

  return (
    <Card className="border border-border dark:border-border bg-card dark:bg-muted">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-foreground">{t('commissionDashboard.monthlyChart.title')}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="gci" fill={chartColors.info} name={t('commissionDashboard.monthlyChart.gci')} />
            <Bar dataKey="net" fill={chartColors.primary} name={t('commissionDashboard.monthlyChart.net')} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
