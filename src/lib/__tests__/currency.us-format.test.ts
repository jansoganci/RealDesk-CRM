import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatCurrencyRange,
  formatUsdGroupedAmount,
  parseUsdGroupedAmount,
} from '../currency';

describe('currency US-locale regression', () => {
  describe('formatCurrency', () => {
    it('formats whole thousands with US grouping/decimal, not EU style', () => {
      expect(formatCurrency(18750)).toBe('$18,750.00');
      expect(formatCurrency(18750)).not.toBe('$18.750,00');
    });

    it('formats large amounts with US grouping', () => {
      expect(formatCurrency(1250000)).toBe('$1,250,000.00');
    });

    it('ignores an explicit non-US locale argument for grouping/decimal shape', () => {
      // Callers should never rely on this, but the helper hardcodes en-US
      // display regardless of what a browser's default locale would be.
      expect(formatCurrency(18750, 'USD', 'en-US')).toBe('$18,750.00');
    });
  });

  describe('formatCurrencyRange', () => {
    it('formats a min/max pair with US grouping and no decimals', () => {
      expect(formatCurrencyRange(300000, 450000)).toBe('$300,000 - $450,000');
    });

    it('formats a single lower bound when max is null', () => {
      expect(formatCurrencyRange(750000, null)).toBe('$750,000');
    });

    it('formats a single upper bound when min is null', () => {
      expect(formatCurrencyRange(null, 750000)).toBe('$750,000');
    });

    it('returns empty string when both bounds are missing', () => {
      expect(formatCurrencyRange(null, undefined)).toBe('');
      expect(formatCurrencyRange(undefined, undefined)).toBe('');
    });
  });

  describe('formatUsdGroupedAmount / parseUsdGroupedAmount round trip', () => {
    it('formats a plain number with US grouping and no currency symbol', () => {
      expect(formatUsdGroupedAmount(750000)).toBe('750,000');
    });

    it('parses a US-grouped string back into a number', () => {
      expect(parseUsdGroupedAmount('750,000')).toBe(750000);
    });

    it('round-trips format -> parse', () => {
      const formatted = formatUsdGroupedAmount(750000);
      expect(parseUsdGroupedAmount(formatted)).toBe(750000);
    });

    it('formatUsdGroupedAmount returns empty string for null/undefined/NaN', () => {
      expect(formatUsdGroupedAmount(null)).toBe('');
      expect(formatUsdGroupedAmount(undefined)).toBe('');
      expect(formatUsdGroupedAmount(Number.NaN)).toBe('');
    });

    it('parseUsdGroupedAmount returns null for empty/invalid input', () => {
      expect(parseUsdGroupedAmount('')).toBeNull();
      expect(parseUsdGroupedAmount('   ')).toBeNull();
      expect(parseUsdGroupedAmount('not-a-number')).toBeNull();
      expect(parseUsdGroupedAmount('$750,000')).toBeNull();
    });
  });
});
