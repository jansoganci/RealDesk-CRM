// FeatureProperties – LIGHT section. Portfolio management feature.
import { useTranslation } from "react-i18next"
import { MiniDashboardMockup } from "./MiniDashboardMockup"

export const FeatureProperties = () => {
  const { t } = useTranslation('landing')

  return (
    <section id="features" className="bg-[#f8fafc] text-center py-32 px-6">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <span className="ld-eyebrow">
              <span className="ld-eyebrow-dot" />
              {t('featureProperties.eyebrow')}
            </span>
          </div>

          <h2 className="ld-serif text-4xl md:text-5xl lg:text-6xl text-slate-900">
            {t('featureProperties.title')}
          </h2>
          <p className="text-lg text-slate-500 font-light leading-relaxed">
            {t('featureProperties.description')}
          </p>
        </div>

        <div className="w-full flex items-center justify-center">
          <MiniDashboardMockup />
        </div>
      </div>
    </section>
  )
}
