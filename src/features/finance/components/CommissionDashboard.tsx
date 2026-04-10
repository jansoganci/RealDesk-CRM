import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { YTDStatsRow } from './YTDStatsRow';
import { SalesVsRentalCard } from './SalesVsRentalCard';
import { MonthlyGCIChart } from './MonthlyGCIChart';
import { CommissionHistoryTable } from './CommissionHistoryTable';
import { useYTDDashboard } from '../hooks/useYTDDashboard';

export const CommissionDashboard = () => {
  const { t } = useTranslation('finance');
  const { load, loading, summary, monthly, capProgress } = useYTDDashboard();

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('commissionDashboard.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <YTDStatsRow summary={summary} capProgress={capProgress} />
      <SalesVsRentalCard summary={summary} />
      <MonthlyGCIChart data={monthly} />
      <CommissionHistoryTable />
    </div>
  );
};
