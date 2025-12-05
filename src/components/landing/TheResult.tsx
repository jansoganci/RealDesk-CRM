// TheResult – emotional and business outcome: less chaos, more control and growth.
import { useTranslation } from "react-i18next"

export const TheResult = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-950 text-white text-center py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10" />
      
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="space-y-6 z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {t('result.title')}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            {t('result.description')}
          </p>
        </div>

        {/* Growth Chart Visual */}
        <div className="relative w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-200">
           {/* Glow behind the chart */}
           <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full -z-10 opacity-50" />
           
           <img 
            src="/landing/result-growth.jpeg" 
            alt="Portfolio performance growth chart" 
            className="w-full h-auto object-contain drop-shadow-2xl rounded-2xl"
           />
        </div>
      </div>
    </section>
  )
}
