// TheResult – emotional and business outcome: less chaos, more control and growth.
import { useTranslation } from "react-i18next"

export const TheResult = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-blue-900 text-white text-center py-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="space-y-6 z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            {t('result.title')}
          </h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto font-light leading-relaxed">
            {t('result.description')}
          </p>
        </div>

        {/* Growth Chart Visual */}
        <div className="relative w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-200">
           {/* Glow behind the chart */}
           <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full -z-10 opacity-50" />
           
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
