/**
 * Contract Create Page
 * Page wrapper for contract creation form
 */

import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/constants';
import { ContractCreateForm } from './components/ContractCreateForm';

export default function ContractCreate() {
  const { t } = useTranslation('contracts');

  return (
    <MainLayout title={t('create.title')}>
      <PageContainer>
        <div className="w-full">
          <div className="mb-6">
            <PageHeader
              backTo={{ href: ROUTES.CONTRACTS_RENT, label: t('edit.backToList') }}
            />
          </div>
          <ContractCreateForm />
        </div>
      </PageContainer>
    </MainLayout>
  );
}
