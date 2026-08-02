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
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="bg-background pt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">{t('pricing.loading')}</p>
          </div>
        </main>
        <LandingFooter />
      </div>
    )
  }

  return (
    <>
      <SEO
        title="Pricing | Closewell"
        description="Closewell pricing plans for real estate agents. Transparent pricing, no hidden fees."
        keywords="real estate crm pricing, property management software, realtor crm, agent crm pricing"
      />
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="bg-background pt-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-16 pb-8">
            {/* Hero Block */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
                {t('pricing.title')}
              </h1>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
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
