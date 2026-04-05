import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { US_STATES } from '@/lib/serviceProxy';
import type { ReviewFormData, ParsedData } from '../types/reviewFormTypes';

interface PropertySectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  parsedData: ParsedData;
  onFieldUpdate: (field: keyof ReviewFormData, value: any) => void;
}

/**
 * Property Section Component (US Format)
 * Displays form fields for US property information
 */
export function PropertySection({ formData, fieldErrors, parsedData, onFieldUpdate }: PropertySectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('import.sections.property')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedData.propertyAddress && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>{t('import.foundAddress')}:</strong> {parsedData.propertyAddress}
            </AlertDescription>
          </Alert>
        )}

        {/* Street Address */}
        <div>
          <Label htmlFor="street_address">
            Street Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="street_address"
            value={formData.street_address}
            onChange={(e) => onFieldUpdate('street_address', e.target.value)}
            placeholder="123 Main Street"
            className={cn(fieldErrors.street_address && "border-red-500")}
          />
          {fieldErrors.street_address && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.street_address}</p>
          )}
        </div>

        {/* Unit/Apt */}
        <div>
          <Label htmlFor="unit">Unit/Apt</Label>
          <Input
            id="unit"
            value={formData.unit || ''}
            onChange={(e) => onFieldUpdate('unit', e.target.value)}
            placeholder="Apt 4B, Suite 200, etc."
          />
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onFieldUpdate('city', e.target.value)}
              placeholder="Austin"
              className={cn(fieldErrors.city && "border-red-500")}
            />
            {fieldErrors.city && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.city}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">
              State <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.state}
              onValueChange={(value) => onFieldUpdate('state', value)}
            >
              <SelectTrigger className={cn(fieldErrors.state && "border-red-500")}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.state && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.state}</p>
            )}
          </div>

          <div>
            <Label htmlFor="zip_code">
              ZIP Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => onFieldUpdate('zip_code', e.target.value)}
              placeholder="78701"
              maxLength={10}
              className={cn(fieldErrors.zip_code && "border-red-500")}
            />
            {fieldErrors.zip_code && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.zip_code}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
