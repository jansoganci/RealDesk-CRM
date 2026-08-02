import { format, parseISO } from 'date-fns';

import { formatCurrency } from '@/lib/currency';

const USD = 'USD';

export function fmtMoney(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return formatCurrency(amount, USD);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

export function fmtYesNo(value: boolean | null | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Not specified';
}

export function fmtList(items: string[] | null | undefined): string {
  if (!items || items.length === 0) return 'None listed';
  return items.filter(Boolean).join(', ');
}

/**
 * Build an optional inline fragment (a name suffix, a trailing time clause,
 * etc.) meant to concatenate directly against surrounding template text with
 * no separator. Returns '' when `condition` is falsy so the fragment
 * disappears cleanly — use this instead of a bare `cond ? text : ''` so the
 * empty case is unambiguous to interpolateTemplate.
 */
export function optionalClause(condition: unknown, text: string): string {
  return condition ? text : '';
}
