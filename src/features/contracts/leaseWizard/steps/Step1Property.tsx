/**
 * Sprint 6A T10 — Step 1: Property (residence type, address, year built, timezone display).
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
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import { getPropertyTimezone, getTimezoneDisplayLabel } from '@/lib/propertyTimezone';
import { propertiesService, US_STATES } from '@/lib/serviceProxy';
import type { PropertyWithOwner } from '@/types';

const NONE_VALUE = '__none__';

function applyPropertyPrefill(p: PropertyWithOwner, setValue: UseFormSetValue<LeaseAgreementFormValues>) {
  const street = (p.street_address?.trim() || p.address || '').trim();
  const stateRaw = (p.state || '').trim().toUpperCase();
  const state = stateRaw.length === 2 ? stateRaw : 'CA';
  setValue('linkedPropertyId', p.id);
  setValue('property_street', street.length >= 3 ? street : '100 Main Street');
  setValue('property_unit', p.unit?.trim() || null);
  setValue('property_city', (p.city || '').trim() || 'Los Angeles');
  setValue('property_state', state);
  setValue('property_zip', (p.zip_code || '').trim() || '90210');
  setValue('year_built', p.year_built ?? null);
  setValue('property_timezone', getPropertyTimezone(state));
}

export function Step1Property() {
  const { t } = useTranslation('contracts');
  const form = useFormContext<LeaseAgreementFormValues>();
  const { control, watch, setValue } = form;
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const queryPrefillApplied = useRef(false);

  const propertyState = watch('property_state');
  const residenceType = watch('residence_type');
  const iana = watch('property_timezone');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingProperties(true);
        const list = await propertiesService.getRentalProperties();
        if (!cancelled) setProperties(list);
      } catch {
        toast.error(t('leaseWizard.step1.loadPropertiesError'));
      } finally {
        if (!cancelled) setLoadingProperties(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    setValue('property_timezone', getPropertyTimezone(propertyState));
  }, [propertyState, setValue]);

  useEffect(() => {
    if (queryPrefillApplied.current) return;
    queryPrefillApplied.current = true;

    const propertyId = new URLSearchParams(window.location.search).get('propertyId');
    if (!propertyId) return;

    void (async () => {
      try {
        const p = await propertiesService.getById(propertyId);
        if (!p) return;
        applyPropertyPrefill(p, setValue);
      } catch {
        toast.error(t('leaseWizard.step1.loadPropertyError'));
      }
    })();
  }, [setValue, t]);

  const tzLabel = getTimezoneDisplayLabel(iana || 'America/New_York');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step1.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step1.description')}</p>
      </div>

      <FormField
        control={control}
        name="linkedPropertyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('leaseWizard.step1.linkProperty')}</FormLabel>
            <Select
              disabled={loadingProperties}
              value={field.value ?? NONE_VALUE}
              onValueChange={(v) => {
                void (async () => {
                  if (v === NONE_VALUE) {
                    field.onChange(null);
                    return;
                  }
                  field.onChange(v);
                  try {
                    const p = await propertiesService.getById(v);
                    if (p) applyPropertyPrefill(p, setValue);
                  } catch {
                    toast.error(t('leaseWizard.step1.loadPropertyError'));
                  }
                })();
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingProperties
                        ? t('leaseWizard.step1.loadingProperties')
                        : t('leaseWizard.step1.linkPropertyPlaceholder')
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('leaseWizard.step1.noLinkedProperty')}</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-medium">{p.address}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {p.city}
                      {p.state ? `, ${p.state}` : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={control}
        name="residence_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('leaseWizard.step1.residenceType')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid gap-3 md:grid-cols-2"
              >
                {(
                  [
                    ['apartment', t('leaseWizard.step1.residenceTypes.apartment')],
                    ['house', t('leaseWizard.step1.residenceTypes.house')],
                    ['condo', t('leaseWizard.step1.residenceTypes.condo')],
                    ['other', t('leaseWizard.step1.residenceTypes.other')],
                  ] as const
                ).map(([val, label]) => (
                  <div key={val} className="flex items-center space-x-2">
                    <RadioGroupItem value={val} id={`res-${val}`} />
                    <Label htmlFor={`res-${val}`} className="font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {residenceType === 'other' && (
        <FormField
          control={control}
          name="residence_type_other"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.residenceTypeOther')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Desktop: paired columns (Street|Unit, City|State, ZIP|Year built, Beds|Baths). Mobile: single column */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <FormField
          control={control}
          name="property_street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.street')}</FormLabel>
              <FormControl>
                <Input autoComplete="street-address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="property_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.unit')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="property_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.city')}</FormLabel>
              <FormControl>
                <Input autoComplete="address-level2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="property_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.state')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('leaseWizard.step1.statePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[280px]">
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
          name="property_zip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.zip')}</FormLabel>
              <FormControl>
                <Input autoComplete="postal-code" inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="year_built"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.yearBuilt')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('leaseWizard.step1.yearBuiltHelp')}</p>
              <FormControl>
                <Input
                  type="number"
                  min={1600}
                  max={2100}
                  inputMode="numeric"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === '' ? null : Number(v));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.bedrooms')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={0.5}
                  min={0.5}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leaseWizard.step1.bathrooms')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={0.5}
                  min={0.5}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{t('leaseWizard.step1.timezoneTitle')}</p>
        <p className="text-muted-foreground mt-1">
          {t('leaseWizard.step1.timezoneReadonly', {
            iana: iana || '—',
            label: tzLabel,
          })}
        </p>
      </div>
    </div>
  );
}
