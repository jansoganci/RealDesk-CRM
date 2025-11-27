import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { ParsedData } from '../types/reviewFormTypes';

interface ReviewAlertsProps {
  parsedData: ParsedData;
}

/**
 * Review Alerts Component
 * Displays success and warning banners based on extraction results
 */
export function ReviewAlerts({ parsedData }: ReviewAlertsProps) {
  const { t } = useTranslation('contracts');

  // Count extracted fields
  const extractedCount = Object.keys(parsedData).length;

  return (
    <>
      {/* Success Banner */}
      {extractedCount > 0 && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">{t('import.alerts.extractedSuccess')}</AlertTitle>
          <AlertDescription className="text-green-800">
            {t('import.alerts.extractedDescription', { count: extractedCount })}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if few fields extracted */}
      {extractedCount < 3 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">{t('import.alerts.fewFieldsExtracted')}</AlertTitle>
          <AlertDescription className="text-yellow-800">
            {t('import.alerts.fewFieldsDescription')}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

