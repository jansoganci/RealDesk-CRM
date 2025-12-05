// FinalCTA – last push to sign up / start.
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"

export const FinalCTA = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 bg-white text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
          {t('finalCta.title')}
        </h2>
        
        <div className="flex flex-col items-center gap-4">
            <Button 
              size="lg" 
              className="text-lg px-12 py-8 h-auto"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
                {t('finalCta.cta')}
            </Button>
            <p className="text-sm text-gray-500">
                {t('finalCta.reassurance')}
            </p>
        </div>
      </div>
    </section>
  )
}
