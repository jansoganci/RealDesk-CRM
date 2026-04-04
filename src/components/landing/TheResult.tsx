// TheResult – DARK section. Emotional and business outcome.
import { useTranslation } from "react-i18next"

export const TheResult = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="ld-dark text-center py-32 px-6">
      <div className="relative z-10 max-w-4xl mx-auto space-y-16">
        <div className="space-y-6">
          <div className="flex justify-center">
            <span className="ld-eyebrow">
              <span className="ld-eyebrow-dot" />
              {t('result.eyebrow')}
            </span>
          </div>

          <h2 className="ld-serif text-4xl md:text-5xl lg:text-6xl text-[#f0ece4]">
            {t('result.title')}
          </h2>
          <p className="text-xl text-[#f0ece4]/55 max-w-2xl mx-auto font-light leading-relaxed">
            {t('result.description')}
          </p>
        </div>

        <div className="relative w-full max-w-3xl mx-auto">
          <div className="absolute -inset-4 bg-[#c8a96e]/10 blur-3xl rounded-full -z-10 opacity-50" />
          <img
            src="/landing/result-growth.jpeg"
            alt={t('result.imageAlt')}
            className="w-full h-auto object-contain drop-shadow-2xl rounded-20"
          />
        </div>
      </div>
    </section>
  )
}
