/**
 * Sprint 6B T9 — Step 2: Buyers, sellers, title vesting, agents, effective date.
 */

import { useEffect, useRef, useState } from 'react';
import { useFormContext, type UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { leadsService, normalizePhone, ownersService, parseAddress, US_STATES } from '@/lib/serviceProxy';
import type { PropertyInquiry, PropertyOwner } from '@/types';

const NONE = '__none__';
/** Select sentinel for optional mailing state (stored as `null`). */
const STATE_NONE = '__state_none__';

function applyLeadBuyerPrefill(lead: PropertyInquiry, setValue: UseFormSetValue<PurchaseAgreementFormValues>) {
  setValue('buyer_name', lead.name);
  setValue('buyer_phone', lead.phone ? normalizePhone(lead.phone) : '');
  setValue('buyer_email', lead.email ?? '');
  const st = lead.preferred_state?.trim();
  setValue('buyer_mailing_city', lead.preferred_city?.trim() || null);
  setValue('buyer_mailing_state', st && st.length === 2 ? st.toUpperCase() : null);
  setValue('buyer_mailing_street', null);
  setValue('buyer_mailing_zip', null);
}

function applySellerOwnerPrefill(o: PropertyOwner, setValue: UseFormSetValue<PurchaseAgreementFormValues>) {
  setValue('linkedSellerOwnerId', o.id);
  setValue('seller_id', o.id);
  setValue('seller_name', o.name);
  setValue('seller_phone', o.phone ? normalizePhone(o.phone) : '');
  setValue('seller_email', o.email ?? '');
  const addr = o.address?.trim();
  if (addr) {
    const parsed = parseAddress(addr);
    setValue('seller_mailing_street', parsed.street_address ?? addr);
    setValue('seller_mailing_city', parsed.city ?? null);
    setValue('seller_mailing_state', parsed.state ?? null);
    setValue('seller_mailing_zip', parsed.zip_code ?? null);
  } else {
    setValue('seller_mailing_street', null);
    setValue('seller_mailing_city', null);
    setValue('seller_mailing_state', null);
    setValue('seller_mailing_zip', null);
  }
}

export function Step2Parties() {
  const { t } = useTranslation('contracts');
  const form = useFormContext<PurchaseAgreementFormValues>();
  const { control, watch, setValue } = form;

  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [saleLeads, setSaleLeads] = useState<PropertyInquiry[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [buyerLeadSelect, setBuyerLeadSelect] = useState<string | null>(null);
  const [buyer2Open, setBuyer2Open] = useState(false);
  const [seller2Open, setSeller2Open] = useState(false);

  const buyerName2 = watch('buyer_name_2');
  const sellerName2 = watch('seller_name_2');

  const leadPrefillApplied = useRef(false);

  useEffect(() => {
    if ((buyerName2?.trim() ?? '').length >= 2) setBuyer2Open(true);
  }, [buyerName2]);

  useEffect(() => {
    if ((sellerName2?.trim() ?? '').length >= 2) setSeller2Open(true);
  }, [sellerName2]);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        setLoadingOwners(true);
        const data = await ownersService.getAll();
        if (!c) setOwners(data);
      } catch {
        toast.error(t('purchaseWizard.step2.loadOwnersError'));
      } finally {
        if (!c) setLoadingOwners(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [t]);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        setLoadingLeads(true);
        const data = await leadsService.getSaleInquiries();
        if (!c) setSaleLeads(data);
      } catch {
        toast.error(t('purchaseWizard.step2.loadLeadsError'));
      } finally {
        if (!c) setLoadingLeads(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [t]);

  useEffect(() => {
    if (leadPrefillApplied.current) return;
    leadPrefillApplied.current = true;

    const leadId = new URLSearchParams(window.location.search).get('leadId');
    if (!leadId) return;

    void (async () => {
      try {
        const lead = await leadsService.getById(leadId);
        if (!lead) return;
        if (lead.inquiry_type !== 'sale') {
          toast.error(t('purchaseWizard.step2.wrongLeadType'));
          return;
        }
        setBuyerLeadSelect(leadId);
        applyLeadBuyerPrefill(lead, setValue);
      } catch {
        toast.error(t('purchaseWizard.step2.loadLeadError'));
      }
    })();
  }, [setValue, t]);

  const clearBuyer2 = () => {
    setValue('buyer_name_2', null);
    setValue('buyer_mailing_street_2', null);
    setValue('buyer_mailing_city_2', null);
    setValue('buyer_mailing_state_2', null);
    setValue('buyer_mailing_zip_2', null);
    setValue('buyer_phone_2', '');
    setValue('buyer_email_2', '');
    setValue('title_type', null);
  };

  const clearSeller2 = () => {
    setValue('seller_name_2', null);
    setValue('seller_phone_2', '');
    setValue('seller_email_2', '');
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step2.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step2.description')}</p>
      </div>

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step2.buyerSection')}</h4>

        <div className="space-y-2">
          <FormLabel>{t('purchaseWizard.step2.linkLead')}</FormLabel>
          <Select
            disabled={loadingLeads}
            value={buyerLeadSelect ?? NONE}
            onValueChange={(v) => {
              void (async () => {
                if (v === NONE) {
                  setBuyerLeadSelect(null);
                  return;
                }
                setBuyerLeadSelect(v);
                try {
                  const lead = await leadsService.getById(v);
                  if (!lead) return;
                  applyLeadBuyerPrefill(lead, setValue);
                } catch {
                  toast.error(t('purchaseWizard.step2.loadLeadError'));
                }
              })();
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingLeads
                    ? t('purchaseWizard.step2.loadingLeads')
                    : t('purchaseWizard.step2.linkLeadPlaceholder')
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('purchaseWizard.step2.noLinkedLead')}</SelectItem>
              {saleLeads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  <span className="font-medium">{lead.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{lead.phone}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.linkLeadHelp')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="buyer_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('purchaseWizard.step2.buyerName')}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="buyer_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.buyerPhone')}</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="tel" autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="buyer_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.buyerEmail')}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-xs font-medium text-muted-foreground">{t('purchaseWizard.step2.buyerMailing')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="buyer_mailing_street"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('purchaseWizard.step2.mailingStreet')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} autoComplete="street-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="buyer_mailing_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.mailingCity')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="buyer_mailing_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.mailingState')}</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === STATE_NONE ? null : v)}
                  value={field.value ?? STATE_NONE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('purchaseWizard.step2.statePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value={STATE_NONE}>{t('purchaseWizard.step2.stateOptional')}</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="buyer_mailing_zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.mailingZip')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="space-y-0.5 pr-2">
            <Label htmlFor="co-buyer-switch" className="text-sm font-medium">
              {t('purchaseWizard.step2.addCoBuyer')}
            </Label>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.addCoBuyerHelp')}</p>
          </div>
          <Switch
            id="co-buyer-switch"
            checked={buyer2Open}
            onCheckedChange={(on) => {
              setBuyer2Open(on);
              if (!on) clearBuyer2();
            }}
          />
        </div>

        {buyer2Open && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h5 className="text-sm font-medium">{t('purchaseWizard.step2.coBuyerSection')}</h5>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="buyer_name_2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('purchaseWizard.step2.coBuyerName')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="buyer_phone_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.coBuyerPhone')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} inputMode="tel" autoComplete="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="buyer_email_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.coBuyerEmail')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" value={field.value ?? ''} autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{t('purchaseWizard.step2.coBuyerMailing')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="buyer_mailing_street_2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('purchaseWizard.step2.mailingStreet')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="buyer_mailing_city_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.mailingCity')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="buyer_mailing_state_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.mailingState')}</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === STATE_NONE ? null : v)}
                      value={field.value ?? STATE_NONE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('purchaseWizard.step2.statePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value={STATE_NONE}>{t('purchaseWizard.step2.stateOptional')}</SelectItem>
                        {US_STATES.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="buyer_mailing_zip_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.mailingZip')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} inputMode="numeric" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="title_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('purchaseWizard.step2.titleType')}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.titleTypeHelp')}</p>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                      className="space-y-3"
                    >
                      <div className="rounded-md border border-border p-3">
                        <div className="flex items-start gap-2">
                          <RadioGroupItem value="tenancy_in_common" id="tt-tic" className="mt-0.5" />
                          <div>
                            <Label htmlFor="tt-tic" className="font-medium">
                              {t('purchaseWizard.step2.titleTypes.tic')}
                            </Label>
                            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.titleTypes.ticHelp')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <div className="flex items-start gap-2">
                          <RadioGroupItem value="joint_tenancy" id="tt-jt" className="mt-0.5" />
                          <div>
                            <Label htmlFor="tt-jt" className="font-medium">
                              {t('purchaseWizard.step2.titleTypes.joint')}
                            </Label>
                            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.titleTypes.jointHelp')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <div className="flex items-start gap-2">
                          <RadioGroupItem value="tenancy_by_entirety" id="tt-tbe" className="mt-0.5" />
                          <div>
                            <Label htmlFor="tt-tbe" className="font-medium">
                              {t('purchaseWizard.step2.titleTypes.entirety')}
                            </Label>
                            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.titleTypes.entiretyHelp')}</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step2.sellerSection')}</h4>

        <FormField
          control={control}
          name="linkedSellerOwnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step2.linkOwner')}</FormLabel>
              <Select
                disabled={loadingOwners}
                value={field.value ?? NONE}
                onValueChange={(v) => {
                  void (async () => {
                    if (v === NONE) {
                      field.onChange(null);
                      setValue('seller_id', null);
                      return;
                    }
                    field.onChange(v);
                    try {
                      const o = await ownersService.getById(v);
                      if (!o) return;
                      applySellerOwnerPrefill(o, setValue);
                    } catch {
                      toast.error(t('purchaseWizard.step2.loadOwnerError'));
                    }
                  })();
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingOwners
                          ? t('purchaseWizard.step2.loadingOwners')
                          : t('purchaseWizard.step2.linkOwnerPlaceholder')
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>{t('purchaseWizard.step2.noLinkedOwner')}</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="seller_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('purchaseWizard.step2.sellerName')}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seller_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.sellerPhone')}</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="tel" autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seller_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.sellerEmail')}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" value={field.value ?? ''} autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-xs font-medium text-muted-foreground">{t('purchaseWizard.step2.sellerMailing')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="seller_mailing_street"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('purchaseWizard.step2.mailingStreet')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seller_mailing_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.mailingCity')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seller_mailing_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.mailingState')}</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === STATE_NONE ? null : v)}
                  value={field.value ?? STATE_NONE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('purchaseWizard.step2.statePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value={STATE_NONE}>{t('purchaseWizard.step2.stateOptional')}</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seller_mailing_zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.mailingZip')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="space-y-0.5 pr-2">
            <Label htmlFor="co-seller-switch" className="text-sm font-medium">
              {t('purchaseWizard.step2.addCoSeller')}
            </Label>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.addCoSellerHelp')}</p>
          </div>
          <Switch
            id="co-seller-switch"
            checked={seller2Open}
            onCheckedChange={(on) => {
              setSeller2Open(on);
              if (!on) clearSeller2();
            }}
          />
        </div>

        {seller2Open && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h5 className="text-sm font-medium">{t('purchaseWizard.step2.coSellerSection')}</h5>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="seller_name_2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('purchaseWizard.step2.coSellerName')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="seller_phone_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.coSellerPhone')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} inputMode="tel" autoComplete="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="seller_email_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step2.coSellerEmail')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" value={field.value ?? ''} autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('purchaseWizard.step2.agentsSection')}</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="buyer_agent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.buyerAgentName')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="seller_agent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('purchaseWizard.step2.sellerAgentName')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <Separator />

      <FormField
        control={control}
        name="effective_date"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>{t('purchaseWizard.step2.effectiveDate')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step2.effectiveDateHelp')}</p>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
