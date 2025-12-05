import { Hero } from "@/components/landing/Hero"
import { TheProblem } from "@/components/landing/TheProblem"
import { ThePivot } from "@/components/landing/ThePivot"
import { FeatureProperties } from "@/components/landing/FeatureProperties"
import { FeatureReminders } from "@/components/landing/FeatureReminders"
import { TheResult } from "@/components/landing/TheResult"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        <Hero />
        <TheProblem />
        <ThePivot />
        <FeatureProperties />
        <FeatureReminders />
        <TheResult />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
