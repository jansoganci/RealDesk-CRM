// =====================================================
// useCurrencyConversion Hook
// Provides currency conversion functions using user's display currency preference
// =====================================================

import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  formatCurrencyWithConversion,
  getRateInfo,
} from '../lib/currency';
import type { RateInfo } from '../services/finance/exchangeRates.service';

interface ConversionResult {
  convertedAmount: number;
  rateInfo: RateInfo;
}

interface FormatResult {
  original: string;
  converted: string;
  rateInfo: RateInfo;
}

/**
 * Hook that provides currency conversion functions using user's display currency preference
 * Memoizes conversions for performance
 */
export function useCurrencyConversion() {
  const { currency: displayCurrency } = useAuth();
  const normalizedDisplayCurrency = displayCurrency?.toUpperCase().trim() || 'TRY';

  /**
   * Convert amount using historical rate
   */
  const convert = useCallback(
    async (
      amount: number,
      originalCurrency: string,
      transactionDate: string | Date
    ): Promise<ConversionResult> => {
      const normalizedOriginal = originalCurrency?.toUpperCase().trim() || 'TRY';

      // If same currency, return as-is
      if (normalizedOriginal === normalizedDisplayCurrency) {
        const dateStr = typeof transactionDate === 'string'
          ? transactionDate.split('T')[0]
          : transactionDate.toISOString().split('T')[0];
        return {
          convertedAmount: amount,
          rateInfo: {
            rate: 1.0,
            rate_date_used: dateStr,
          },
        };
      }

      const rateInfo = await getRateInfo(
        normalizedOriginal,
        normalizedDisplayCurrency,
        transactionDate
      );

      return {
        convertedAmount: amount * rateInfo.rate,
        rateInfo,
      };
    },
    [normalizedDisplayCurrency]
  );

  /**
   * Format currency with dual display (original + converted)
   */
  const formatWithConversion = useCallback(
    async (
      amount: number,
      originalCurrency: string,
      transactionDate: string | Date
    ): Promise<FormatResult> => {
      return formatCurrencyWithConversion(
        amount,
        originalCurrency,
        normalizedDisplayCurrency,
        transactionDate
      );
    },
    [normalizedDisplayCurrency]
  );

  /**
   * Get rate info for tooltips
   */
  const getRate = useCallback(
    async (
      originalCurrency: string,
      transactionDate: string | Date
    ): Promise<RateInfo> => {
      const normalizedOriginal = originalCurrency?.toUpperCase().trim() || 'TRY';
      return getRateInfo(normalizedOriginal, normalizedDisplayCurrency, transactionDate);
    },
    [normalizedDisplayCurrency]
  );

  return {
    displayCurrency: normalizedDisplayCurrency,
    convert,
    formatWithConversion,
    getRate,
  };
}

