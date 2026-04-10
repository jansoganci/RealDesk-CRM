import { addDays, format, startOfDay } from 'date-fns';

/**
 * US federal holidays (observed): weekend rules — Sat → prior Friday, Sun → following Monday.
 * Used for CFPB “business day” (consumer mortgage rescission / CD delivery).
 */

function observeFederalHoliday(d: Date): Date {
  const day = d.getDay();
  if (day === 6) return addDays(d, -1);
  if (day === 0) return addDays(d, 1);
  return d;
}

function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, nth: number): Date {
  const first = new Date(year, monthIndex, 1);
  const firstDow = first.getDay();
  const daysToFirst = (weekday - firstDow + 7) % 7;
  const dayOfMonth = 1 + daysToFirst + (nth - 1) * 7;
  return startOfDay(new Date(year, monthIndex, dayOfMonth));
}

function lastWeekdayOfMonth(year: number, monthIndex: number, weekday: number): Date {
  const lastCal = new Date(year, monthIndex + 1, 0);
  let d = lastCal.getDate();
  while (new Date(year, monthIndex, d).getDay() !== weekday) {
    d -= 1;
  }
  return startOfDay(new Date(year, monthIndex, d));
}

function fourthThursdayNovember(year: number): Date {
  const first = new Date(year, 10, 1);
  const dow = first.getDay();
  const daysToThu = (4 - dow + 7) % 7;
  return startOfDay(new Date(year, 10, 1 + daysToThu + 21));
}

/** YYYY-MM-DD for observed federal holidays in `year`. */
export function getObservedFederalHolidaySet(year: number): Set<string> {
  const dates: Date[] = [];

  dates.push(observeFederalHoliday(new Date(year, 0, 1)));
  dates.push(nthWeekdayOfMonth(year, 0, 1, 3));
  dates.push(nthWeekdayOfMonth(year, 1, 1, 3));
  dates.push(lastWeekdayOfMonth(year, 4, 1));
  dates.push(observeFederalHoliday(new Date(year, 5, 19)));
  dates.push(observeFederalHoliday(new Date(year, 6, 4)));
  dates.push(nthWeekdayOfMonth(year, 8, 1, 1));
  dates.push(nthWeekdayOfMonth(year, 9, 1, 2));
  dates.push(observeFederalHoliday(new Date(year, 10, 11)));
  dates.push(fourthThursdayNovember(year));
  dates.push(observeFederalHoliday(new Date(year, 11, 25)));

  return new Set(dates.map((d) => format(d, 'yyyy-MM-dd')));
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isFederalHoliday(d: Date): boolean {
  const y = d.getFullYear();
  return getObservedFederalHolidaySet(y).has(format(startOfDay(d), 'yyyy-MM-dd'));
}

export function isBusinessDay(d: Date): boolean {
  return !isWeekend(d) && !isFederalHoliday(d);
}

/**
 * The date that is `n` business days **before** `closingDate` (closing day itself is not counted).
 * CFPB: e.g. CD must be received 3 business days before consummation (closing).
 */
export function getNthBusinessDayBeforeClosing(closingDate: Date, n: number): Date {
  if (n <= 0) {
    return startOfDay(closingDate);
  }
  let d = addDays(startOfDay(closingDate), -1);
  let counted = 0;
  let guard = 0;
  while (counted < n && guard < 370) {
    guard += 1;
    if (isBusinessDay(d)) {
      counted += 1;
      if (counted === n) {
        return d;
      }
    }
    d = addDays(d, -1);
  }
  return d;
}

/** `n` business days after `from` (if `n` is 0, returns `from`). */
export function addBusinessDaysFrom(from: Date, n: number): Date {
  let d = startOfDay(from);
  if (n <= 0) return d;
  let count = 0;
  let guard = 0;
  while (count < n && guard < 370) {
    guard += 1;
    d = addDays(d, 1);
    if (isBusinessDay(d)) {
      count += 1;
    }
  }
  return d;
}
