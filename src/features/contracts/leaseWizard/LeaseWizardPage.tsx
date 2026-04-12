/**
 * Sprint 6A T14 — Routed page for the US lease wizard (owner-only; same as other contract flows).
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/constants';

import { LeaseWizard } from './LeaseWizard';

export function LeaseWizardPage() {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();

  return (
    <MainLayout title={t('leaseWizard.title')}>
      <PageContainer>
        <div className="mb-6">
          <PageHeader
            backTo={{
              href: ROUTES.CONTRACTS_RENT,
              label: t('leaseWizard.entry.backToContracts'),
            }}
          />
        </div>
        <LeaseWizard onCancel={() => navigate(ROUTES.CONTRACTS_RENT)} />
      </PageContainer>
    </MainLayout>
  );
}
