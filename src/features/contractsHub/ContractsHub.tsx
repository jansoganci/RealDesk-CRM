/**
 * Contracts Hub Page
 * Card grid to navigate to different contract types (Rent, Sale, etc.)
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContractTypeCard } from './components/ContractTypeCard';
import { ROUTES } from '@/config/constants';
import { FileText, Home, DollarSign, Eye } from 'lucide-react';

export function ContractsHub() {
  const { t } = useTranslation(['contractsHub', 'common']);
  const navigate = useNavigate();

  return (
    <MainLayout title={t('title')}>
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rent Contracts */}
          <ContractTypeCard
            icon={FileText}
            title={t('cards.rent.title')}
            description={t('cards.rent.description')}
            badge={t('cards.rent.badge', { count: 0 })}
            onClick={() => navigate(ROUTES.CONTRACTS_RENT)}
            actionLabel={t('actions.view')}
          />

          {/* Sale Contracts */}
          <ContractTypeCard
            icon={Home}
            title={t('cards.sale.title')}
            description={t('cards.sale.description')}
            badge={t('cards.sale.badge', { count: 0 })}
            onClick={() => navigate(ROUTES.CONTRACTS_SALE)}
            actionLabel={t('actions.view')}
          />

          {/* Commission Contracts (Coming Soon) */}
          <ContractTypeCard
            icon={DollarSign}
            title={t('cards.commission.title')}
            description={t('cards.commission.description')}
            badge={t('cards.commission.badge')}
            disabled
            actionLabel={t('actions.comingSoon')}
          />

          {/* Showing Records (Coming Soon) */}
          <ContractTypeCard
            icon={Eye}
            title={t('cards.showing.title')}
            description={t('cards.showing.description')}
            badge={t('cards.showing.badge')}
            disabled
            actionLabel={t('actions.comingSoon')}
          />
        </div>
      </PageContainer>
    </MainLayout>
  );
}
