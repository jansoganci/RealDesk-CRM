import { useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import {
  offerRoundsService,
  type CreateFirstOfferInput,
  type DealWithRelations,
} from '@/lib/serviceProxy';
import type { OfferRound } from '@/types';
import {
  firstOfferFormSchema,
  type FirstOfferFormData,
} from '@/features/deals/schemas/firstOfferFormSchema';
const FINANCING_TYPES = [
  'cash',
  'conventional',
  'fha',
  'va',
  'usda',
  'seller_financing',
  'other',
] as const;

const SELECT_NONE = '__none__';

function toCreateFirstInput(data: FirstOfferFormData): CreateFirstOfferInput {
  return {
    offer_price: data.offer_price,
    offered_by: data.offered_by,
    emd_amount: data.emd_amount ?? null,
    closing_date: data.closing_date ?? null,
    possession_date: data.possession_date ?? null,
    seller_credits: data.seller_credits ?? null,
    appraisal_gap_coverage: data.appraisal_gap_coverage ?? null,
    personal_property_notes: data.personal_property_notes ?? null,
    financing_type: data.financing_type ?? null,
    expiration_date: data.expiration_date ?? null,
    expiration_time:
      data.expiration_time && String(data.expiration_time).trim()
        ? String(data.expiration_time).trim()
        : null,
    notes: data.notes ?? null,
  };
}

function defaultsFromDeal(deal: DealWithRelations): FirstOfferFormData {
  const price = deal.intended_offer_price ?? deal.list_price ?? 1;
  return {
    offer_price: price,
    offered_by: 'buyer',
    emd_amount: null,
    closing_date: null,
    possession_date: null,
    seller_credits: null,
    appraisal_gap_coverage: null,
    personal_property_notes: null,
    financing_type: null,
    expiration_date: null,
    expiration_time: '',
    notes: null,
  };
}

function defaultsFromPrior(prior: OfferRound): FirstOfferFormData {
  return {
    offer_price: prior.offer_price,
    offered_by: prior.offered_by === 'buyer' ? 'seller' : 'buyer',
    emd_amount: prior.emd_amount,
    closing_date: prior.closing_date,
    possession_date: prior.possession_date,
    seller_credits: prior.seller_credits,
    appraisal_gap_coverage: prior.appraisal_gap_coverage,
    personal_property_notes: prior.personal_property_notes,
    financing_type:
      (prior.financing_type as FirstOfferFormData['financing_type']) ?? null,
    expiration_date: prior.expiration_date,
    expiration_time: prior.expiration_time ?? '',
    notes: prior.notes,
  };
}

interface OfferRoundSheetProps {
  dealId: string;
  deal: DealWithRelations;
  mode: 'first' | 'counter';
  priorRound: OfferRound | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export function OfferRoundSheet({
  dealId,
  deal,
  mode,
  priorRound,
  open,
  onOpenChange,
  onSuccess,
  disabled = false,
}: OfferRoundSheetProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo(() => {
    if (mode === 'counter' && priorRound) {
      return defaultsFromPrior(priorRound);
    }
    return defaultsFromDeal(deal);
  }, [deal, mode, priorRound]);

  const form = useForm<FirstOfferFormData>({
    resolver: zodResolver(firstOfferFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (mode === 'counter' && priorRound) {
        form.reset(defaultsFromPrior(priorRound));
      } else {
        form.reset(defaultsFromDeal(deal));
      }
    }
  }, [open, mode, priorRound, deal, form]);

  const onSubmit = async (data: FirstOfferFormData) => {
    if (disabled) return;
    if (mode === 'counter' && !priorRound) return;
    setSubmitting(true);
    try {
      const payload = toCreateFirstInput(data);
      if (mode === 'first') {
        await offerRoundsService.createFirstOffer(dealId, payload);
        toast({ title: t('offers.toastFirst') });
      } else {
        await offerRoundsService.addCounterOffer(
          priorRound!.id,
          {
            offer_price: data.offer_price,
            emd_amount: data.emd_amount ?? undefined,
            closing_date: data.closing_date ?? undefined,
            possession_date: data.possession_date ?? undefined,
            seller_credits: data.seller_credits ?? undefined,
            appraisal_gap_coverage: data.appraisal_gap_coverage ?? undefined,
            personal_property_notes: data.personal_property_notes ?? undefined,
            financing_type: data.financing_type ?? undefined,
            expiration_date: data.expiration_date ?? undefined,
            expiration_time: data.expiration_time?.trim()
              ? data.expiration_time.trim()
              : undefined,
            notes: data.notes ?? undefined,
          },
          data.offered_by
        );
        toast({ title: t('offers.toastCounter') });
      }
      onOpenChange(false);
      await onSuccess();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('offers.toastError'),
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
            {mode === 'first'
              ? t('offers.sheetTitleFirst')
              : t('offers.sheetTitleCounter')}
          </SheetTitle>
          <SheetDescription>{t('offers.sheetDescription')}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-6"
          >
            <FormField
              control={form.control}
              name="offer_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('detail.offerPrice')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === '' ? undefined : Number(v));
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
              name="offered_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('offers.offeredBy')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col gap-2"
                      disabled={disabled}
                    >
                      {(['buyer', 'seller'] as const).map((side) => (
                        <div key={side} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={side}
                            id={`offered-${side}-${mode}`}
                          />
                          <label
                            htmlFor={`offered-${side}-${mode}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {t(`offers.side.${side}`)}
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
              name="emd_amount"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('offers.closingDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="possession_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('offers.possessionDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('offers.expirationDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiration_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('offers.expirationTime')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5:00 PM"
                        {...field}
                        value={field.value ?? ''}
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
              <Button type="submit" disabled={disabled || submitting}>
                {t('offers.submitCreate')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
