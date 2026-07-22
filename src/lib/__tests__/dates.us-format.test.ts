import { describe, expect, it } from 'vitest';
import {
  formatDateDisplayUS,
  formatDateForDb,
  parseDateInputValue,
} from '../dates';

describe('dates US-locale regression', () => {
  describe('formatDateDisplayUS', () => {
    it('formats an ISO date as MM/dd/yyyy, not a EU day-first format', () => {
      expect(formatDateDisplayUS('2026-07-20')).toBe('07/20/2026');
      expect(formatDateDisplayUS('2026-07-20')).not.toBe('20.07.2026');
      expect(formatDateDisplayUS('2026-07-20')).not.toBe('20/07/2026');
    });

    it('returns empty string for null/undefined input', () => {
      expect(formatDateDisplayUS(null)).toBe('');
      expect(formatDateDisplayUS(undefined)).toBe('');
    });

    it('returns empty string for an invalid date string instead of throwing', () => {
      expect(formatDateDisplayUS('not-a-date')).toBe('');
      expect(formatDateDisplayUS('')).toBe('');
    });
  });

  describe('parseDateInputValue', () => {
    it('parses a YYYY-MM-DD value into a local Date at start of day', () => {
      const parsed = parseDateInputValue('2026-07-20');
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(6);
      expect(parsed?.getDate()).toBe(20);
      expect(parsed?.getHours()).toBe(0);
    });

    it('returns undefined for null/undefined/invalid input', () => {
      expect(parseDateInputValue(null)).toBeUndefined();
      expect(parseDateInputValue(undefined)).toBeUndefined();
      expect(parseDateInputValue('not-a-date')).toBeUndefined();
    });
  });

  describe('formatDateForDb round trip', () => {
    it('preserves the local calendar day for a Date at local noon', () => {
      const localNoon = new Date(2026, 6, 20, 12, 0, 0);

      const dbValue = formatDateForDb(localNoon);
      expect(dbValue).toBe('2026-07-20');

      const reParsed = parseDateInputValue(dbValue);
      expect(reParsed?.getFullYear()).toBe(localNoon.getFullYear());
      expect(reParsed?.getMonth()).toBe(localNoon.getMonth());
      expect(reParsed?.getDate()).toBe(localNoon.getDate());
    });

    it('is stable across a full year of local-noon dates (no off-by-one drift)', () => {
      for (let month = 0; month < 12; month += 1) {
        const localNoon = new Date(2026, month, 15, 12, 0, 0);
        const dbValue = formatDateForDb(localNoon);
        const reParsed = parseDateInputValue(dbValue);
        expect(reParsed?.getMonth()).toBe(month);
        expect(reParsed?.getDate()).toBe(15);
      }
    });
  });
});
