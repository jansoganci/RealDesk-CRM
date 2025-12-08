import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  id: 'starter' | 'pro' | 'office';
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
    id: 'starter',
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
    id: 'pro',
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
    id: 'office',
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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const isTurkish = i18n.language === 'tr';

  const handleSelectPlan = (planId: 'starter' | 'pro' | 'office') => {
    console.log('select plan', planId);
  };

  const getCurrencySymbol = () => (isTurkish ? '₺' : '$');

  // Determine if we should show the header.
  // If title/subtitle are provided (even empty strings), we use them.
  // If undefined, we fallback to default translations.
  const displayTitle = title !== undefined ? title : t('header.title');
  const displaySubtitle = subtitle !== undefined ? subtitle : t('header.subtitle');

  return (
    <section className="w-full bg-gradient-to-b from-slate-50 via-neutral-50 to-white px-4 pb-12">
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
          <div className="inline-flex items-center gap-2 p-1 bg-white rounded-full border border-slate-200 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {t('billingPeriod.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {t('billingPeriod.yearly')}
              <span className="ml-1 text-xs opacity-90">
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md">
                      {t('popular')}
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {t(plan.nameKey)}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 mt-2">
                    {t(plan.descriptionKey)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Trial Badge */}
                  <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-blue-700 text-center leading-tight">
                      {t('trialBadge')}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-slate-900">{price}</span>
                      <span className="text-lg text-slate-600">{currencySymbol}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
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
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-700 leading-relaxed">
                            {t(feature.textKey)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full rounded-xl ${plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white '
                      }`}
                  >
                    <span className="font-semibold">{t('cta.selectPlan')}</span>
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
