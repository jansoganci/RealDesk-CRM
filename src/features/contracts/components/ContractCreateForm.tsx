/**
 * Contract Creation Form
 * Comprehensive form for creating contracts with auto-entity creation
 * V1: Manual creation (no RPC yet)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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

import { contractFormSchema, contractFormDefaultValues, type ContractFormData } from '../schemas/contractForm.schema';
import { AddressInput } from './AddressInput';
import { cn } from '@/lib/utils';

export function ContractCreateForm() {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contractFormDefaultValues,
  });

  const onSubmit = async (data: ContractFormData) => {
    setIsSubmitting(true);

    try {
      // V1: Just show success toast (no actual creation yet - that's V2)
      console.log('Contract Form Data:', data);

      toast.success('Form validasyonu başarılı! (V1: RPC fonksiyonu V2\'de eklenecek)', {
        description: 'Tüm alanlar doğru dolduruldu.',
        duration: 5000,
      });

      // Don't navigate yet in V1
      // navigate('/contracts');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(t('errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Owner Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('create.sections.owner')}</CardTitle>
          <CardDescription>
            Mülk sahibinin bilgilerini giriniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Owner Name */}
          <div>
            <Label htmlFor="owner_name">
              {t('create.fields.owner_name')} *
            </Label>
            <Input
              id="owner_name"
              placeholder={t('create.placeholders.owner_name')}
              {...form.register('owner_name')}
            />
            {form.formState.errors.owner_name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.owner_name.message}
              </p>
            )}
          </div>

          {/* Owner TC */}
          <div>
            <Label htmlFor="owner_tc">
              {t('create.fields.owner_tc')} *
            </Label>
            <Input
              id="owner_tc"
              placeholder={t('create.placeholders.owner_tc')}
              maxLength={11}
              {...form.register('owner_tc')}
            />
            {form.formState.errors.owner_tc && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.owner_tc.message}
              </p>
            )}
          </div>

          {/* Owner IBAN */}
          <div>
            <Label htmlFor="owner_iban">
              {t('create.fields.owner_iban')} *
            </Label>
            <Input
              id="owner_iban"
              placeholder={t('create.placeholders.owner_iban')}
              maxLength={26}
              {...form.register('owner_iban')}
            />
            {form.formState.errors.owner_iban && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.owner_iban.message}
              </p>
            )}
          </div>

          {/* Owner Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner_phone">
                {t('create.fields.owner_phone')} *
              </Label>
              <Input
                id="owner_phone"
                placeholder={t('create.placeholders.owner_phone')}
                {...form.register('owner_phone')}
              />
              {form.formState.errors.owner_phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.owner_phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="owner_email">
                {t('create.fields.owner_email')}
              </Label>
              <Input
                id="owner_email"
                type="email"
                placeholder="ornek@email.com"
                {...form.register('owner_email')}
              />
              {form.formState.errors.owner_email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.owner_email.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('create.sections.tenant')}</CardTitle>
          <CardDescription>
            Kiracının bilgilerini giriniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tenant Name */}
          <div>
            <Label htmlFor="tenant_name">
              {t('create.fields.tenant_name')} *
            </Label>
            <Input
              id="tenant_name"
              placeholder={t('create.placeholders.tenant_name')}
              {...form.register('tenant_name')}
            />
            {form.formState.errors.tenant_name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.tenant_name.message}
              </p>
            )}
          </div>

          {/* Tenant TC */}
          <div>
            <Label htmlFor="tenant_tc">
              {t('create.fields.tenant_tc')} *
            </Label>
            <Input
              id="tenant_tc"
              placeholder={t('create.placeholders.owner_tc')}
              maxLength={11}
              {...form.register('tenant_tc')}
            />
            {form.formState.errors.tenant_tc && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.tenant_tc.message}
              </p>
            )}
          </div>

          {/* Tenant Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tenant_phone">
                {t('create.fields.tenant_phone')} *
              </Label>
              <Input
                id="tenant_phone"
                placeholder={t('create.placeholders.owner_phone')}
                {...form.register('tenant_phone')}
              />
              {form.formState.errors.tenant_phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.tenant_phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tenant_email">
                {t('create.fields.tenant_email')}
              </Label>
              <Input
                id="tenant_email"
                type="email"
                placeholder="ornek@email.com"
                {...form.register('tenant_email')}
              />
              {form.formState.errors.tenant_email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.tenant_email.message}
                </p>
              )}
            </div>
          </div>

          {/* Tenant Address */}
          <div>
            <Label htmlFor="tenant_address">
              {t('create.fields.tenant_address')} *
            </Label>
            <Textarea
              id="tenant_address"
              placeholder="Kiracının mevcut adresi"
              rows={3}
              {...form.register('tenant_address')}
            />
            {form.formState.errors.tenant_address && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.tenant_address.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('create.sections.property')}</CardTitle>
          <CardDescription>
            Kiralanacak mülkün adres bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressInput form={form} />
        </CardContent>
      </Card>

      {/* Contract Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('create.sections.contract')}</CardTitle>
          <CardDescription>
            Sözleşme detayları
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
                      <span>Tarih seçiniz</span>
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
                      <span>Tarih seçiniz</span>
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
          <h4 className="text-sm font-medium">Ödeme Detayları (Opsiyonel)</h4>

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
                placeholder="Banka Transferi"
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
              placeholder="Özel şartlar veya notlar..."
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

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/contracts')}
          className="flex-1"
        >
          {t('create.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Oluşturuluyor...' : t('create.buttons.submit')}
        </Button>
      </div>
    </form>
  );
}
