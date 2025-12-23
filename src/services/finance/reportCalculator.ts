import { Commission } from '../../types';
import { FinancialTransaction, CategoryBreakdown } from '../../types/financial';
import { getRateFromTry, getRatesForBatchFromTry, RateInfo } from './exchangeRates.service';

/**
 * Result of a normalized calculation
 */
export interface CalculatedMetric {
  value: number;
  isComplete: boolean;
  missingDates: string[];
}

/**
 * Normalized Performance Summary
 */
export interface NormalizedPerformanceSummary {
  year: number;
  dealsCount: number;
  totalCommission: CalculatedMetric;
  averagePerDeal: CalculatedMetric;
  bestMonth: {
    month: number;
    monthName: string;
    amount: CalculatedMetric;
  } | null;
  rentalPercentage: number; // Percentage is derived from converted amounts
  salePercentage: number;   // Percentage is derived from converted amounts
  currency: string;
}

/**
 * Normalized Category Breakdown
 */
export interface NormalizedCategoryBreakdown extends Omit<CategoryBreakdown, 'total_amount' | 'percentage'> {
  total_amount: CalculatedMetric;
  percentage: number;
}

/**
 * Base interface for objects that have amount, currency, and date
 */
interface CurrencyAware {
  amount: number;
  currency: string;
  created_at?: string;
  transaction_date?: string;
  date?: string;
}

/**
 * Normalizes a batch of items to a target currency using historical rates.
 * Standardized to TRY-Anchor: (Amount / Rate_Source) * Rate_Target
 */
export async function normalizeBatch(
  items: CurrencyAware[],
  toCurrency: string
): Promise<{ value: number; isComplete: boolean; missingDates: string[] }[]> {
  const to = toCurrency.toUpperCase().trim();
  
  // Prepare all unique rate requests (all relative to TRY anchor)
  const rateRequests: Array<{ currency: string; date: string }> = [];
  items.forEach(item => {
    const date = (item.transaction_date || item.created_at || item.date || new Date().toISOString()).split('T')[0];
    const from = item.currency.toUpperCase().trim();
    
    if (from !== 'TRY') {
      rateRequests.push({ currency: from, date });
    }
    if (to !== 'TRY') {
      rateRequests.push({ currency: to, date });
    }
  });

  const rateLookup = await getRatesForBatchFromTry(rateRequests);

  return Promise.all(items.map(async (item) => {
    const from = item.currency.toUpperCase().trim();
    const date = (item.transaction_date || item.created_at || item.date || new Date().toISOString()).split('T')[0];
    
    if (from === to) {
      return { value: item.amount, isComplete: true, missingDates: [] };
    }

    // Get rates from TRY anchor
    const getRate = async (currency: string): Promise<RateInfo> => {
      if (currency === 'TRY') return { rate: 1.0, rate_date_used: date };
      
      const key = `${currency}-${date}`;
      const cached = rateLookup[key];
      if (cached) return cached;
      
      // Fallback to single fetch
      return await getRateFromTry(currency, date);
    };

    const [rSource, rTarget] = await Promise.all([getRate(from), getRate(to)]);
    
    // Financial Completeness Check
    const sourceComplete = from === 'TRY' || rSource.rate_date_used === date;
    const targetComplete = to === 'TRY' || rTarget.rate_date_used === date;
    const isComplete = sourceComplete && targetComplete;

    // Canonical Formula: (Amount / rSource) * rTarget
    const value = (item.amount / rSource.rate) * rTarget.rate;

    return {
      value,
      isComplete,
      missingDates: isComplete ? [] : [date]
    };
  }));
}

/**
 * Normalizes a batch of transactions and calculates their sum
 */
export async function calculateNormalizedSum(
  items: CurrencyAware[],
  displayCurrency: string
): Promise<CalculatedMetric> {
  if (items.length === 0) {
    return { value: 0, isComplete: true, missingDates: [] };
  }

  const normalizedItems = await normalizeBatch(items, displayCurrency);
  
  let total = 0;
  let isComplete = true;
  const missingDatesSet = new Set<string>();

  normalizedItems.forEach(res => {
    total += res.value;
    if (!res.isComplete) {
      isComplete = false;
      res.missingDates.forEach(d => missingDatesSet.add(d));
    }
  });

  return {
    value: total,
    isComplete,
    missingDates: Array.from(missingDatesSet)
  };
}

/**
 * Calculates a fully normalized Performance Summary
 */
export async function calculatePerformanceSummary(
  commissions: Commission[],
  year: number,
  displayCurrency: string
): Promise<NormalizedPerformanceSummary> {
  const dealsCount = commissions.length;
  
  const totalCommissionMetric = await calculateNormalizedSum(commissions, displayCurrency);
  
  const rentalCommissions = commissions.filter(c => c.type === 'rental');
  const saleCommissions = commissions.filter(c => c.type === 'sale');
  
  const rentalMetric = await calculateNormalizedSum(rentalCommissions, displayCurrency);
  const saleMetric = await calculateNormalizedSum(saleCommissions, displayCurrency);
  
  const totalVal = totalCommissionMetric.value;
  const rentalPercentage = totalVal > 0 ? (rentalMetric.value / totalVal) * 100 : 0;
  const salePercentage = totalVal > 0 ? (saleMetric.value / totalVal) * 100 : 0;

  // Best month calculation
  const monthlyData: Record<number, Commission[]> = {};
  commissions.forEach(c => {
    const month = new Date(c.created_at).getMonth() + 1;
    if (!monthlyData[month]) monthlyData[month] = [];
    monthlyData[month].push(c);
  });

  let bestMonth: NormalizedPerformanceSummary['bestMonth'] = null;
  const MONTH_NAMES_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  for (const [monthStr, monthCommissions] of Object.entries(monthlyData)) {
    const month = parseInt(monthStr);
    const metric = await calculateNormalizedSum(monthCommissions, displayCurrency);
    if (!bestMonth || metric.value > bestMonth.amount.value) {
      bestMonth = {
        month,
        monthName: MONTH_NAMES_TR[month - 1],
        amount: metric
      };
    }
  }

  return {
    year,
    dealsCount,
    totalCommission: totalCommissionMetric,
    averagePerDeal: {
      value: dealsCount > 0 ? totalVal / dealsCount : 0,
      isComplete: totalCommissionMetric.isComplete,
      missingDates: totalCommissionMetric.missingDates
    },
    bestMonth,
    rentalPercentage,
    salePercentage,
    currency: displayCurrency
  };
}

/**
 * Calculates a fully normalized Category Breakdown
 */
export async function calculateCategoryBreakdown(
  transactions: FinancialTransaction[],
  displayCurrency: string,
  type: 'income' | 'expense'
): Promise<NormalizedCategoryBreakdown[]> {
  const filteredTransactions = transactions.filter(t => t.type === type);
  const categoryGroups: Record<string, FinancialTransaction[]> = {};
  
  filteredTransactions.forEach(t => {
    if (!categoryGroups[t.category]) categoryGroups[t.category] = [];
    categoryGroups[t.category].push(t);
  });

  const overallMetric = await calculateNormalizedSum(filteredTransactions, displayCurrency);
  const overallTotal = overallMetric.value;

  const breakdownPromises = Object.entries(categoryGroups).map(async ([category, items]) => {
    const categoryMetric = await calculateNormalizedSum(items, displayCurrency);
    
    return {
      category,
      type,
      total_amount: categoryMetric,
      transaction_count: items.length,
      percentage: overallTotal > 0 ? (categoryMetric.value / overallTotal) * 100 : 0,
      icon: null, // Icons/Colors should be handled by the caller or a separate lookup
      color: null
    };
  });

  const breakdown = await Promise.all(breakdownPromises);
  return breakdown.sort((a, b) => b.total_amount.value - a.total_amount.value);
}

