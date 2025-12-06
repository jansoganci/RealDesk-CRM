// TODO: confirm if this in-app PricingPage is still needed
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import PricingSection from './components/PricingSection';

export default function PricingPage() {
  return (
    <MainLayout title="Fiyatlar ve Planlar">
      <PageContainer>
        <PricingSection />
      </PageContainer>
    </MainLayout>
  );
}

