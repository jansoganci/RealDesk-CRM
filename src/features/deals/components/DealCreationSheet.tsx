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
import { dealsService, type CreateDealInput } from '@/lib/serviceProxy';
import type { LeadWithRelations } from '@/services/leads.service';
import { dealFormSchema, type DealFormData } from '@/features/deals/schemas/dealFormSchema';

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

function toCreatePayload(data: DealFormData): CreateDealInput {
  return {
    deal_name: data.deal_name,
    deal_type: data.deal_type,
    client_role: data.client_role,
    property_id: data.property_id ?? null,
    property_snapshot: data.property_snapshot ?? null,
    financing_type: data.financing_type ?? null,
    preapproval_status: data.preapproval_status ?? null,
    buyer_agent_agreement_id: data.buyer_agent_agreement_id ?? null,
    list_price: data.list_price ?? null,
    intended_offer_price: data.intended_offer_price ?? null,
    earnest_money_planned: data.earnest_money_planned ?? null,
    projected_close_date: data.projected_close_date || null,
    notes: data.notes ?? null,
  };
}

function buildDefaultsFromLead(lead: LeadWithRelations): DealFormData {
  const dealType = lead.inquiry_type === 'rental' ? 'rental' : 'sale';
  const maxBudget =
    dealType === 'rental' ? lead.max_rent_budget : lead.max_sale_budget;

  let preapproval_status: DealFormData['preapproval_status'] = null;
  if (lead.pre_approved === true) preapproval_status = 'approved';
  else if (lead.pre_approved === false) preapproval_status = 'not_started';

  return {
    deal_name: `${lead.name} — ${dealType === 'sale' ? 'Purchase' : 'Lease'}`,
    deal_type: dealType,
    client_role: 'buyer',
    property_id: null,
    property_snapshot: null,
    financing_type: null,
    preapproval_status,
    buyer_agent_agreement_id: lead.buyer_agent_agreement?.id ?? null,
    list_price: maxBudget ?? null,
    intended_offer_price: maxBudget ?? null,
    earnest_money_planned: null,
    projected_close_date: null,
    notes: lead.notes ?? null,
    lead_id: lead.id,
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

  const onSubmit = async (data: DealFormData) => {
    if (disabled) return;
    setSubmitting(true);
    try {
      const payload = toCreatePayload(data);
      if (lead) {
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
                    disabled={disabled}
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
                {t('creation.submit')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
