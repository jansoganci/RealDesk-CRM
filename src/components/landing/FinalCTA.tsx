// FinalCTA – last push to sign up / start.
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"

export const FinalCTA = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  return (
    <section className="py-32 flex flex-col items-center justify-center px-6 bg-blue-600 text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
          {t('finalCta.title')}
        </h2>
        
        <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                className="text-lg px-12 py-8 h-auto bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={() => navigate(ROUTES.REGISTER)}
              >
                  {t('finalCta.cta')}
              </Button>
              <p className="text-sm text-blue-100">
                  {t('finalCta.reassurance')}
              </p>
            </div>
            
            <p className="text-xs text-blue-200 font-light tracking-widest uppercase">
              {t('shared.complianceBadge')}
            </p>
        </div>
      </div>
    </section>
  )
}
