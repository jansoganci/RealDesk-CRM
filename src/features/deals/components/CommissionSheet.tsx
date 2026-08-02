import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { commissionsService, orgMemberCommissionSettingsService, type DealWithRelations } from '@/lib/serviceProxy';
import { calculateCommission } from '@/services/commissionCalculator';
import { formatCurrency } from '@/lib/currency';
import type { BrokerSettings } from '@/types';
import type { BrokerSettingsSource } from '@/lib/serviceProxy';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
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
import { CommissionWaterfall } from './CommissionWaterfall';
import { getLatestPurchaseContractIdFromDeal } from '@/features/deals/utils/purchaseDealHelpers';
import {
  commissionSheetSchema,
  type CommissionSheetFormValues,
} from '../schemas/commissionSheetSchema';

interface CommissionSheetProps {
  deal: DealWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
}

/** Linked property row, or manual snapshot / deal name for off-system addresses. */
function commissionPropertyAddressLabel(deal: DealWithRelations): string {
  const props = deal.properties;
  const fromLinked = Array.isArray(props) ? props[0]?.address : props?.address;
  if (fromLinked) return fromLinked;

  const snap = deal.property_snapshot;
  if (snap && typeof snap === 'object') {
    const s = snap as Record<string, unknown>;
    const street = typeof s.street_address === 'string' ? s.street_address.trim() : '';
    const city = typeof s.city === 'string' ? s.city.trim() : '';
    const state = typeof s.state === 'string' ? s.state.trim() : '';
    const zip = typeof s.zip_code === 'string' ? s.zip_code.trim() : '';
    const tail = [city, state, zip].filter(Boolean).join(', ');
    if (street && tail) return `${street}, ${tail}`;
    if (street) return street;
    if (tail) return tail;
  }
  return deal.deal_name ?? '';
}

const defaultBrokerSettings: BrokerSettings = {
  broker_model: 'split_with_cap',
  broker_split_pct: 30,
  annual_cap_amount: null,
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

export const CommissionSheet = ({
  deal,
  open,
  onOpenChange,
  onSuccess,
}: CommissionSheetProps) => {
  const { t } = useTranslation('deals');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brokerSettings, setBrokerSettings] = useState<BrokerSettings>(defaultBrokerSettings);
  const [settingsSource, setSettingsSource] = useState<BrokerSettingsSource>('defaults');

  const form = useForm<CommissionSheetFormValues>({
    resolver: zodResolver(commissionSheetSchema),
    defaultValues: {
      sale_price: deal.accepted_offer_price ?? deal.intended_offer_price ?? null,
      commission_type: 'percentage',
      commission_rate: 2.5,
      flat_fee_amount: null,
      commission_side: deal.deal_type === 'rental' ? 'rental_listing' : 'listing',
      referral_enabled: false,
      referral_pct: null,
      referral_to: null,
      tc_fee: 0,
      other_fees: 0,
      closing_date: format(new Date(), 'yyyy-MM-dd'),
      override_broker_settings: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const resolved = await orgMemberCommissionSettingsService.resolveBrokerSettingsForMember(
          deal.user_id
        );
        const { source, ...settings } = resolved;
        setBrokerSettings(settings);
        setSettingsSource(source);
        form.reset({
          sale_price: deal.accepted_offer_price ?? deal.intended_offer_price ?? null,
          commission_type: 'percentage',
          commission_rate: 2.5,
          flat_fee_amount: null,
          commission_side: deal.deal_type === 'rental' ? 'rental_listing' : 'listing',
          referral_enabled: false,
          referral_pct: null,
          referral_to: null,
          tc_fee: settings.default_tc_fee ?? 0,
          other_fees: 0,
          closing_date: format(new Date(), 'yyyy-MM-dd'),
          override_broker_settings: false,
        });
      } catch {
        toast.error(t('commissionSheet.messages.loadSettingsError'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open, deal, form, t]);

  const values = form.watch();
  const effectiveBrokerSettings = brokerSettings;

  const calculation = useMemo(() => {
    return calculateCommission({
      salePrice: values.sale_price ?? 0,
      commissionRate: values.commission_rate ?? 0,
      commissionType: values.commission_type,
      side: values.commission_side,
      referralPct: values.referral_enabled ? values.referral_pct ?? 0 : 0,
      brokerSettings: effectiveBrokerSettings,
      perDealFees: {
        tcFee: values.tc_fee ?? 0,
        otherFees: values.other_fees ?? 0,
      },
      flatFeeAmount: values.flat_fee_amount ?? 0,
      capContext: { ytdCompanyDollar: 0, ytdRoyaltyDollar: 0 },
    });
  }, [values, effectiveBrokerSettings]);

  const onSubmit = async (data: CommissionSheetFormValues) => {
    setSaving(true);
    try {
      await commissionsService.recordCommission({
        property_id: deal.property_id ?? null,
        deal_id: deal.id,
        contract_id: getLatestPurchaseContractIdFromDeal(deal),
        type: (deal.deal_type === 'rental' ? 'rental' : 'sale'),
        amount: calculation.netCommission,
        currency: 'USD',
        property_address: commissionPropertyAddressLabel(deal),
        commission_side: data.commission_side,
        commission_type: data.commission_type,
        commission_rate: data.commission_type === 'percentage' ? data.commission_rate : null,
        sale_price: data.sale_price,
        gross_commission: calculation.dealGCI,
        referral_fee_pct: data.referral_enabled ? data.referral_pct : 0,
        referral_fee_amount: calculation.referralFeeAmount,
        referral_to: data.referral_enabled ? data.referral_to : null,
        post_referral_gci: calculation.postReferralGCI,
        broker_split_pct: effectiveBrokerSettings.broker_split_pct,
        broker_dollar: calculation.brokerDollar,
        capped_at_close: calculation.cappedAtClose,
        franchise_fee_amount: calculation.franchiseFee,
        transaction_fee: calculation.transactionFee,
        eo_fee: calculation.eoFee,
        tc_fee: calculation.tcFee,
        other_fees: calculation.otherFees,
        net_commission: calculation.netCommission,
        closing_date: data.closing_date,
        notes: null,
        // RPC attributes to deals.user_id; value here satisfies CommissionInsert typing.
        user_id: deal.user_id,
      });
      toast.success(
        t('commissionSheet.messages.recorded', {
          amount: formatCurrency(calculation.netCommission),
        })
      );
      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('commissionSheet.messages.recordError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('commissionSheet.title')}</SheetTitle>
          <SheetDescription>{t('commissionSheet.description')}</SheetDescription>
        </SheetHeader>

        {!loading && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t('commissionSheet.settingsSource', {
              source: t(`commissionSheet.settingsSourceLabels.${settingsSource}`),
            })}
          </p>
        )}

        {loading ? (
          <div className="py-8 text-sm text-muted-foreground">{t('commissionSheet.loading')}</div>
        ) : (
          <div className="grid gap-6 mt-4 lg:grid-cols-2">
            <Form {...form}>
              <form id="commission-sheet-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSheet.fields.salePrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission_side"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSheet.fields.side')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="listing">{t('commissionSheet.options.side.listing')}</SelectItem>
                          <SelectItem value="buyer">{t('commissionSheet.options.side.buyer')}</SelectItem>
                          <SelectItem value="dual">{t('commissionSheet.options.side.dual')}</SelectItem>
                          <SelectItem value="rental_listing">{t('commissionSheet.options.side.rentalListing')}</SelectItem>
                          <SelectItem value="rental_tenant">{t('commissionSheet.options.side.rentalTenant')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSheet.fields.commissionType')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">{t('commissionSheet.options.type.percentage')}</SelectItem>
                          <SelectItem value="flat_fee">{t('commissionSheet.options.type.flatFee')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {values.commission_type === 'percentage' ? (
                  <FormField
                    control={form.control}
                    name="commission_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('commissionSheet.fields.commissionRate')}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.001" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="flat_fee_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('commissionSheet.fields.flatFeeAmount')}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="referral_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-md p-3">
                      <FormLabel>{t('commissionSheet.fields.referralEnabled')}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {values.referral_enabled && (
                  <>
                    <FormField
                      control={form.control}
                      name="referral_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('commissionSheet.fields.referralTo')}</FormLabel>
                          <FormControl>
                            <Input value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referral_pct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('commissionSheet.fields.referralPct')}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="tc_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSheet.fields.tcFee')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="other_fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSheet.fields.otherFees')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closing_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('commissionSheet.fields.closingDate')}</FormLabel>
                      <FormControl>
                        <DateField
                          value={field.value || null}
                          onChange={(next) => field.onChange(next ?? '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            <CommissionWaterfall result={calculation} />
          </div>
        )}

        <SheetFooter className="gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('creation.cancel')}
          </Button>
          <Button type="submit" form="commission-sheet-form" disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('commissionSheet.recording')}
              </>
            ) : (
              t('commissionSheet.submit')
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
