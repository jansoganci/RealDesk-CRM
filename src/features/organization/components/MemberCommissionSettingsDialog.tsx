import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { orgMemberCommissionSettingsService } from '@/lib/serviceProxy';
import {
  brokerSettingsSchema,
  type BrokerSettingsFormValues,
} from '@/features/profile/schemas/brokerSettingsSchema';
import type { TeamMember } from '@/types/org';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface MemberCommissionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMember: TeamMember | null;
}

export function MemberCommissionSettingsDialog({
  open,
  onOpenChange,
  teamMember,
}: MemberCommissionSettingsDialogProps) {
  const { t } = useTranslation(['team', 'common']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);

  const form = useForm<BrokerSettingsFormValues>({
    resolver: zodResolver(brokerSettingsSchema),
    defaultValues,
  });

  const memberUserId = teamMember?.member?.user_id;
  const displayName = teamMember?.name || teamMember?.email?.split('@')[0] || '';

  useEffect(() => {
    if (!open || !memberUserId) return;
    const load = async () => {
      setLoading(true);
      try {
        const override = await orgMemberCommissionSettingsService.getOverride(memberUserId);
        if (override) {
          setHasOverride(true);
          form.reset({
            ...defaultValues,
            ...override,
          });
        } else {
          setHasOverride(false);
          const resolved =
            await orgMemberCommissionSettingsService.resolveBrokerSettingsForMember(memberUserId);
          const { source: _source, ...settings } = resolved;
          form.reset({
            ...defaultValues,
            ...settings,
            annual_cap_amount: settings.annual_cap_amount ?? defaultValues.annual_cap_amount,
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('commissionSettings.errors.load'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open, memberUserId, form, t]);

  const values = form.watch();

  const onSubmit = async (data: BrokerSettingsFormValues) => {
    if (!memberUserId) return;
    setSaving(true);
    try {
      await orgMemberCommissionSettingsService.upsertOverride(memberUserId, data);
      setHasOverride(true);
      toast.success(t('commissionSettings.success.saved'));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('commissionSettings.errors.save'));
    } finally {
      setSaving(false);
    }
  };

  const onClear = async () => {
    if (!memberUserId) return;
    setClearing(true);
    try {
      await orgMemberCommissionSettingsService.clearOverride(memberUserId);
      setHasOverride(false);
      toast.success(t('commissionSettings.success.cleared'));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('commissionSettings.errors.clear'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('commissionSettings.title', { name: displayName })}</DialogTitle>
          <DialogDescription>
            {hasOverride
              ? t('commissionSettings.descriptionOverride')
              : t('commissionSettings.descriptionFallback')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('commissionSettings.loading')}
          </div>
        ) : (
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
                        <SelectItem value="split_with_cap">
                          {t('commissionSettings.options.brokerModel.splitWithCap')}
                        </SelectItem>
                        <SelectItem value="traditional_split">
                          {t('commissionSettings.options.brokerModel.traditionalSplit')}
                        </SelectItem>
                        <SelectItem value="flat_fee_100pct">
                          {t('commissionSettings.options.brokerModel.flatFee100')}
                        </SelectItem>
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
                    <FormLabel>{t('commissionSettings.fields.transactionFee')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                        <SelectItem value="per_deal">
                          {t('commissionSettings.options.eoFeeType.perDeal')}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {t('commissionSettings.options.eoFeeType.monthly')}
                        </SelectItem>
                        <SelectItem value="annual_excluded">
                          {t('commissionSettings.options.eoFeeType.annualExcluded')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eo_fee_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.eoFeeAmount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_tc_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commissionSettings.fields.tcFee')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onClear()}
                  disabled={!hasOverride || clearing || saving}
                >
                  {clearing ? t('commissionSettings.clearing') : t('commissionSettings.clear')}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    {t('common:cancel')}
                  </Button>
                  <Button type="submit" disabled={saving || clearing}>
                    {saving ? t('commissionSettings.saving') : t('commissionSettings.save')}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
