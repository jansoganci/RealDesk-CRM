// V1: USD-only. Currency conversion disabled.
// This hook is preserved for V1.5 multi-currency support.

import { useCallback, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';

export interface RateInfo {
  rate: number;
  rate_date_used: string;
  source?: string;
}

interface ConversionResult {
  convertedAmount: number;
  rateInfo: RateInfo;
}

interface FormatResult {
  original: string;
  converted: string;
  rateInfo: RateInfo;
}

const V1_DISPLAY = 'USD';

function toDateStr(transactionDate: string | Date): string {
  return typeof transactionDate === 'string'
    ? transactionDate.split('T')[0]
    : transactionDate.toISOString().split('T')[0];
}

/**
 * Hook that provides currency conversion functions using user's display currency preference
 * Memoizes conversions for performance
 */
export function useCurrencyConversion() {
  const normalizedDisplayCurrency = useMemo(() => V1_DISPLAY, []);

  const convert = useCallback(
    async (
      amount: number,
      _originalCurrency: string,
      transactionDate: string | Date
    ): Promise<ConversionResult> => {
      const dateStr = toDateStr(transactionDate);
      return {
        convertedAmount: amount,
        rateInfo: {
          rate: 1.0,
          rate_date_used: dateStr,
        },
      };
    },
    []
  );

  const formatWithConversion = useCallback(
    async (
      amount: number,
      originalCurrency: string,
      transactionDate: string | Date
    ): Promise<FormatResult> => {
      const dateStr = toDateStr(transactionDate);
      const rateInfo: RateInfo = { rate: 1.0, rate_date_used: dateStr };
      const original = formatCurrency(amount, originalCurrency || V1_DISPLAY);
      const converted = formatCurrency(amount, normalizedDisplayCurrency);
      return { original, converted, rateInfo };
    },
    [normalizedDisplayCurrency]
  );

  const getRate = useCallback(
    async (_originalCurrency: string, transactionDate: string | Date): Promise<RateInfo> => {
      return {
        rate: 1.0,
        rate_date_used: toDateStr(transactionDate),
      };
    },
    []
  );

  return useMemo(
    () => ({
      displayCurrency: normalizedDisplayCurrency,
      convert,
      formatWithConversion,
      getRate,
    }),
    [normalizedDisplayCurrency, convert, formatWithConversion, getRate]
  );
}
