import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/constants';

import { LeaseDetailView } from './components/LeaseDetailView';

export function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.CONTRACTS_RENT, { replace: true });
    }
  }, [id, navigate]);

  if (!id) return null;

  return (
    <MainLayout title={t('leaseDetail.title')}>
      <PageContainer>
        <div className="mb-6">
          <PageHeader
            backTo={{ href: ROUTES.CONTRACTS_RENT, label: t('leaseDetail.backToContracts') }}
          />
        </div>
        <LeaseDetailView contractId={id} />
      </PageContainer>
    </MainLayout>
  );
}
