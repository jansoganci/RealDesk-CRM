import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  refreshExchangeRates,
  getCurrentExchangeRates,
  getExchangeRatesTimestamp,
  initializeExchangeRates,
} from '../../../lib/currency';

/**
 * Exchange Rates Hook
 * Handles loading, refreshing, and displaying exchange rates with timestamp formatting
 */

interface UseExchangeRatesReturn {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  handleRefreshRates: () => Promise<void>;
  formatLastUpdated: (timestamp: number | null) => string;
}

/**
 * Hook for managing exchange rates
 * Handles loading, refreshing, and timestamp formatting for exchange rates
 */
export function useExchangeRates(): UseExchangeRatesReturn {
  const { t } = useTranslation('profile');
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const loadExchangeRates = useCallback(async () => {
    await initializeExchangeRates();
    setExchangeRates(getCurrentExchangeRates());
    setLastUpdated(getExchangeRatesTimestamp());
  }, []);

  const handleRefreshRates = useCallback(async () => {
    setRefreshingRates(true);
    try {
      await refreshExchangeRates();
      setExchangeRates(getCurrentExchangeRates());
      setLastUpdated(getExchangeRatesTimestamp());
      toast.success(t('profile:exchangeRates.refreshSuccess'));
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      toast.error(t('profile:exchangeRates.refreshError'));
    } finally {
      setRefreshingRates(false);
    }
  }, [t]);

  const formatLastUpdated = useCallback(
    (timestamp: number | null): string => {
      if (!timestamp) return t('profile:exchangeRates.justNow');

      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return t('profile:exchangeRates.justNow');
      if (minutes < 60) return t('profile:exchangeRates.minutesAgo', { minutes });
      if (hours < 24) return t('profile:exchangeRates.hoursAgo', { hours });
      return t('profile:exchangeRates.daysAgo', { days });
    },
    [t]
  );

  // Load exchange rates on mount
  useEffect(() => {
    loadExchangeRates();
  }, [loadExchangeRates]);

  return {
    exchangeRates,
    lastUpdated,
    refreshingRates,
    handleRefreshRates,
    formatLastUpdated,
  };
}

