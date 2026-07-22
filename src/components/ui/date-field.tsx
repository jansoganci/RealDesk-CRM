import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import { enUS } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  formatDateDisplayUS,
  formatDateForDb,
  parseDateInputValue,
} from '@/lib/dates';
import { cn } from '@/lib/utils';

export interface DateFieldProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * US-facing date picker. Displays MM/dd/yyyy; stores YYYY-MM-DD.
 */
export const DateField = React.forwardRef<HTMLButtonElement, DateFieldProps>(
  function DateField(
    {
      value,
      onChange,
      disabled = false,
      id,
      placeholder,
      className,
      minDate,
      maxDate,
    },
    ref
  ) {
    const { t } = useTranslation('common');
    const [open, setOpen] = React.useState(false);
    const selected = parseDateInputValue(value ?? null);
    const display = formatDateDisplayUS(value ?? null);
    const emptyLabel = placeholder ?? t('dateField.placeholder');

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start pl-3 text-left font-normal [&>span]:w-full [&>span]:justify-between',
              !display && 'text-muted-foreground',
              className
            )}
          >
            <span className="truncate">{display || emptyLabel}</span>
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={enUS}
            selected={selected}
            onSelect={(date) => {
              onChange(date ? formatDateForDb(date) : null);
              setOpen(false);
            }}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DateField.displayName = 'DateField';
