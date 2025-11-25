import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

/**
 * Profile Success Alert Component
 * Displays a success message when profile is saved successfully
 */

interface ProfileSuccessAlertProps {
  show: boolean;
}

export function ProfileSuccessAlert({ show }: ProfileSuccessAlertProps) {
  const { t } = useTranslation('profile');

  if (!show) return null;

  return (
    <Alert className="mb-4 bg-green-50 border-green-200">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        {t('profile:messages.saveSuccess')}
      </AlertDescription>
    </Alert>
  );
}

