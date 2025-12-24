import { useTranslation } from 'react-i18next';
import type { Contract } from '../../../types';

/**
 * Contract Status Info Component
 * Displays information about the primary contract or a message if no contract exists
 */

interface ContractStatusInfoProps {
  primaryContract: Contract | null;
}

export function ContractStatusInfo({ primaryContract }: ContractStatusInfoProps) {
  const { t } = useTranslation('tenants');

  if (primaryContract) {
    const dateRange =
      primaryContract.start_date && primaryContract.end_date
        ? t('edit.contractDateRange', {
          start: primaryContract.start_date,
          end: primaryContract.end_date,
        })
        : '';

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <strong>{t('edit.contractStatusLabel')}</strong>{' '}
          {t('edit.contractStatusText', { status: primaryContract.status })}
          {dateRange ? ` ${dateRange}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p className="text-sm text-yellow-700">
        <strong>{t('edit.noContractLabel')}</strong> {t('edit.noContractDescription')}
      </p>
    </div>
  );
}
