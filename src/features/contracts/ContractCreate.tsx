/**
 * Contract Create Page
 * Page wrapper for contract creation form
 */

import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContractCreateForm } from './components/ContractCreateForm';

export default function ContractCreate() {
  const { t } = useTranslation('contracts');

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t('create.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('create.subtitle')}
          </p>
        </div>
        <ContractCreateForm />
      </div>
    </PageContainer>
  );
}
