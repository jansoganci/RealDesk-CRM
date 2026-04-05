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
