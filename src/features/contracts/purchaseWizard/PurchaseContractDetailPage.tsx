/**
 * Sprint 6B T15 — Route shell for `/contracts/purchase/:id`.
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/constants';

import { PurchaseContractDetailView } from './PurchaseContractDetailView';

export function PurchaseContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.CONTRACTS_HUB, { replace: true });
    }
  }, [id, navigate]);

  if (!id) return null;

  return (
    <MainLayout title={t('purchaseContractDetail.title')}>
      <PageContainer>
        <div className="mb-6">
          <PageHeader backTo={{ href: ROUTES.CONTRACTS_HUB, label: t('purchaseContractDetail.backToHub') }} />
        </div>
        <PurchaseContractDetailView contractId={id} />
      </PageContainer>
    </MainLayout>
  );
}
