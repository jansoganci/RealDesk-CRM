/**
 * Sprint 6B T7 — Routed page for the US purchase agreement wizard (owner-only).
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/constants';

import { PurchaseWizard } from './PurchaseWizard';

export function PurchaseWizardPage() {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();

  return (
    <MainLayout title={t('purchaseWizard.title')}>
      <PageContainer className="space-y-4">
        <PageHeader
          backTo={{
            href: ROUTES.CONTRACTS_HUB,
            label: t('purchaseWizard.entry.backToHub'),
          }}
        />
        <PurchaseWizard onCancel={() => navigate(ROUTES.CONTRACTS_HUB)} />
      </PageContainer>
    </MainLayout>
  );
}
