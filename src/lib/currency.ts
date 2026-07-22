/**
 * US-default currency formatting (no client-side FX fetch or conversion tables).
 */

/**
 * Format a numeric amount for display using Intl.
 * @param amount - Numeric value
 * @param currency - ISO 4217 code (default USD)
 * @param locale - BCP 47 locale (default en-US)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  const normalizedCurrency = currency?.toUpperCase().trim();
  if (!normalizedCurrency || normalizedCurrency === 'MIXED') {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
  }).format(amount);
}

/**
 * Format a min/max amount pair (e.g. a budget or price) as a single string.
 * Always en-US grouping, 0 fraction digits — e.g. "$300,000 - $450,000".
 * Falls back to a single formatted value when only one bound is provided.
 */
export function formatCurrencyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  const normalizedCurrency = currency?.toUpperCase().trim() || 'USD';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
  if (min) return formatter.format(min);
  if (max) return formatter.format(max);
  return '';
}

/**
 * Format a number for US money inputs (grouped, no currency symbol).
 * Example: 750000 → "750,000"
 */
export function formatUsdGroupedAmount(
  amount: number | null | undefined,
  maximumFractionDigits = 2
): string {
  if (amount == null || Number.isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Parse a US-grouped money string into a number.
 * Accepts "750,000", "750000", "15,000.50". Returns null if empty/invalid.
 */
export function parseUsdGroupedAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/**
 * Symbol for money inputs (US app defaults to $).
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const code = currency?.toUpperCase().trim() || 'USD';
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? '$';
  } catch {
    return code === 'USD' ? '$' : code;
  }
}

/**
 * US-market app: no live conversion in the client. Same currency returns amount;
 * different codes return the input unchanged (callers should prefer single-currency USD flows).
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  const fromUpper = (from || 'USD').toUpperCase();
  const toUpper = (to || 'USD').toUpperCase();
  if (fromUpper === toUpper) {
    return amount;
  }
  return amount;
}
