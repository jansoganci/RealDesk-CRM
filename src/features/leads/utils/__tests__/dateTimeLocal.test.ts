import { describe, expect, it } from 'vitest';
import {
  formatDateTimeLocalValue,
  parseDateTimeLocalValue,
} from '../dateTimeLocal';

describe('dateTimeLocal helpers', () => {
  it('formats a date using local calendar and clock values', () => {
    const localDate = new Date(2026, 6, 21, 14, 30);

    expect(formatDateTimeLocalValue(localDate)).toBe('2026-07-21T14:30');
  });

  it('returns an empty value for missing or invalid dates', () => {
    expect(formatDateTimeLocalValue(undefined)).toBe('');
    expect(formatDateTimeLocalValue(new Date(Number.NaN))).toBe('');
  });

  it('parses a datetime-local value in the local timezone', () => {
    const parsedDate = parseDateTimeLocalValue('2026-07-21T14:30');

    expect(parsedDate?.getFullYear()).toBe(2026);
    expect(parsedDate?.getMonth()).toBe(6);
    expect(parsedDate?.getDate()).toBe(21);
    expect(parsedDate?.getHours()).toBe(14);
    expect(parsedDate?.getMinutes()).toBe(30);
  });

  it('returns undefined while the input is empty or invalid', () => {
    expect(parseDateTimeLocalValue('')).toBeUndefined();
    expect(parseDateTimeLocalValue('not-a-date')).toBeUndefined();
  });
});
