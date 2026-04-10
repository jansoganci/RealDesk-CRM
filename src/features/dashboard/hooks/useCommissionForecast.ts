import { useCallback, useEffect, useState } from 'react';
import { commissionsService } from '@/lib/serviceProxy';
import type { ForecastResult } from '@/types';

export function useCommissionForecast() {
  const [data, setData] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await commissionsService.getForecast();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
