import { useTranslation } from "react-i18next"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { SEO } from "@/components/common/SEO"
import PricingSection from "../billing/components/PricingSection"

export const PublicPricingPage = () => {
  const { t, ready } = useTranslation('landing')

  // Show loading state while translations are loading
  if (!ready) {
    return (
      <div className="min-h-screen bg-white">
        <LandingHeader />
        <main className="bg-neutral-50 pt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <p className="text-slate-500">Loading...</p>
          </div>
        </main>
        <LandingFooter />
      </div>
    )
  }

  return (
    <>
      <SEO
        title="Fiyatlandırma | Emlak CRM Pricing"
        description="Emlak CRM pricing plans for real estate agencies. Start with a free trial, then choose the plan that fits your needs. Transparent pricing, no hidden fees."
        keywords="emlak crm fiyat, gayrimenkul yazılımı fiyatları, real estate crm pricing, emlak programı ücretsiz deneme, property management software cost"
      />
      <div className="min-h-screen bg-white">
        <LandingHeader />
        <main className="bg-neutral-50 pt-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-16 pb-8">
            {/* Hero Block */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
                {t('pricing.title')}
              </h1>
              <p className="mt-3 text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
                {t('pricing.subtitle')}
              </p>
            </div>
          </div>
          <PricingSection
            showHeader={false}
          />
        </main>
        <LandingFooter />
      </div>
    </>
  )
}

