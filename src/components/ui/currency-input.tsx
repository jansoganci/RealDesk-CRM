import * as React from 'react';
import { Input } from '@/components/ui/input';
import {
  formatUsdGroupedAmount,
  getCurrencySymbol,
  parseUsdGroupedAmount,
} from '@/lib/currency';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number | null | undefined;
  onChange: (value: number | null | undefined) => void;
  /** Value emitted when the field is cleared. Default: null */
  emptyValue?: null | undefined;
  /** ISO currency from user preferences (default USD). Shows symbol prefix. */
  currency?: string;
}

/**
 * Money input with en-US thousand separators (750,000) and currency symbol.
 * Formats on blur; while focused shows an editable draft.
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      value,
      onChange,
      emptyValue = null,
      currency = 'USD',
      className,
      onFocus,
      onBlur,
      disabled,
      ...props
    },
    ref
  ) {
    const [focused, setFocused] = React.useState(false);
    const [draft, setDraft] = React.useState('');
    const symbol = getCurrencySymbol(currency);

    const display = focused ? draft : formatUsdGroupedAmount(value);

    return (
      <div className="relative">
        <span
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm',
            disabled ? 'text-muted-foreground/70' : 'text-muted-foreground'
          )}
          aria-hidden
        >
          {symbol}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          className={cn('tabular-nums pl-7', className)}
          {...props}
          value={display}
          aria-label={props['aria-label'] ?? `Amount in ${currency}`}
          onFocus={(e) => {
            setFocused(true);
            setDraft(
              value == null || Number.isNaN(value) ? '' : String(value)
            );
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            const parsed = parseUsdGroupedAmount(draft);
            if (parsed == null) {
              onChange(emptyValue);
              setDraft('');
            } else {
              onChange(parsed);
              setDraft(String(parsed));
            }
            onBlur?.(e);
          }}
          onChange={(e) => {
            const next = e.target.value;
            // Allow digits, one dot, and commas while typing
            if (next !== '' && !/^[\d,]*\.?\d*$/.test(next)) return;
            setDraft(next);
            const parsed = parseUsdGroupedAmount(next);
            if (next.trim() === '') {
              onChange(emptyValue);
            } else if (parsed != null) {
              onChange(parsed);
            }
          }}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
