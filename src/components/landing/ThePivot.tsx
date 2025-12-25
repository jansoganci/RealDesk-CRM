// ThePivot – “emlakcrm unifies it all.”
import { useTranslation } from "react-i18next"

export const ThePivot = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-950 text-white text-center border-t border-slate-900 py-24 relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent">
                {t('pivot.title')}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                {t('pivot.description')}
            </p>
        </div>
        
        {/* Video Container */}
        <div className="relative w-full max-w-3xl mx-auto rounded-20 overflow-hidden shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-1000 delay-200">
             <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover"
                aria-label={t('pivot.videoAriaLabel')}
             >
                <source src="/landing/pivot-solution.mp4" type="video/mp4" />
                <p className="text-gray-400 p-4">{t('pivot.videoFallback')}</p>
             </video>
             
             {/* Video Overlay Gradient for better blending */}
             <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
        </div>
      </div>
    </section>
  )
}
