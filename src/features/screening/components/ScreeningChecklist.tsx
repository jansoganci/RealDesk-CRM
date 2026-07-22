import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { ApplicantScreening } from '@/lib/serviceProxy';

const CHECKLIST_FIELDS: Array<keyof Pick<
  ApplicantScreening,
  'background_check' | 'credit_check' | 'employment_verification' | 'landlord_reference' | 'income_verification'
>> = [
  'background_check',
  'credit_check',
  'employment_verification',
  'landlord_reference',
  'income_verification',
];

interface ScreeningChecklistProps {
  screening: ApplicantScreening;
  onToggle?: (field: string, value: boolean) => void;
  readonly?: boolean;
}

export const ScreeningChecklist = ({ screening, onToggle, readonly = false }: ScreeningChecklistProps) => {
  const { t } = useTranslation('screening');

  const completed = CHECKLIST_FIELDS.filter((f) => screening[f]).length;
  const total = CHECKLIST_FIELDS.length;
  const progressPct = Math.round((completed / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{t('checklist.title')}</span>
        <span className="text-xs text-slate-500">
          {t('checklist.progress', { completed, total })}
        </span>
      </div>
      <Progress value={progressPct} className="h-2" />
      <div className="space-y-3">
        {CHECKLIST_FIELDS.map((field) => (
          <div key={field} className="flex items-center gap-3">
            <Checkbox
              id={`checklist-${field}`}
              checked={screening[field]}
              disabled={readonly}
              onCheckedChange={
                readonly ? undefined : (checked) => onToggle?.(field, checked === true)
              }
            />
            <Label
              htmlFor={`checklist-${field}`}
              className="text-sm text-slate-700 cursor-pointer select-none"
            >
              {t(`checklist.${field}`)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
