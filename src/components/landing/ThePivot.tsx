// ThePivot section.
import { useTranslation } from "react-i18next"

export const ThePivot = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="ld-dark text-center py-32 px-6">
      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="flex justify-center">
            <span className="ld-eyebrow">
              <span className="ld-eyebrow-dot" />
              {t('pivot.eyebrow')}
            </span>
          </div>

          <h2 className="ld-serif text-4xl md:text-5xl lg:text-6xl text-[#f0ece4]">
            {t('pivot.title')}
          </h2>
          <p className="text-xl text-[#f0ece4]/55 max-w-2xl mx-auto font-light leading-relaxed">
            {t('pivot.description')}
          </p>
        </div>

        <div className="relative w-full max-w-3xl mx-auto rounded-20 overflow-hidden shadow-2xl ring-1 ring-white/10">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover"
            aria-label={t('pivot.videoAriaLabel')}
          >
            <source src="/landing/pivot-solution.mp4" type="video/mp4" />
            <p className="text-[#f0ece4]/40 p-4">{t('pivot.videoFallback')}</p>
          </video>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
        </div>
      </div>
    </section>
  )
}
