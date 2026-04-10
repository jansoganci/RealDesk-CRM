import { useCallback, useState } from 'react';
import { commissionsService } from '@/lib/serviceProxy';
import type { CapProgress, MonthlyCommissionData, YTDSummary } from '@/types';

export const useYTDDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<YTDSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyCommissionData[]>([]);
  const [capProgress, setCapProgress] = useState<CapProgress | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [summaryData, monthlyData, capData] = await Promise.all([
        commissionsService.getYTDSummary(),
        commissionsService.getMonthlyCommissionData(year),
        commissionsService.getCapProgress(),
      ]);
      setSummary(summaryData);
      setMonthly(monthlyData);
      setCapProgress(capData);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    summary,
    monthly,
    capProgress,
    load,
  };
};
