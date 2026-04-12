/**
 * Sprint 6A T10 — Step 2: Landlord, tenants, additional occupants, co-signer / guarantor.
 */

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import {
  formatPhoneForDisplay,
  leadsService,
  normalizePhone,
  ownersService,
  tenantsService,
} from '@/lib/serviceProxy';
import type { PropertyOwner, TenantWithProperty } from '@/types';

const NONE = '__none__';

export function Step2Parties() {
  const { t } = useTranslation('contracts');
  const form = useFormContext<LeaseAgreementFormValues>();
  const { control, watch, setValue } = form;

  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [tenants, setTenants] = useState<TenantWithProperty[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const tenant2Name = watch('tenant_name_2');
  const coSignerName = watch('co_signer_name');
  const coSignerPhone = watch('co_signer_phone');
  const additionalOccupants = watch('additional_occupants') ?? [];

  const [tenant2Open, setTenant2Open] = useState(false);
  const [coSignerOpen, setCoSignerOpen] = useState(false);
  const leadPrefillApplied = useRef(false);

  useEffect(() => {
    if (tenant2Name?.trim().length) setTenant2Open(true);
  }, [tenant2Name]);

  useEffect(() => {
    if (coSignerName?.trim().length || coSignerPhone?.trim().length) setCoSignerOpen(true);
  }, [coSignerName, coSignerPhone]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoadingOwners(true);
        const data = await ownersService.getAll();
        if (!c) setOwners(data);
      } catch {
        toast.error(t('leaseWizard.step2.loadOwnersError'));
      } finally {
        if (!c) setLoadingOwners(false);
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
        setValue('tenant_name', lead.name || '');
        setValue('tenant_phone', lead.phone || '');
        setValue('tenant_email', lead.email || '');
      } catch {
        toast.error(t('leaseWizard.step2.loadTenantError'));
      }
    })();
  }, [setValue, t]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoadingTenants(true);
        const data = await tenantsService.getAll();
        if (!c) setTenants(data);
      } catch {
        toast.error(t('leaseWizard.step2.loadTenantsError'));
      } finally {
        if (!c) setLoadingTenants(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [t]);

  const clearTenant2 = () => {
    setValue('linkedTenant2Id', null);
    setValue('tenant_name_2', null);
    setValue('tenant_phone_2', '');
    setValue('tenant_email_2', '');
  };

  const clearCoSigner = () => {
    setValue('co_signer_name', null);
    setValue('co_signer_phone', '');
    setValue('co_signer_email', '');
    setValue('co_signer_role', null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step2.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step2.description')}</p>
      </div>

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('leaseWizard.step2.landlordSection')}</h4>
        <FormField
          control={control}
          name="linkedLandlordOwnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step2.linkOwner')}</FormLabel>
              <Select
                disabled={loadingOwners}
                value={field.value ?? NONE}
                onValueChange={(v) => {
                  void (async () => {
                    if (v === NONE) {
                      field.onChange(null);
                      return;
                    }
                    field.onChange(v);
                    try {
                      const o = await ownersService.getById(v);
                      if (!o) return;
                      setValue('landlord_name', o.name);
                      setValue('landlord_phone', o.phone ? formatPhoneForDisplay(normalizePhone(o.phone)) : '');
                      setValue('landlord_email', o.email ?? '');
                      setValue('landlord_mailing_street', o.address?.trim() || null);
                      setValue('landlord_mailing_city', null);
                      setValue('landlord_mailing_state', null);
                      setValue('landlord_mailing_zip', null);
                    } catch {
                      toast.error(t('leaseWizard.step2.loadOwnerError'));
                    }
                  })();
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingOwners
                          ? t('leaseWizard.step2.loadingOwners')
                          : t('leaseWizard.step2.linkOwnerPlaceholder')
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>{t('leaseWizard.step2.noLinkedOwner')}</SelectItem>
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
            name="landlord_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('leaseWizard.step2.landlordName')}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="landlord_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.landlordPhone')}</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="tel" autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="landlord_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.landlordEmail')}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{t('leaseWizard.step2.landlordMailing')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="landlord_mailing_street"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('leaseWizard.step2.mailingStreet')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="landlord_mailing_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.mailingCity')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="landlord_mailing_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.mailingState')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} maxLength={2} className="uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="landlord_mailing_zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.mailingZip')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-medium">{t('leaseWizard.step2.tenant1Section')}</h4>
        <FormField
          control={control}
          name="linkedTenant1Id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step2.linkTenant')}</FormLabel>
              <Select
                disabled={loadingTenants}
                value={field.value ?? NONE}
                onValueChange={(v) => {
                  void (async () => {
                    if (v === NONE) {
                      field.onChange(null);
                      return;
                    }
                    field.onChange(v);
                    try {
                      const tenant = await tenantsService.getById(v);
                      if (!tenant) return;
                      setValue('tenant_name', tenant.name);
                      setValue(
                        'tenant_phone',
                        tenant.phone ? formatPhoneForDisplay(normalizePhone(tenant.phone)) : '',
                      );
                      setValue('tenant_email', tenant.email ?? '');
                    } catch {
                      toast.error(t('leaseWizard.step2.loadTenantError'));
                    }
                  })();
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingTenants
                          ? t('leaseWizard.step2.loadingTenants')
                          : t('leaseWizard.step2.linkTenantPlaceholder')
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>{t('leaseWizard.step2.noLinkedTenant')}</SelectItem>
                  {tenants.map((tn) => (
                    <SelectItem key={tn.id} value={tn.id}>
                      {tn.name}
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
            name="tenant_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('leaseWizard.step2.tenantName')}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="tenant_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.tenantPhone')}</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="tel" autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="tenant_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step2.tenantEmail')}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium">{t('leaseWizard.step2.tenant2Section')}</h4>
            <p className="text-xs text-muted-foreground">{t('leaseWizard.step2.tenant2Helper')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="tenant2-switch"
              checked={tenant2Open}
              onCheckedChange={(on) => {
                setTenant2Open(on);
                if (!on) clearTenant2();
              }}
            />
            <Label htmlFor="tenant2-switch" className="text-sm font-normal">
              {t('leaseWizard.step2.addTenant2')}
            </Label>
          </div>
        </div>
        {tenant2Open && (
          <>
            <FormField
              control={control}
              name="linkedTenant2Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step2.linkTenant2')}</FormLabel>
                  <Select
                    disabled={loadingTenants}
                    value={field.value ?? NONE}
                    onValueChange={(v) => {
                      void (async () => {
                        if (v === NONE) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(v);
                        try {
                          const tenant = await tenantsService.getById(v);
                          if (!tenant) return;
                          setValue('tenant_name_2', tenant.name);
                          setValue(
                            'tenant_phone_2',
                            tenant.phone ? formatPhoneForDisplay(normalizePhone(tenant.phone)) : '',
                          );
                          setValue('tenant_email_2', tenant.email ?? '');
                        } catch {
                          toast.error(t('leaseWizard.step2.loadTenantError'));
                        }
                      })();
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('leaseWizard.step2.linkTenant2Placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('leaseWizard.step2.noLinkedTenant')}</SelectItem>
                      {tenants.map((tn) => (
                        <SelectItem key={tn.id} value={tn.id}>
                          {tn.name}
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
                name="tenant_name_2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('leaseWizard.step2.tenant2Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="tenant_phone_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leaseWizard.step2.tenant2Phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="tel" autoComplete="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="tenant_email_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leaseWizard.step2.tenant2Email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="text-sm font-medium">{t('leaseWizard.step2.occupantsSection')}</h4>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step2.occupantsHelper')}</p>
        <div className="space-y-2">
          {additionalOccupants.map((_, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={additionalOccupants[index] ?? ''}
                onChange={(e) => {
                  const next = [...additionalOccupants];
                  next[index] = e.target.value;
                  setValue('additional_occupants', next);
                }}
                placeholder={t('leaseWizard.step2.occupantPlaceholder')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  const next = additionalOccupants.filter((_, i) => i !== index);
                  setValue('additional_occupants', next);
                }}
                aria-label={t('leaseWizard.step2.removeOccupant')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => setValue('additional_occupants', [...additionalOccupants, ''])}
          >
            <Plus className="h-4 w-4" />
            {t('leaseWizard.step2.addOccupant')}
          </Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium">{t('leaseWizard.step2.coSignerSection')}</h4>
            <p className="text-xs text-muted-foreground">{t('leaseWizard.step2.coSignerHelper')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="cosigner-switch"
              checked={coSignerOpen}
              onCheckedChange={(on) => {
                setCoSignerOpen(on);
                if (!on) clearCoSigner();
              }}
            />
            <Label htmlFor="cosigner-switch" className="text-sm font-normal">
              {t('leaseWizard.step2.addCoSigner')}
            </Label>
          </div>
        </div>
        {coSignerOpen && (
          <>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {t('leaseWizard.step2.coSignerRoleBanner')}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="co_signer_name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('leaseWizard.step2.coSignerName')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="co_signer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leaseWizard.step2.coSignerPhone')}</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="tel" autoComplete="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="co_signer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leaseWizard.step2.coSignerEmail')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="co_signer_role"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 space-y-3">
                    <FormLabel>{t('leaseWizard.step2.coSignerRole')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="co_signer" id="role-cosigner" />
                          <Label htmlFor="role-cosigner" className="font-normal">
                            {t('leaseWizard.step2.roles.coSigner')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="guarantor" id="role-guarantor" />
                          <Label htmlFor="role-guarantor" className="font-normal">
                            {t('leaseWizard.step2.roles.guarantor')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
