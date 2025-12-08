import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Sparkles } from 'lucide-react';
import PricingSection from './components/PricingSection';

export const BillingSubscribe = () => {

  return (
    <MainLayout title="Erişim Kısıtlandı">
      <PageContainer>
        <div className="space-y-8 py-8">
          {/* Header Card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-2xl shadow-lg border-blue-100">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-blue-50 p-4">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                  Deneme süren bitti / Your trial has ended
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-gray-600 text-base leading-relaxed">
                    Emlak CRM'i kullanmaya devam etmek için aşağıdan sana uygun bir plan seç. Tüm verilerin güvende, abonelik başlatarak hesabını aktif tutabilirsin.
                  </p>
                  <p className="text-gray-600 text-base leading-relaxed">
                    To keep using Emlak CRM, choose the plan that fits you best below. Your data is safe; starting a subscription will keep your account active.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Section */}
          <PricingSection showHeader={false} />
        </div>
      </PageContainer>
    </MainLayout>
  );
};

