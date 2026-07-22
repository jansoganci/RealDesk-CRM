import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { dealsService } from '@/lib/serviceProxy';
import type { LeadWithRelations } from '@/services/leads.service';
import { dealFormSchema, type DealFormData } from '@/features/deals/schemas/dealFormSchema';
import { useLeadPropertyMatches } from '@/features/deals/hooks/useLeadPropertyMatches';
import {
  applyPropertyMatchDefaults,
  buildDefaultsFromLead,
  getDefaultPropertyMatch,
  isEligiblePropertyMatch,
} from '@/features/deals/utils/dealCreationDefaults';
import {
  buildDealPayload,
  validateConvertPreconditions,
} from '@/features/deals/utils/dealConvertPreconditions';
import type { InquiryMatchWithProperty } from '@/types';

const FINANCING_TYPES = [
  'cash',
  'conventional',
  'fha',
  'va',
  'usda',
  'seller_financing',
  'other',
] as const;

const PREAPPROVAL_STATUSES = [
  'not_started',
  'in_progress',
  'approved',
  'denied',
] as const;

const SELECT_NONE = '__none__';

function emptyDealDefaults(): DealFormData {
  return {
    deal_name: '',
    deal_type: 'sale',
    client_role: 'buyer',
    property_id: null,
    property_snapshot: null,
    financing_type: null,
    preapproval_status: null,
    buyer_agent_agreement_id: null,
    list_price: null,
    intended_offer_price: null,
    earnest_money_planned: null,
    projected_close_date: null,
    notes: null,
    lead_id: null,
    deal_stage: undefined,
  };
}

interface DealCreationSheetProps {
  /** When set, submits via `convertLeadToDeal` and pre-fills from the lead. */
  lead?: LeadWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export function DealCreationSheet({
  lead,
  open,
  onOpenChange,
  onSuccess,
  disabled = false,
}: DealCreationSheetProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    reload: reloadMatches,
  } = useLeadPropertyMatches(lead?.id, open && Boolean(lead));

  const eligibleMatches = useMemo(
    () =>
      lead
        ? matches.filter((match) => isEligiblePropertyMatch(match, lead.inquiry_type))
        : [],
    [lead, matches]
  );

  const defaults = useMemo(
    () => (lead ? buildDefaultsFromLead(lead) : emptyDealDefaults()),
    [lead]
  );

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(lead ? buildDefaultsFromLead(lead) : emptyDealDefaults());
    }
  }, [open, lead, form]);

  const applyMatch = useCallback(
    (match: InquiryMatchWithProperty) => {
      if (!lead) return;
      const next = applyPropertyMatchDefaults(form.getValues(), lead, match);
      form.setValue('property_id', next.property_id, { shouldDirty: true, shouldValidate: true });
      form.setValue('property_snapshot', null, { shouldDirty: true });
      form.setValue('deal_name', next.deal_name, { shouldDirty: true, shouldValidate: true });
      form.setValue('list_price', next.list_price, { shouldDirty: true, shouldValidate: true });
      form.setValue('intended_offer_price', next.intended_offer_price, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.clearErrors('property_id');
    },
    [form, lead]
  );

  useEffect(() => {
    if (!open || !lead || matchesLoading || matchesError) return;

    const currentPropertyId = form.getValues('property_id');
    const currentMatch = eligibleMatches.find(
      (match) => match.property_id === currentPropertyId
    );
    const preferredMatch =
      currentMatch ?? getDefaultPropertyMatch(eligibleMatches, lead.showing_logs);

    if (preferredMatch) applyMatch(preferredMatch);
  }, [applyMatch, eligibleMatches, form, lead, matchesError, matchesLoading, open]);

  const onSubmit = async (data: DealFormData) => {
    if (disabled) return;
    setSubmitting(true);
    try {
      const payload = buildDealPayload(data);
      if (lead) {
        if (validateConvertPreconditions(data) === 'property_required') {
          form.setError('property_id', {
            type: 'required',
            message: t('creation.propertyRequired'),
          });
          return;
        }
        await dealsService.convertLeadToDeal(lead.id, payload);
        toast({ title: t('creation.success') });
      } else {
        await dealsService.createDeal(payload);
        toast({ title: t('creation.successStandalone') });
      }
      onOpenChange(false);
      await onSuccess();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('creation.error'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {lead ? t('creation.title') : t('creation.titleStandalone')}
          </SheetTitle>
          <SheetDescription>
            {lead ? t('creation.description') : t('creation.descriptionStandalone')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-6"
          >
            <FormField
              control={form.control}
              name="deal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.dealName')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.dealType')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || Boolean(lead)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sale">
                        {t('dealType.sale')}
                      </SelectItem>
                      <SelectItem value="rental">
                        {t('dealType.rental')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lead ? (
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.property')}</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(propertyId) => {
                        const selected = eligibleMatches.find(
                          (match) => match.property_id === propertyId
                        );
                        if (selected) applyMatch(selected);
                      }}
                      disabled={disabled || matchesLoading || Boolean(matchesError)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              matchesLoading
                                ? t('creation.propertiesLoading')
                                : t('creation.propertyPlaceholder')
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eligibleMatches.map((match) => (
                          <SelectItem key={match.property_id} value={match.property_id}>
                            {match.property?.address ?? t('creation.propertyUnavailable')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {matchesError ? (
                      <FormDescription className="text-destructive">
                        {t('creation.propertiesError')}{' '}
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-destructive"
                          onClick={reloadMatches}
                        >
                          {t('creation.retry')}
                        </Button>
                      </FormDescription>
                    ) : !matchesLoading && eligibleMatches.length === 0 ? (
                      <FormDescription>{t('creation.noMatchedProperties')}</FormDescription>
                    ) : (
                      <FormDescription>{t('creation.propertyHelp')}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="client_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.clientRole')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col gap-2"
                      disabled={disabled}
                    >
                      {(['buyer', 'seller', 'dual'] as const).map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <RadioGroupItem value={role} id={`role-${role}`} />
                          <label
                            htmlFor={`role-${role}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {t(`clientRole.${role}`)}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="financing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.financingType')}</FormLabel>
                  <Select
                    value={field.value ?? SELECT_NONE}
                    onValueChange={(v) =>
                      field.onChange(v === SELECT_NONE ? null : v)
                    }
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('fields.financingPlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>
                        {t('fields.financingPlaceholder')}
                      </SelectItem>
                      {FINANCING_TYPES.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`financing.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preapproval_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.preapproval')}</FormLabel>
                  <Select
                    value={field.value ?? SELECT_NONE}
                    onValueChange={(v) =>
                      field.onChange(v === SELECT_NONE ? null : v)
                    }
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('fields.preapprovalPlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>
                        {t('fields.preapprovalPlaceholder')}
                      </SelectItem>
                      {PREAPPROVAL_STATUSES.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`preapproval.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="list_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.listPrice')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === '' ? null : Number(v));
                        }}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intended_offer_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.intendedOffer')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === '' ? null : Number(v));
                        }}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="earnest_money_planned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.earnestMoney')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === '' ? null : Number(v));
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projected_close_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.projectedClose')}</FormLabel>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      rows={3}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="gap-2 sm:gap-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {t('creation.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  disabled ||
                  submitting ||
                  Boolean(lead && (matchesLoading || matchesError || eligibleMatches.length === 0))
                }
              >
                {t('creation.submit')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
