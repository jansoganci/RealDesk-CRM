import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/** Static display snapshot (USD-default app; no client FX API). */
const DISPLAY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  TRY: 34.5,
};

interface UseExchangeRatesReturn {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  refreshRates: () => Promise<void>;
  formatLastUpdated: (timestamp: number | null) => string;
}

export function useExchangeRates(): UseExchangeRatesReturn {
  const { t } = useTranslation('dashboard');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshingRates, setRefreshingRates] = useState(false);

  const loadExchangeRates = useCallback(async () => {
    setExchangeRates({ ...DISPLAY_RATES });
    setLastUpdated(Date.now());
  }, []);

  const refreshRates = useCallback(async () => {
    setRefreshingRates(true);
    try {
      setExchangeRates({ ...DISPLAY_RATES });
      setLastUpdated(Date.now());
      toast.success(t('exchangeRates.refreshSuccess'));
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      toast.error(t('exchangeRates.refreshError'));
    } finally {
      setRefreshingRates(false);
    }
  }, [t]);

  const formatLastUpdated = useCallback(
    (timestamp: number | null): string => {
      if (!timestamp) return t('exchangeRates.justNow');

      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return t('exchangeRates.justNow');
      if (minutes < 60) return t('exchangeRates.minutesAgo', { minutes });
      if (hours < 24) return t('exchangeRates.hoursAgo', { hours });
      return t('exchangeRates.daysAgo', { days });
    },
    [t]
  );

  useEffect(() => {
    void loadExchangeRates();
  }, [loadExchangeRates]);

  return {
    exchangeRates,
    lastUpdated,
    refreshingRates,
    refreshRates,
    formatLastUpdated,
  };
}
