import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReviewFormData } from '../types/reviewFormTypes';

interface ContractSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldUpdate: (field: keyof ReviewFormData, value: any) => void;
}

/**
 * Contract Section Component
 * Displays form fields for contract details
 */
export function ContractSection({ formData, fieldErrors, onFieldUpdate }: ContractSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📋 Sözleşme Detayları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">
              Başlangıç Tarihi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => onFieldUpdate('start_date', e.target.value)}
              className={cn(fieldErrors.start_date && "border-red-500")}
            />
            {fieldErrors.start_date && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.start_date}</p>
            )}
          </div>

          <div>
            <Label htmlFor="end_date">
              Bitiş Tarihi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => onFieldUpdate('end_date', e.target.value)}
              className={cn(fieldErrors.end_date && "border-red-500")}
            />
            {fieldErrors.end_date && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rent_amount">
              Kira Bedeli (₺) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rent_amount"
              type="number"
              value={formData.rent_amount}
              onChange={(e) => onFieldUpdate('rent_amount', parseFloat(e.target.value))}
              placeholder="15000"
              className={cn(fieldErrors.rent_amount && "border-red-500")}
            />
            {fieldErrors.rent_amount && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.rent_amount}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deposit">Depozito (₺)</Label>
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
          <Label htmlFor="special_conditions">Özel Şartlar</Label>
          <Textarea
            id="special_conditions"
            value={formData.special_conditions}
            onChange={(e) => onFieldUpdate('special_conditions', e.target.value)}
            placeholder="Sözleşmeye eklenecek özel şartlar..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

