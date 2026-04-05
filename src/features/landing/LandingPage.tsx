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
        title="Emlak CRM | Gayrimenkul Yönetim Sistemi"
        description="Modern, mobile-first real estate CRM for US agencies and agents. Manage properties, tenants, contracts, reminders and daily workflows in one simple, secure system."
        keywords="emlak crm, gayrimenkul yönetim sistemi, emlak yazılımı, kiracı takip programı, sözleşme yönetimi, real estate crm, property management, tenant tracking, contract management"
      />
      <div className="min-h-screen bg-white">
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
