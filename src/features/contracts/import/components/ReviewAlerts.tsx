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
        <Alert className="mb-6 border-success/30 bg-success/15">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">{t('import.alerts.extractedSuccess')}</AlertTitle>
          <AlertDescription className="text-success">
            {t('import.alerts.extractedDescription', { count: extractedCount })}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if few fields extracted */}
      {extractedCount < 3 && (
        <Alert className="mb-6 border-warning/30 bg-warning/15">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning-foreground dark:text-warning">{t('import.alerts.fewFieldsExtracted')}</AlertTitle>
          <AlertDescription className="text-warning-foreground dark:text-warning">
            {t('import.alerts.fewFieldsDescription')}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
