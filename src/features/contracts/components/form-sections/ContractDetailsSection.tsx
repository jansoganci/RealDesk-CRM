/**
 * Contract Details Form Section
 *
 * Form section for contract details (dates, rent amount, deposit, payment details)
 */

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ContractFormData } from '@/types/contract.types';

interface ContractDetailsSectionProps {
  form: UseFormReturn<ContractFormData>;
}

export function ContractDetailsSection({ form }: ContractDetailsSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('create.sections.contract')}</CardTitle>
        <CardDescription>
          {t('create.sections.contractDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Start Date and End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('create.fields.start_date')} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !form.watch('start_date') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('start_date') ? (
                    format(form.watch('start_date'), 'PPP', { locale: tr })
                  ) : (
                    <span>{t('create.datePicker.selectDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch('start_date')}
                  onSelect={(date) => form.setValue('start_date', date as Date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.start_date && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.start_date.message}
              </p>
            )}
          </div>

          <div>
            <Label>{t('create.fields.end_date')} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !form.watch('end_date') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('end_date') ? (
                    format(form.watch('end_date'), 'PPP', { locale: tr })
                  ) : (
                    <span>{t('create.datePicker.selectDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch('end_date')}
                  onSelect={(date) => form.setValue('end_date', date as Date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.end_date && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.end_date.message}
              </p>
            )}
          </div>
        </div>

        {/* Quick Duration Buttons */}
        {form.watch('start_date') && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 self-center mr-2">{t('create.datePicker.quickDuration')}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const start = form.watch('start_date');
                const end = new Date(start);
                end.setMonth(end.getMonth() + 6);
                form.setValue('end_date', end);
              }}
            >
              {t('create.datePicker.sixMonths')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const start = form.watch('start_date');
                const end = new Date(start);
                end.setFullYear(end.getFullYear() + 1);
                form.setValue('end_date', end);
              }}
            >
              {t('create.datePicker.oneYear')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const start = form.watch('start_date');
                const end = new Date(start);
                end.setFullYear(end.getFullYear() + 2);
                form.setValue('end_date', end);
              }}
            >
              {t('create.datePicker.twoYears')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const start = form.watch('start_date');
                const end = new Date(start);
                end.setFullYear(end.getFullYear() + 3);
                form.setValue('end_date', end);
              }}
            >
              {t('create.datePicker.threeYears')}
            </Button>
          </div>
        )}

        {/* Rent Amount and Deposit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rent_amount">
              {t('create.fields.rent_amount')} *
            </Label>
            <Input
              id="rent_amount"
              type="number"
              placeholder="10000"
              {...form.register('rent_amount', { valueAsNumber: true })}
            />
            {form.formState.errors.rent_amount && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.rent_amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deposit">
              {t('create.fields.deposit')} *
            </Label>
            <Input
              id="deposit"
              type="number"
              placeholder="20000"
              {...form.register('deposit', { valueAsNumber: true })}
            />
            {form.formState.errors.deposit && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.deposit.message}
              </p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <Separator />
        <h4 className="text-sm font-medium">{t('create.sections.paymentDetailsOptional')}</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_day_of_month">
              {t('create.fields.payment_day')}
            </Label>
            <Input
              id="payment_day_of_month"
              type="number"
              min="1"
              max="31"
              placeholder="5"
              {...form.register('payment_day_of_month', { valueAsNumber: true })}
            />
            {form.formState.errors.payment_day_of_month && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.payment_day_of_month.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="payment_method">
              {t('create.fields.payment_method')}
            </Label>
            <Input
              id="payment_method"
              placeholder={t('create.placeholders.payment_method')}
              {...form.register('payment_method')}
            />
            {form.formState.errors.payment_method && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.payment_method.message}
              </p>
            )}
          </div>
        </div>

        {/* Special Conditions */}
        <div>
          <Label htmlFor="special_conditions">
            {t('create.fields.special_conditions')}
          </Label>
          <Textarea
            id="special_conditions"
            placeholder={t('create.placeholders.special_conditions')}
            rows={4}
            {...form.register('special_conditions')}
          />
          {form.formState.errors.special_conditions && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.special_conditions.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
