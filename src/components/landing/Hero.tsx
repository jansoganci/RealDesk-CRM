// Hero – first impression, “everything in one place” message.
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"

export const Hero = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  return (
    <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 bg-white pt-32 pb-20 relative overflow-hidden">
      {/* Text Content - Left Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 z-10 mb-12 lg:mb-0 lg:pr-12">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1]">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-xl font-light leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            {t('hero.cta')}
          </Button>
        </div>
      </div>

      {/* Hero Image - Right Side */}
      <div className="w-full lg:w-1/2 flex justify-center items-center relative z-10">
        <div className="relative w-full max-w-[600px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
           {/* Image Container */}
           <img 
            src="/landing/hero-dashboard.jpeg" 
            alt="Emlak CRM Dashboard Mobile Preview" 
            className="w-full h-auto object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-out"
           />
        </div>
      </div>

      {/* Background Decor - Optional subtle gradient similar to the image */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none" />
    </section>
  )
}
