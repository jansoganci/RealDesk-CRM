import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Lock } from 'lucide-react';
import { ROUTES } from '../../config/constants';
import PricingSection from './components/PricingSection';

export const BillingSubscribe = () => {
  const navigate = useNavigate();

  return (
    <MainLayout title="Erişim Kısıtlandı">
      <PageContainer>
        <div className="space-y-8 py-8">
          {/* Header Card */}
          <div className="flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-4">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                Erişim kısıtlandı / Access restricted
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-gray-600 text-base leading-relaxed">
                  Deneme süren sona erdi veya aboneliğin aktif değil. Devam etmek için bir plan seçmelisin.
                </p>
                <p className="text-gray-600 text-base leading-relaxed">
                  Your trial has ended or your subscription is not active. Please choose a plan to continue.
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                    onClick={() => navigate(ROUTES.PRICING)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                >
                  Planları Gör / View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Pricing Section */}
          <PricingSection />
        </div>
      </PageContainer>
    </MainLayout>
  );
};

