import "@/components/landing/landing-shared.css"
import { Hero } from "@/components/landing/Hero"
import { TheProblem } from "@/components/landing/TheProblem"
import { ThePivot } from "@/components/landing/ThePivot"
import { FeatureProperties } from "@/components/landing/FeatureProperties"
import { FeatureReminders } from "@/components/landing/FeatureReminders"
import { Testimonial } from "@/components/landing/Testimonial"
import { TheResult } from "@/components/landing/TheResult"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { SEO } from "@/components/common/SEO"
import PricingSection from "@/features/billing/components/PricingSection"

export const LandingPage = () => {
  return (
    <>
      <SEO
        title="Closewell | The CRM for US Real Estate Agents"
        description="Modern, mobile-first real estate CRM for US agencies and agents. Manage properties, tenants, contracts, reminders and daily workflows in one simple, secure system."
        keywords="closewell, real estate crm, property management, tenant tracking, contract management, US real estate software"
      />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <LandingHeader />
        <main>
          <Hero />
          <TheProblem />
          <ThePivot />
          <FeatureProperties />
          <FeatureReminders />
          <Testimonial />
          <TheResult />
          <FAQ />
          <PricingSection showHeader={true} />
          <FinalCTA />
        </main>
        <LandingFooter />
      </div>
    </>
  )
}
