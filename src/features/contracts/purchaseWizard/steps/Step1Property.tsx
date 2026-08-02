/**
 * Sprint 6B T8 — Step 1: Property (type, address, parcel, land, other info, year built, timezone).
 */

import { useEffect, useRef, useState } from 'react';
import { useFormContext, type UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Home, Landmark, Layers, Building } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import {
  isSupportedDocumentState,
  SUPPORTED_DOCUMENT_STATE_SET,
} from '@/config/supportedDocumentStates';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { getPropertyTimezone, getTimezoneDisplayLabel } from '@/lib/propertyTimezone';
import { propertiesService, US_STATES } from '@/lib/serviceProxy';
import type { PropertyWithOwner } from '@/types';

const NONE_VALUE = '__none__';
// V1 SCOPE: Only CA/TX/FL/NY/AZ supported for document generation.
// Add new state codes to SUPPORTED_DOCUMENT_STATES (src/config/
// supportedDocumentStates.ts) as legal review expands coverage — no
// other change needed here once that list grows.
const SUPPORTED_DOCUMENT_STATE_OPTIONS = US_STATES.filter((state) =>
  SUPPORTED_DOCUMENT_STATE_SET.has(state.code),
);

const PURCHASE_PROPERTY_TYPE_OPTIONS: {
  value: PurchaseAgreementFormValues['property_type'];
  labelKey: string;
  Icon: typeof Home;
}[] = [
  { value: 'single_family', labelKey: 'singleFamily', Icon: Home },
  { value: 'condominium', labelKey: 'condominium', Icon: Building2 },
  { value: 'pud', labelKey: 'pud', Icon: Landmark },
  { value: 'duplex', labelKey: 'duplex', Icon: Building },
  { value: 'triplex', labelKey: 'triplex', Icon: Layers },
  { value: 'fourplex', labelKey: 'fourplex', Icon: Building },
  { value: 'other', labelKey: 'other', Icon: Building2 },
];

function mapDbTypeToPurchasePropertyType(
  dbType: string | null | undefined,
): PurchaseAgreementFormValues['property_type'] {
  if (!dbType?.trim()) return 'single_family';
  const s = dbType.toLowerCase();
  if (s.includes('condo')) return 'condominium';
  if (s.includes('pud') || s.includes('planned unit')) return 'pud';
  if (s.includes('duplex')) return 'duplex';
  if (s.includes('triplex')) return 'triplex';
  if (s.includes('fourplex') || s.includes('4-plex') || s.includes('four-plex')) return 'fourplex';
  return 'single_family';
}

function applyPurchasePropertyPrefill(
  p: PropertyWithOwner,
  setValue: UseFormSetValue<PurchaseAgreementFormValues>,
) {
  const street = (p.street_address?.trim() || p.address || '').trim();
  const stateRaw = (p.state || '').trim().toUpperCase();
  const state = stateRaw.length === 2 ? stateRaw : 'CA';
  const mappedType = mapDbTypeToPurchasePropertyType(p.type);

  setValue('linkedPropertyId', p.id);
  setValue('property_street', street.length >= 3 ? street : '100 Main Street');
  setValue('property_city', (p.city || '').trim() || 'Los Angeles');
  setValue('property_state', state);
  setValue('property_zip', (p.zip_code || '').trim() || '90210');
  setValue('year_built', p.year_built ?? null);
  setValue('property_timezone', getPropertyTimezone(state));
  setValue('property_type', mappedType);
  setValue('property_type_other', null);
  setValue('governing_law_state', state as PurchaseAgreementFormValues['governing_law_state']);
  if (mappedType === 'condominium') {
    setValue('mineral_rights_transferred', false);
  }
}

export function Step1Property() {
  const { t } = useTranslation('contracts');
  const form = useFormContext<PurchaseAgreementFormValues>();
  const { control, watch, setValue } = form;
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const queryPrefillApplied = useRef(false);

  const propertyState = watch('property_state');
  const propertyType = watch('property_type');
  const otherPropertyInfo = watch('other_property_info');
  const iana = watch('property_timezone');
  const showOtherPropertyDetails = otherPropertyInfo !== null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoadingProperties(true);
        const list = await propertiesService.getSaleProperties();
        if (!cancelled) setProperties(list);
      } catch {
        toast.error(t('purchaseWizard.step1.loadPropertiesError'));
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
    setValue('governing_law_state', propertyState as PurchaseAgreementFormValues['governing_law_state']);
  }, [propertyState, setValue]);

  useEffect(() => {
    if (propertyType === 'condominium') {
      setValue('mineral_rights_transferred', false);
    }
  }, [propertyType, setValue]);

  useEffect(() => {
    if (queryPrefillApplied.current) return;
    queryPrefillApplied.current = true;

    const propertyId = new URLSearchParams(window.location.search).get('propertyId');
    if (!propertyId) return;

    void (async () => {
      try {
        const p = await propertiesService.getById(propertyId);
        if (!p) return;
        if (p.property_type !== 'sale') {
          toast.error(t('purchaseWizard.step1.wrongPropertyType'));
          return;
        }
        if (!isSupportedDocumentState(p.state)) {
          toast.error(t('documentStateGuard.message'));
          return;
        }
        applyPurchasePropertyPrefill(p, setValue);
      } catch {
        toast.error(t('purchaseWizard.step1.loadPropertyError'));
      }
    })();
  }, [setValue, t]);

  const tzLabel = getTimezoneDisplayLabel(iana || 'America/New_York');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step1.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step1.description')}</p>
      </div>

      <FormField
        control={control}
        name="linkedPropertyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('purchaseWizard.step1.linkProperty')}</FormLabel>
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
                    if (!p) return;
                    if (p.property_type !== 'sale') {
                      toast.error(t('purchaseWizard.step1.wrongPropertyType'));
                      field.onChange(null);
                      return;
                    }
                    if (!isSupportedDocumentState(p.state)) {
                      field.onChange(null);
                      toast.error(t('documentStateGuard.message'));
                      return;
                    }
                    applyPurchasePropertyPrefill(p, setValue);
                  } catch {
                    toast.error(t('purchaseWizard.step1.loadPropertyError'));
                  }
                })();
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingProperties
                        ? t('purchaseWizard.step1.loadingProperties')
                        : t('purchaseWizard.step1.linkPropertyPlaceholder')
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('purchaseWizard.step1.noLinkedProperty')}</SelectItem>
                {properties.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    disabled={!isSupportedDocumentState(p.state)}
                  >
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
        name="property_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('purchaseWizard.step1.propertyType')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid gap-3 sm:grid-cols-2"
              >
                {PURCHASE_PROPERTY_TYPE_OPTIONS.map(({ value, labelKey, Icon }) => (
                  <div
                    key={value}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary dark:has-[[data-state=checked]]:bg-primary"
                  >
                    <RadioGroupItem value={value} id={`ppt-${value}`} className="shrink-0" />
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <Label htmlFor={`ppt-${value}`} className="font-normal leading-snug">
                      {t(`purchaseWizard.step1.propertyTypes.${labelKey}`)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {propertyType === 'other' && (
        <FormField
          control={control}
          name="property_type_other"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step1.propertyTypeOther')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {propertyType === 'condominium' && (
        <div className="rounded-lg border border-primary/30 bg-primary px-4 py-3 text-sm text-primary dark:border-primary/30 dark:bg-primary dark:text-primary">
          {t('purchaseWizard.step1.condoMineralBanner')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="property_street"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('purchaseWizard.step1.street')}</FormLabel>
              <FormControl>
                <Input autoComplete="street-address" {...field} />
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
              <FormLabel>{t('purchaseWizard.step1.city')}</FormLabel>
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
              <FormLabel>{t('purchaseWizard.step1.state')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchaseWizard.step1.statePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[280px]">
                  {SUPPORTED_DOCUMENT_STATE_OPTIONS.map((s) => (
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
              <FormLabel>{t('purchaseWizard.step1.zip')}</FormLabel>
              <FormControl>
                <Input autoComplete="postal-code" inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="tax_parcel_info"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('purchaseWizard.step1.taxParcel')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('purchaseWizard.step1.taxParcelHelp')}</p>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="other_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('purchaseWizard.step1.otherDescription')}</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="land_included"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('purchaseWizard.step1.landIncluded')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('purchaseWizard.step1.landIncludedHelp')}</p>
            <FormControl>
              <RadioGroup
                onValueChange={(v) => field.onChange(v === 'true')}
                value={field.value ? 'true' : 'false'}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="land-yes" />
                  <Label htmlFor="land-yes" className="font-normal">
                    {t('purchaseWizard.step1.yes')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="land-no" />
                  <Label htmlFor="land-no" className="font-normal">
                    {t('purchaseWizard.step1.no')}
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <FormLabel>{t('purchaseWizard.step1.otherPropertyInfoQuestion')}</FormLabel>
        <RadioGroup
          value={showOtherPropertyDetails ? 'yes' : 'no'}
          onValueChange={(v) => {
            if (v === 'no') {
              setValue('other_property_info', null);
            } else {
              setValue('other_property_info', '');
            }
          }}
          className="flex flex-wrap gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="opi-no" />
            <Label htmlFor="opi-no" className="font-normal">
              {t('purchaseWizard.step1.no')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="opi-yes" />
            <Label htmlFor="opi-yes" className="font-normal">
              {t('purchaseWizard.step1.yes')}
            </Label>
          </div>
        </RadioGroup>
        {showOtherPropertyDetails && (
          <FormField
            control={control}
            name="other_property_info"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder={t('purchaseWizard.step1.otherPropertyInfoPlaceholder')}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={control}
          name="year_built"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseWizard.step1.yearBuilt')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('purchaseWizard.step1.yearBuiltHelp')}</p>
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
      </div>

      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{t('purchaseWizard.step1.timezoneTitle')}</p>
        <p className="text-muted-foreground mt-1">
          {t('purchaseWizard.step1.timezoneReadonly', {
            iana: iana || '—',
            label: tzLabel,
          })}
        </p>
      </div>
    </div>
  );
}
