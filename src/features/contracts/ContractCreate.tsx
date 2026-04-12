/**
 * Contract Create Page
 * Page wrapper for contract creation form
 * T16 — Org owners get a shortcut to the US lease wizard (same guard as `/contracts/rent/lease-wizard`).
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/constants';
import { useOrg } from '@/contexts/OrgContext';
import { ContractCreateForm } from './components/ContractCreateForm';

export default function ContractCreate() {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();
  const { isOwner, loading: orgLoading } = useOrg();

  return (
    <MainLayout title={t('create.title')}>
      <PageContainer>
        <div className="w-full">
          <div className="mb-6">
            <PageHeader
              backTo={{ href: ROUTES.CONTRACTS_RENT, label: t('edit.backToList') }}
              actions={
                !orgLoading && isOwner ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(ROUTES.CONTRACTS_LEASE_NEW)}
                  >
                    {t('leaseWizard.entry.openWizard')}
                  </Button>
                ) : undefined
              }
            />
          </div>
          <ContractCreateForm />
        </div>
      </PageContainer>
    </MainLayout>
  );
}
