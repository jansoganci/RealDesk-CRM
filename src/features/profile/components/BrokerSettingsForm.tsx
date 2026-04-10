import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { commissionsService, userPreferencesService } from '@/lib/serviceProxy';
import { calculateCommission } from '@/services/commissionCalculator';
import type { BrokerSettings, CapProgress } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { brokerSettingsSchema, type BrokerSettingsFormValues } from '../schemas/brokerSettingsSchema';
import { CapProgressCard } from './CapProgressCard';

const defaultValues: BrokerSettingsFormValues = {
  broker_model: 'split_with_cap',
  broker_split_pct: 30,
  annual_cap_amount: 18000,
  cap_anniversary_date: null,
  franchise_fee_enabled: false,
  franchise_fee_pct: null,
  franchise_fee_cap: null,
  default_transaction_fee: 0,
  eo_fee_type: 'per_deal',
  eo_fee_amount: 0,
  default_tc_fee: 0,
  default_rental_commission_type: 'one_month',
  default_rental_commission_rate: null,
  default_rental_flat_fee: null,
};

const toNumberOrNull = (value: string): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const BrokerSettingsForm = () => {
  const { t } = useTranslation('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capProgress, setCapProgress] = useState<CapProgress | null>(null);

  const form = useForm<BrokerSettingsFormValues>({
    resolver: zodResolver(brokerSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await userPreferencesService.getBrokerSettings();
        const capData = await commissionsService.getCapProgress();
        form.reset({
          ...settings,
          annual_cap_amount: settings.annual_cap_amount ?? null,
          cap_anniversary_date: settings.cap_anniversary_date ?? null,
          franchise_fee_pct: settings.franchise_fee_pct ?? null,
          franchise_fee_cap: settings.franchise_fee_cap ?? null,
          default_rental_commission_rate: settings.default_rental_commission_rate ?? null,
          default_rental_flat_fee: settings.default_rental_flat_fee ?? null,
        });
        setCapProgress(capData);
      } catch {
        toast.error(t('commissionSettings.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [form, t]);

  const values = form.watch();

  const preview = useMemo(() => {
    const brokerSettings: BrokerSettings = {
      ...values,
      annual_cap_amount: values.annual_cap_amount,
      cap_anniversary_date: values.cap_anniversary_date,
      franchise_fee_pct: values.franchise_fee_pct,
      franchise_fee_cap: values.franchise_fee_cap,
      default_rental_commission_rate: values.default_rental_commission_rate,
      default_rental_flat_fee: values.default_rental_flat_fee,
    };

    return calculateCommission({
      salePrice: 400000,
      commissionRate: 2.75,
      commissionType: 'percentage',
      side: 'listing',
      referralPct: 0,
      brokerSettings,
      perDealFees: {
        transactionFee: values.default_transaction_fee,
        tcFee: values.default_tc_fee,
      },
      capContext: { ytdCompanyDollar: 0, ytdRoyaltyDollar: 0 },
    });
  }, [values]);

  const onSubmit = async (data: BrokerSettingsFormValues) => {
    setSaving(true);
    try {
      await userPreferencesService.updateBrokerSettings(data);
      const capData = await commissionsService.getCapProgress();
      toast.success(t('commissionSettings.messages.saveSuccess'));
      form.reset(data);
      setCapProgress(capData);
    } catch {
      toast.error(t('commissionSettings.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          {t('commissionSettings.loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('commissionSettings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="broker_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.brokerModel')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="split_with_cap">{t('commissionSettings.options.brokerModel.splitWithCap')}</SelectItem>
                        <SelectItem value="traditional_split">{t('commissionSettings.options.brokerModel.traditionalSplit')}</SelectItem>
                        <SelectItem value="flat_fee_100pct">{t('commissionSettings.options.brokerModel.flatFee100')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {values.broker_model !== 'flat_fee_100pct' && (
                <FormField
                  control={form.control}
                  name="broker_split_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSettings.fields.brokerSplitPct')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {values.broker_model === 'split_with_cap' && (
                <FormField
                  control={form.control}
                  name="annual_cap_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSettings.fields.annualCapAmount')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="cap_anniversary_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.capAnniversaryDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="franchise_fee_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>{t('commissionSettings.fields.franchiseEnabled')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {values.franchise_fee_enabled && (
                <>
                  <FormField
                    control={form.control}
                    name="franchise_fee_pct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('commissionSettings.fields.franchiseFeePct')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="franchise_fee_cap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('commissionSettings.fields.franchiseFeeCap')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="default_transaction_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.defaultTransactionFee')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eo_fee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.eoFeeType')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per_deal">{t('commissionSettings.options.eoFeeType.perDeal')}</SelectItem>
                        <SelectItem value="monthly">{t('commissionSettings.options.eoFeeType.monthly')}</SelectItem>
                        <SelectItem value="annual_excluded">{t('commissionSettings.options.eoFeeType.annualExcluded')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {values.eo_fee_type === 'per_deal' && (
                <FormField
                  control={form.control}
                  name="eo_fee_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSettings.fields.eoFeeAmount')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="default_tc_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.defaultTcFee')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_rental_commission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.defaultRentalType')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one_month">{t('commissionSettings.options.rentalType.oneMonth')}</SelectItem>
                        <SelectItem value="annual_pct">{t('commissionSettings.options.rentalType.annualPct')}</SelectItem>
                        <SelectItem value="flat_fee">{t('commissionSettings.options.rentalType.flatFee')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {values.default_rental_commission_type === 'annual_pct' && (
                <FormField
                  control={form.control}
                  name="default_rental_commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSettings.fields.defaultRentalRate')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {values.default_rental_commission_type === 'flat_fee' && (
                <FormField
                  control={form.control}
                  name="default_rental_flat_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSettings.fields.defaultRentalFlatFee')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('commissionSettings.saving')}
                  </>
                ) : (
                  t('commissionSettings.save')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('commissionSettings.preview.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">{t('commissionSettings.preview.example')}</p>
          <p>{t('commissionSettings.preview.dealGci')}: ${preview.dealGCI.toLocaleString()}</p>
          <p>{t('commissionSettings.preview.broker')}: ${preview.brokerDollar.toLocaleString()}</p>
          <p>{t('commissionSettings.preview.franchise')}: ${preview.franchiseFee.toLocaleString()}</p>
          <p>{t('commissionSettings.preview.transaction')}: ${preview.transactionFee.toLocaleString()}</p>
          <p>{t('commissionSettings.preview.eo')}: ${preview.eoFee.toLocaleString()}</p>
          <p>{t('commissionSettings.preview.tc')}: ${preview.tcFee.toLocaleString()}</p>
          <p className="font-semibold">{t('commissionSettings.preview.net')}: ${preview.netCommission.toLocaleString()}</p>
        </CardContent>
      </Card>

      {capProgress && <CapProgressCard progress={capProgress} />}
    </div>
  );
};
