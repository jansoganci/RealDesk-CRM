import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ccpaService } from '@/lib/serviceProxy';
import { submitRequestSchema, type SubmitRequestFormValues, REQUEST_TYPES, RELATIONSHIP_TYPES } from '../schemas/ccpa.schema';

interface DataSubjectRequestFormProps {
  onSuccess?: () => void;
}

const STEPS = ['type', 'identity', 'details', 'confirm'] as const;

export function DataSubjectRequestForm({ onSuccess }: DataSubjectRequestFormProps) {
  const { t } = useTranslation('compliance');
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubmitRequestFormValues>({
    resolver: zodResolver(submitRequestSchema),
    defaultValues: {
      request_type: undefined,
      requester_name: '',
      requester_email: '',
      requester_phone: '',
      relationship_to_org: undefined,
      relationship_description: '',
      details: '',
    },
  });

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

  const selectedType = watch('request_type');

  const validateStep = async () => {
    if (step === 0) return trigger('request_type');
    if (step === 1) return trigger(['requester_name', 'requester_email', 'relationship_to_org']);
    return true;
  };

  const next = async () => {
    const valid = await validateStep();
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: SubmitRequestFormValues) => {
    setIsSubmitting(true);
    try {
      await ccpaService.submitRequest(values);
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('form.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <h3 className="text-lg font-semibold">{t('form.successTitle')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{t('form.successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold',
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              )}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={cn('h-px w-8', i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700')} />}
          </div>
        ))}
      </div>

      {/* Step 0 — Request Type */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{t('form.step1Title')}</h3>
          <div className="grid grid-cols-1 gap-3">
            {REQUEST_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('request_type', type, { shouldValidate: true })}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all',
                  selectedType === type
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                )}
              >
                <p className="font-semibold text-sm">{t(`requestTypes.${type}`)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t(`requestTypeDescriptions.${type}`)}</p>
              </button>
            ))}
          </div>
          {errors.request_type && (
            <p className="text-red-500 text-xs">{errors.request_type.message}</p>
          )}
        </div>
      )}

      {/* Step 1 — Identity */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{t('form.step2Title')}</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="requester_name">{t('form.name')} *</Label>
              <Input id="requester_name" {...register('requester_name')} className="mt-1" />
              {errors.requester_name && <p className="text-red-500 text-xs mt-1">{errors.requester_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="requester_email">{t('form.email')} *</Label>
              <Input id="requester_email" type="email" {...register('requester_email')} className="mt-1" />
              {errors.requester_email && <p className="text-red-500 text-xs mt-1">{errors.requester_email.message}</p>}
            </div>
            <div>
              <Label htmlFor="requester_phone">{t('form.phone')}</Label>
              <Input id="requester_phone" type="tel" {...register('requester_phone')} className="mt-1" />
            </div>
            <div>
              <Label>{t('form.relationship')} *</Label>
              <Select
                onValueChange={(val) => setValue('relationship_to_org', val as typeof RELATIONSHIP_TYPES[number], { shouldValidate: true })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('form.selectRelationship')} />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>{t(`relationships.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.relationship_to_org && <p className="text-red-500 text-xs mt-1">{errors.relationship_to_org.message}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{t('form.step3Title')}</h3>
          <div>
            <Label htmlFor="relationship_description">{t('form.relationshipDescription')}</Label>
            <Input id="relationship_description" {...register('relationship_description')} className="mt-1" placeholder={t('form.relationshipDescriptionPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="details">{t('form.details')}</Label>
            <Textarea id="details" {...register('details')} className="mt-1" rows={4} placeholder={t('form.detailsPlaceholder')} />
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{t('form.step4Title')}</h3>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4 space-y-2 text-sm">
            <p><span className="font-medium">{t('form.requestType')}:</span> {t(`requestTypes.${watch('request_type')}`)}</p>
            <p><span className="font-medium">{t('form.name')}:</span> {watch('requester_name')}</p>
            <p><span className="font-medium">{t('form.email')}:</span> {watch('requester_email')}</p>
            {watch('requester_phone') && <p><span className="font-medium">{t('form.phone')}:</span> {watch('requester_phone')}</p>}
            <p><span className="font-medium">{t('form.relationship')}:</span> {t(`relationships.${watch('relationship_to_org')}`)}</p>
            {watch('details') && <p><span className="font-medium">{t('form.details')}:</span> {watch('details')}</p>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('form.confirmNotice')}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={prev}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {t('form.back')}
          </Button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            {t('form.next')} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? t('form.submitting') : t('form.submit')}
          </Button>
        )}
      </div>
    </form>
  );
}
