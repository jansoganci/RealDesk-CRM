import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession } from '@/services/stripeCheckout.service';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  Bell,
  FileText,
  Sparkles,
  Headphones,
} from 'lucide-react';

type BillingPeriod = 'monthly' | 'yearly';

interface PlanFeature {
  icon: React.ComponentType<{ className?: string }>;
  textKey: string;
}

interface Plan {
  id: 'baslangic' | 'profesyonel' | 'ofis_plus';
  nameKey: string;
  descriptionKey: string;
  monthlyPriceTL: number;
  monthlyPriceUSD: number;
  yearlyPriceTL: number;
  yearlyPriceUSD: number;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'baslangic',
    nameKey: 'plans.starter.name',
    descriptionKey: 'plans.starter.description',
    monthlyPriceTL: 299,
    monthlyPriceUSD: 9,
    yearlyPriceTL: 2990,
    yearlyPriceUSD: 90,
    features: [
      { icon: Building2, textKey: 'features.maxListings.starter' },
      { icon: Bell, textKey: 'features.basicReminders' },
      { icon: Users, textKey: 'features.singleUser' },
      { icon: FileText, textKey: 'features.basicContractManagement' },
    ],
  },
  {
    id: 'profesyonel',
    nameKey: 'plans.pro.name',
    descriptionKey: 'plans.pro.description',
    monthlyPriceTL: 599,
    monthlyPriceUSD: 19,
    yearlyPriceTL: 5990,
    yearlyPriceUSD: 190,
    popular: true,
    features: [
      { icon: Building2, textKey: 'features.maxListings.pro' },
      { icon: Users, textKey: 'features.teamMembers.pro' },
      { icon: Bell, textKey: 'features.advancedReminders' },
      { icon: FileText, textKey: 'features.fullContractManagement' },
      { icon: Sparkles, textKey: 'features.pdfContractGeneration' },
    ],
  },
  {
    id: 'ofis_plus',
    nameKey: 'plans.office.name',
    descriptionKey: 'plans.office.description',
    monthlyPriceTL: 1199,
    monthlyPriceUSD: 39,
    yearlyPriceTL: 11990,
    yearlyPriceUSD: 390,
    features: [
      { icon: Building2, textKey: 'features.maxListings.office' },
      { icon: Users, textKey: 'features.teamMembers.office' },
      { icon: Bell, textKey: 'features.allReminders' },
      { icon: FileText, textKey: 'features.advancedContractManagement' },
      { icon: Sparkles, textKey: 'features.customPdfTemplates' },
      { icon: Headphones, textKey: 'features.prioritySupport' },
    ],
  },
];

// ... imports

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

export default function PricingSection({ title, subtitle, showHeader = true }: PricingSectionProps) {
  const { t, i18n } = useTranslation('billing');
  const { session } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isTurkish = i18n.language === 'tr';

  // Handle checkout cancellation
  useEffect(() => {
    const cancelled = searchParams.get('cancelled');

    if (cancelled === 'true') {
      toast.info(
        isTurkish
          ? 'Abonelik işleminiz iptal edildi. Hazır olduğunuzda tekrar deneyebilirsiniz.'
          : 'Your subscription was canceled. You can try again when ready.',
        {
          description: isTurkish ? 'Ödeme İptal Edildi' : 'Payment Canceled',
        }
      );

      // Clear query parameter
      searchParams.delete('cancelled');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isTurkish]);

  const handleSelectPlan = async (planId: 'baslangic' | 'profesyonel' | 'ofis_plus') => {
    console.log('🎯 [PricingSection] User clicked plan:', {
      planId,
      billingPeriod,
      hasSession: !!session,
      userId: session?.user?.id,
    });

    // Require authentication
    if (!session) {
      console.warn('⚠️ [PricingSection] No session found, blocking checkout');
      toast.error(
        isTurkish
          ? 'Abonelik satın almak için giriş yapmalısınız'
          : 'You must be logged in to purchase a subscription',
        {
          description: isTurkish ? 'Giriş Gerekli' : 'Login Required',
        }
      );
      return;
    }

    console.log('✅ [PricingSection] Session exists, proceeding with checkout');

    // Set loading state for this specific plan
    setLoading(planId);

    try {
      // Determine currency from language
      const currency = isTurkish ? 'try' : 'usd';

      console.log('💰 [PricingSection] Calling createCheckoutSession...', {
        plan: planId,
        interval: billingPeriod,
        currency,
      });

      // Create checkout session
      const { url } = await createCheckoutSession({
        plan: planId,
        interval: billingPeriod,
        currency,
      });

      console.log('✅ [PricingSection] Got checkout URL, redirecting...', {
        hasUrl: !!url,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('❌ [PricingSection] Checkout error:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : (isTurkish ? 'Ödeme sayfası açılamadı' : 'Failed to open checkout'),
        {
          description: isTurkish ? 'Hata' : 'Error',
        }
      );

      setLoading(null);
    }
  };

  const getCurrencySymbol = () => (isTurkish ? '₺' : '$');

  // Determine if we should show the header.
  // If title/subtitle are provided (even empty strings), we use them.
  // If undefined, we fallback to default translations.
  const displayTitle = title !== undefined ? title : t('header.title');
  const displaySubtitle = subtitle !== undefined ? subtitle : t('header.subtitle');

  return (
    <section className="w-full bg-gradient-to-b from-slate-50 via-neutral-50 to-white px-3 sm:px-4 pb-8 sm:pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {showHeader && (displayTitle || displaySubtitle) && (
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-8">
            {displayTitle && (
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {displayTitle}
              </h2>
            )}
            {displaySubtitle && (
              <p className="text-base md:text-lg text-slate-600">
                {displaySubtitle}
              </p>
            )}
          </div>
        )}

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 sm:gap-2 p-1 bg-white rounded-full border border-slate-200 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {t('billingPeriod.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all relative ${billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {t('billingPeriod.yearly')}
              <span className="ml-1 text-[10px] sm:text-xs opacity-90">
                ({t('billingPeriod.yearlySavings')})
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {plans.map((plan) => {
            const monthlyPrice = isTurkish ? plan.monthlyPriceTL : plan.monthlyPriceUSD;
            const yearlyPrice = isTurkish ? plan.yearlyPriceTL : plan.yearlyPriceUSD;
            const price = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice;
            const currencySymbol = getCurrencySymbol();
            const periodText = billingPeriod === 'monthly'
              ? t('price.monthly')
              : t('price.yearly');

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col h-full rounded-2xl transition-all hover:shadow-xl ${plan.popular
                  ? 'border-2 border-blue-500 shadow-lg scale-100 md:scale-105 z-10'
                  : 'border border-slate-200'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-0.5 sm:py-1 rounded-full shadow-md">
                      {t('popular')}
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                    {t(plan.nameKey)}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 mt-2">
                    {t(plan.descriptionKey)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6">
                  {/* Trial Badge */}
                  <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-blue-700 text-center leading-tight">
                      {t('trialBadge')}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl sm:text-4xl font-bold text-slate-900">{price}</span>
                      <span className="text-base sm:text-lg text-slate-600">{currencySymbol}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {price}{currencySymbol}{periodText}
                    </p>
                    {billingPeriod === 'yearly' && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {yearlyPrice}{currencySymbol} {t('price.yearlyDiscount')}{' '}
                        <span className="line-through text-slate-400">
                          {(monthlyPrice * 12).toFixed(0)}{currencySymbol}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 sm:space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 shrink-0" />
                          <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {t(feature.textKey)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading !== null}
                    className={`w-full rounded-xl py-2.5 sm:py-3 ${plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white '
                      }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-xs sm:text-sm">{isTurkish ? 'Yükleniyor...' : 'Loading...'}</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-xs sm:text-sm">{t('cta.selectPlan')}</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
