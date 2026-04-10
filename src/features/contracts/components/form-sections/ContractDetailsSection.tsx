/**
 * Contract Details Form Section
 *
 * Form section for contract details (dates, rent amount, deposit, payment details)
 */

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

        {/* Rent Amount, Deposit, and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <Label>{t('create.fields.currency')} *</Label>
            <Select
              value={form.watch('currency') || 'USD'}
              onValueChange={(value) => form.setValue('currency', value as 'USD' | 'EUR' | 'TRY')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('create.placeholders.currency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">{t('create.currencyOptions.USD')}</SelectItem>
                <SelectItem value="EUR">{t('create.currencyOptions.EUR')}</SelectItem>
                <SelectItem value="TRY">{t('create.currencyOptions.TRY')}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.currency && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.currency.message}
              </p>
            )}
          </div>
        </div>

        {/* Commission Amount (Optional) */}
        <div>
          <Label htmlFor="commission_amount">
            {t('create.fields.commission_amount')}
          </Label>
          <Input
            id="commission_amount"
            type="number"
            placeholder={t('create.placeholders.commission_amount')}
            {...form.register('commission_amount', { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('create.helpers.commission_amount')}
          </p>
          {form.formState.errors.commission_amount && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.commission_amount.message}
            </p>
          )}
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

        {/* Handover Photos URL (Optional) */}
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">{t('create.fields.handover_photos_url')}</h4>
            <span className="text-xs text-muted-foreground">({t('create.optional')})</span>
          </div>

          <Input
            id="handover_photos_url"
            type="url"
            placeholder={t('create.placeholders.handover_photos_url')}
            {...form.register('handover_photos_url')}
          />

          <p className="text-xs text-muted-foreground">
            {t('create.helpers.handover_photos_url')}
          </p>

          {form.formState.errors.handover_photos_url && (
            <p className="text-sm text-red-600">
              {form.formState.errors.handover_photos_url.message}
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
