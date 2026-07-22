/**
 * Sprint 6B — Step 5: Financing path and conditional terms.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { COLORS } from '@/config/colors';
import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

type TimeName =
  | 'all_cash_proof_deadline_time'
  | 'closing_time'
  | 'inspection_contractor_deadline_time'
  | 'inspection_disclosures_deadline_time';

function fromStoredTime(v: string | null | undefined): { time: string; meridiem: 'AM' | 'PM' } {
  const raw = (v ?? '').trim();
  if (!raw) return { time: '', meridiem: 'PM' };
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    const hour = Number(m[1]);
    const minute = m[2];
    const meridiem = m[3].toUpperCase() as 'AM' | 'PM';
    const hh24 = meridiem === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return { time: `${String(hh24).padStart(2, '0')}:${minute}`, meridiem };
  }
  const m24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hh = Number(m24[1]);
    const minute = m24[2];
    const meridiem: 'AM' | 'PM' = hh >= 12 ? 'PM' : 'AM';
    return { time: `${String(hh).padStart(2, '0')}:${minute}`, meridiem };
  }
  return { time: '', meridiem: 'PM' };
}

function toStoredTime(time24: string, meridiem: 'AM' | 'PM'): string {
  if (!time24) return '';
  const [hhRaw, mm] = time24.split(':');
  const hh = Number(hhRaw);
  if (Number.isNaN(hh) || !mm) return '';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${meridiem}`;
}

function TimeWithMeridiemField({
  name,
  label,
  amPmLabel,
}: {
  name: TimeName;
  label: string;
  amPmLabel: string;
}) {
  const { control, getValues, setValue } = useFormContext<PurchaseAgreementFormValues>();
  const current = fromStoredTime(getValues(name));

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex gap-2">
              <Input
                type="time"
                value={current.time}
                onChange={(e) => {
                  const nextTime = e.target.value;
                  const next = toStoredTime(nextTime, current.meridiem);
                  field.onChange(next || null);
                }}
              />
              <select
                aria-label={amPmLabel}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={current.meridiem}
                onChange={(e) => {
                  const nextMeridiem = e.target.value as 'AM' | 'PM';
                  const next = toStoredTime(current.time, nextMeridiem);
                  setValue(name, next || null, { shouldValidate: true, shouldDirty: true });
                }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const BANK_FIELDS: (keyof PurchaseAgreementFormValues)[] = [
  'bank_loan_type',
  'bank_preapproval_letter_date',
  'bank_seller_notification_days',
  'bank_contingent_on_sale',
  'bank_loan_type_other',
];

const SELLER_FIELDS: (keyof PurchaseAgreementFormValues)[] = [
  'seller_financing_loan_amount',
  'seller_financing_down_payment',
  'seller_financing_interest_rate',
  'seller_financing_term_value',
  'seller_financing_term_unit',
  'seller_financing_doc_deadline',
  'seller_financing_approval_deadline',
];

const CASH_FIELDS: (keyof PurchaseAgreementFormValues)[] = [
  'all_cash_proof_deadline_date',
  'all_cash_proof_deadline_time',
];

export function Step5Financing() {
  const { t } = useTranslation('contracts');
  const { control, watch, resetField, setValue, getValues } = useFormContext<PurchaseAgreementFormValues>();
  const financingType = watch('financing_type');
  const bankLoanType = watch('bank_loan_type');
  const prevType = useRef(financingType);

  useEffect(() => {
    const previous = prevType.current;
    if (!previous || previous === financingType) return;

    if (financingType === 'all_cash') {
      BANK_FIELDS.forEach((f) => resetField(f));
      SELLER_FIELDS.forEach((f) => resetField(f));
      setValue('bank_contingent_on_sale', false, { shouldDirty: true });
    } else if (financingType === 'bank_financing') {
      CASH_FIELDS.forEach((f) => resetField(f));
      SELLER_FIELDS.forEach((f) => resetField(f));
    } else if (financingType === 'seller_financing') {
      CASH_FIELDS.forEach((f) => resetField(f));
      BANK_FIELDS.forEach((f) => resetField(f));
      setValue('bank_contingent_on_sale', false, { shouldDirty: true });
    }
  }, [financingType, resetField, setValue]);

  useEffect(() => {
    prevType.current = financingType;
  }, [financingType]);

  useEffect(() => {
    if (financingType === 'bank_financing') {
      const days = getValues('bank_seller_notification_days');
      if (days == null) {
        setValue('bank_seller_notification_days', 10, { shouldDirty: true });
      }
    }
  }, [financingType, setValue, getValues]);

  const showContingentSaleFields = watch('bank_contingent_on_sale') || watch('contingent_on_other_property');
  const bankWarningClass = `${COLORS.warning.border} ${COLORS.warning.bgLight} ${COLORS.warning.textDarker}`;
  const sellerTermUnit = watch('seller_financing_term_unit');

  const financingRowId = useMemo(
    () => ({
      allCash: 'financing-all-cash',
      bank: 'financing-bank',
      seller: 'financing-seller',
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('purchaseWizard.step5.heading')}</h3>
        <p className="text-sm text-muted-foreground">{t('purchaseWizard.step5.description')}</p>
      </div>

      <FormField
        control={control}
        name="financing_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{t('purchaseWizard.step5.financingType')}</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                }}
                className="grid gap-3 md:grid-cols-3"
              >
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all_cash" id={financingRowId.allCash} />
                    <Label htmlFor={financingRowId.allCash}>{t('purchaseWizard.step5.financingTypes.allCash')}</Label>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="bank_financing" id={financingRowId.bank} />
                    <Label htmlFor={financingRowId.bank}>{t('purchaseWizard.step5.financingTypes.bank')}</Label>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="seller_financing" id={financingRowId.seller} />
                    <Label htmlFor={financingRowId.seller}>{t('purchaseWizard.step5.financingTypes.seller')}</Label>
                  </div>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {financingType === 'all_cash' && (
        <section className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">{t('purchaseWizard.step5.allCash.section')}</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="all_cash_proof_deadline_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.allCash.proofDeadlineDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TimeWithMeridiemField
              name="all_cash_proof_deadline_time"
              label={t('purchaseWizard.step5.allCash.proofDeadlineTime')}
              amPmLabel={t('purchaseWizard.step5.allCash.amPm')}
            />
          </div>
          <Alert className={`${COLORS.info.bgLight} ${COLORS.border.color}`}>
            <Info className={`h-4 w-4 ${COLORS.info.text}`} />
            <AlertDescription>{t('purchaseWizard.step5.allCash.sellerRejectWindow')}</AlertDescription>
          </Alert>
        </section>
      )}

      {financingType === 'bank_financing' && (
        <section className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">{t('purchaseWizard.step5.bank.section')}</h4>
          <FormField
            control={control}
            name="bank_loan_type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('purchaseWizard.step5.bank.loanType')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="conventional" id="loan-conventional" />
                      <Label htmlFor="loan-conventional">{t('purchaseWizard.step5.bank.loanTypes.conventional')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="fha" id="loan-fha" />
                      <Label htmlFor="loan-fha">{t('purchaseWizard.step5.bank.loanTypes.fha')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="va" id="loan-va" />
                      <Label htmlFor="loan-va">{t('purchaseWizard.step5.bank.loanTypes.va')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="other" id="loan-other" />
                      <Label htmlFor="loan-other">{t('purchaseWizard.step5.bank.loanTypes.other')}</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {bankLoanType === 'other' && (
            <FormField
              control={control}
              name="bank_loan_type_other"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.bank.loanTypeOther')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {bankLoanType === 'fha' && (
            <Alert className={bankWarningClass}>
              <AlertTriangle className={`h-4 w-4 ${COLORS.warning.text}`} />
              <AlertTitle>{t('purchaseWizard.step5.bank.fhaWarningTitle')}</AlertTitle>
              <AlertDescription>{t('purchaseWizard.step5.bank.fhaWarningBody')}</AlertDescription>
            </Alert>
          )}

          {bankLoanType === 'va' && (
            <Alert className={bankWarningClass}>
              <AlertTriangle className={`h-4 w-4 ${COLORS.warning.text}`} />
              <AlertTitle>{t('purchaseWizard.step5.bank.vaWarningTitle')}</AlertTitle>
              <AlertDescription>{t('purchaseWizard.step5.bank.vaWarningBody')}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="bank_preapproval_letter_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.bank.preapprovalDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="bank_seller_notification_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.bank.sellerTerminationDays')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={field.value === null || field.value === undefined ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="bank_contingent_on_sale"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
                <FormLabel className="m-0">{t('purchaseWizard.step5.bank.contingentOnSale')}</FormLabel>
                <FormControl>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {showContingentSaleFields && (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={control}
                name="contingent_property_address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('purchaseWizard.step5.bank.contingentAddress')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="contingent_property_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchaseWizard.step5.bank.contingentDays')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={field.value === null || field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </section>
      )}

      {financingType === 'seller_financing' && (
        <section className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">{t('purchaseWizard.step5.seller.section')}</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="seller_financing_loan_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.seller.loanAmount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={field.value === null || field.value === undefined ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="seller_financing_down_payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.seller.downPayment')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={field.value === null || field.value === undefined ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="seller_financing_interest_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.seller.interestRate')}</FormLabel>
                  <p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step5.seller.rateTooltip')}</p>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.001}
                      value={field.value === null || field.value === undefined ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="seller_financing_term_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.seller.loanTerm')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={field.value === null || field.value === undefined ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="seller_financing_term_unit"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('purchaseWizard.step5.seller.loanTermUnit')}</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="months" id="seller-months" />
                      <Label htmlFor="seller-months">{t('purchaseWizard.step5.seller.loanTermUnits.months')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="years" id="seller-years" />
                      <Label htmlFor="seller-years">{t('purchaseWizard.step5.seller.loanTermUnits.years')}</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
                {sellerTermUnit && <p className={`text-xs ${COLORS.muted.text}`}>{sellerTermUnit.toUpperCase()}</p>}
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="seller_financing_doc_deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.seller.docDeadline')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="seller_financing_approval_deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchaseWizard.step5.seller.approvalDeadline')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>
      )}
    </div>
  );
}

