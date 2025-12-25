// Hero – first impression, “everything in one place” message.
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"

export const Hero = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  return (
    <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-white pt-40 pb-32 relative overflow-hidden">
      {/* 
          Container matches Header's max-w-7xl exactly 
          px-4 sm:px-6 matches the header's alignment gutter
      */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Text Content - 42% Width for improved asymmetrical balance */}
        <div className="w-full lg:w-[42%] flex flex-col items-start text-left z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05] mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-[480px] font-normal leading-relaxed mb-10">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 h-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 active:scale-95"
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              {t('hero.cta')}
            </Button>
          </div>
          
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              {t('hero.trustLine')}
            </p>
            <p className="text-xs text-gray-400 font-light tracking-wide uppercase">
              {t('shared.complianceBadge')}
            </p>
          </div>
        </div>

        {/* Product Visual - 58% Width & Anchored Stage */}
        <div className="w-full lg:w-[58%] flex justify-center items-center relative z-10">
          <div className="relative w-full aspect-[4/3] lg:aspect-auto">
            {/* The "Stage" - A subtle rounded background that grounds the image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-indigo-50/30 rounded-[40px] transform rotate-3 scale-105 -z-10" />
            
            <img
              src="/landing/hero-dashboard.png"
              alt={t('hero.imageAlt')}
              className="w-full h-auto object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.12)] rounded-20 border border-white/50"
            />
          </div>
        </div>
      </div>

      {/* Background Decor - Minimalist & Focused */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
    </section>
  )
}
