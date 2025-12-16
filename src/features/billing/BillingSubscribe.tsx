import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import PricingSection from './components/PricingSection';

export const BillingSubscribe = () => {
  const { t } = useTranslation('billing');

  return (
    <MainLayout title={t('paywall.pageTitle')}>
      <PageContainer>
        <PricingSection showHeader={true} />
      </PageContainer>
    </MainLayout>
  );
};
