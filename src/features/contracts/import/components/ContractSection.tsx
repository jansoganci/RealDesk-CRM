import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FixturesSelector } from '../../components/FixturesSelector';
import type { ReviewFormData, ReviewFormFieldValue } from '../types/reviewFormTypes';

interface ContractSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldUpdate: (field: keyof ReviewFormData, value: ReviewFormFieldValue) => void;
}

/**
 * Contract Section Component
 * Displays form fields for contract details
 */
export function ContractSection({ formData, fieldErrors, onFieldUpdate }: ContractSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('import.sections.contract')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">
              {t('create.fields.start_date')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => onFieldUpdate('start_date', e.target.value)}
              className={cn(fieldErrors.start_date && "border-destructive")}
            />
            {fieldErrors.start_date && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.start_date}</p>
            )}
          </div>

          <div>
            <Label htmlFor="end_date">
              {t('create.fields.end_date')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => onFieldUpdate('end_date', e.target.value)}
              className={cn(fieldErrors.end_date && "border-destructive")}
            />
            {fieldErrors.end_date && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rent_amount">
              {t('create.fields.rent_amount')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rent_amount"
              type="number"
              value={formData.rent_amount}
              onChange={(e) => onFieldUpdate('rent_amount', parseFloat(e.target.value))}
              placeholder="15000"
              className={cn(fieldErrors.rent_amount && "border-destructive")}
            />
            {fieldErrors.rent_amount && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.rent_amount}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deposit">{t('create.fields.deposit')}</Label>
            <Input
              id="deposit"
              type="number"
              value={formData.deposit}
              onChange={(e) => onFieldUpdate('deposit', parseFloat(e.target.value))}
              placeholder="30000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="fixtures-selector">{t('create.fields.fixtures')}</Label>
          <FixturesSelector
            value={formData.special_conditions || ''}
            onChange={(value: string) => onFieldUpdate('special_conditions', value)}
            error={fieldErrors.special_conditions}
            isPainted={formData.is_painted}
            onPaintedChange={(value: boolean) => onFieldUpdate('is_painted', value)}
            paintedError={fieldErrors.is_painted}
          />
        </div>
      </CardContent>
    </Card>
  );
}

