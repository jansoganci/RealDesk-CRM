// FeatureProperties – focus on property / portfolio management.
import { useTranslation } from "react-i18next"
import { MiniDashboardMockup } from "./MiniDashboardMockup"

export const FeatureProperties = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-white text-center py-20">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {t('featureProperties.title')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
            {t('featureProperties.description')}
            </p>
        </div>

        {/* Minimal Dashboard Mockup */}
        <div className="w-full flex items-center justify-center">
          <MiniDashboardMockup />
        </div>
      </div>
    </section>
  )
}
