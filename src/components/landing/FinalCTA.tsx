// FinalCTA – DARK section. Last push to sign up.
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"

export const FinalCTA = () => {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  return (
    <section className="ld-dark text-center py-32 px-6">
      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        <div className="flex justify-center">
          <span className="ld-eyebrow">
            <span className="ld-eyebrow-dot" />
            {t('finalCta.eyebrow')}
          </span>
        </div>

        <h2 className="ld-serif text-5xl md:text-6xl text-[#f0ece4]">
          {t('finalCta.title')}
        </h2>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <button
              className="inline-flex items-center justify-center bg-[#f0ece4] text-[#0c1829] text-base font-semibold px-12 py-4 rounded-full shadow-lg hover:bg-white hover:scale-105 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              {t('finalCta.cta')}
            </button>
            <p className="text-sm text-[#f0ece4]/50 font-light">
              {t('finalCta.reassurance')}
            </p>
          </div>

          <p className="text-xs text-[#f0ece4]/28 font-light tracking-widest uppercase">
            {t('shared.complianceBadge')}
          </p>
        </div>
      </div>
    </section>
  )
}
