/**
 * Sprint 6A T12 — Step 6: Furnishings, appliances, common areas, parking, move-in inspection.
 */

import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';

const ROOM_IDS = [
  'bathroom',
  'bedroom',
  'dining_room',
  'kitchen',
  'living_room',
  'other',
] as const;

const APPLIANCE_IDS = [
  'ceiling_fans',
  'dishwasher',
  'dryer',
  'garbage_disposal',
  'microwave',
  'refrigerator',
  'stove_oven',
  'washing_machine',
  'water_heater',
  'other',
] as const;

function toggleString(arr: string[] | null | undefined, id: string, on: boolean): string[] {
  const cur = arr ?? [];
  const s = new Set(cur);
  if (on) s.add(id);
  else s.delete(id);
  return [...s];
}

export function Step6PropertyDetails() {
  const { t } = useTranslation('contracts');
  const { control, watch, setValue, getValues } = useFormContext<LeaseAgreementFormValues>();

  const furnished = watch('furnished_enabled');
  const rooms = watch('furnished_rooms') ?? [];
  const appliancesOn = watch('appliances_enabled');
  const list = watch('appliances_list') ?? [];
  const commonOn = watch('common_areas_enabled');
  const parkingOn = watch('parking_enabled');

  const toggleRooms = (id: string, checked: boolean) => {
    const next = toggleString(getValues('furnished_rooms') ?? [], id, checked);
    setValue('furnished_rooms', next.length ? next : null, { shouldValidate: true, shouldDirty: true });
  };

  const toggleAppliance = (id: string, checked: boolean) => {
    const next = toggleString(getValues('appliances_list') ?? [], id, checked);
    setValue('appliances_list', next.length ? next : null, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('leaseWizard.step6.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('leaseWizard.step6.description')}</p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step6.furnishedSection')}</h4>
          <FormField
            control={control}
            name="furnished_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="furnished" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="furnished" className="text-sm font-normal">
                  {t('leaseWizard.step6.furnishedToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {furnished && (
          <div className="grid gap-2 sm:grid-cols-2">
            {ROOM_IDS.map((id) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox
                  id={`room-${id}`}
                  checked={rooms.includes(id)}
                  onCheckedChange={(c) => toggleRooms(id, c === true)}
                />
                <Label htmlFor={`room-${id}`} className="font-normal">
                  {t(`leaseWizard.step6.rooms.${id}`)}
                </Label>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step6.appliancesSection')}</h4>
          <FormField
            control={control}
            name="appliances_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="appliances" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="appliances" className="text-sm font-normal">
                  {t('leaseWizard.step6.appliancesToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {appliancesOn && (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {APPLIANCE_IDS.map((id) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`app-${id}`}
                    checked={list.includes(id)}
                    onCheckedChange={(c) => toggleAppliance(id, c === true)}
                  />
                  <Label htmlFor={`app-${id}`} className="font-normal leading-snug">
                    {t(`leaseWizard.step6.appliances.${id}`)}
                  </Label>
                </div>
              ))}
            </div>
            <FormField
              control={control}
              name="appliances_other"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leaseWizard.step6.appliancesOther')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-medium">{t('leaseWizard.step6.commonAreasSection')}</h4>
          <FormField
            control={control}
            name="common_areas_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="common" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="common" className="text-sm font-normal">
                  {t('leaseWizard.step6.commonAreasToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {commonOn && (
          <FormField
            control={control}
            name="common_areas_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('leaseWizard.step6.commonAreasDescription')}</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium">{t('leaseWizard.step6.parkingSection')}</h4>
            <p className="text-xs text-muted-foreground">{t('leaseWizard.step6.parkingHelp')}</p>
          </div>
          <FormField
            control={control}
            name="parking_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id="park" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="park" className="text-sm font-normal">
                  {t('leaseWizard.step6.parkingToggle')}
                </Label>
              </div>
            )}
          />
        </div>
        {parkingOn && (
          <FormField
            control={control}
            name="parking_spaces"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('leaseWizard.step6.parkingSpaces')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
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
        )}
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="text-sm font-medium">{t('leaseWizard.step6.inspectionSection')}</h4>
        <p className="text-xs text-muted-foreground">{t('leaseWizard.step6.inspectionHelp')}</p>
        <FormField
          control={control}
          name="move_in_inspection_required"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Switch id="inspection" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="inspection" className="text-sm font-normal">
                {t('leaseWizard.step6.inspectionToggle')}
              </Label>
            </div>
          )}
        />
      </section>
    </div>
  );
}
