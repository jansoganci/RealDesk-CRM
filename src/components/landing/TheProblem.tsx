// TheProblem – show the scattered chaos (WhatsApp, Excel, notes).
import { useTranslation } from "react-i18next"
import { MessageSquare, Table2, StickyNote } from "lucide-react"

export const TheProblem = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 text-gray-900 text-center py-20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 z-10">
        <div className="space-y-6">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">
            {t('problem.eyebrow')}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {t('problem.title')}
          </h2>

          <div className="space-y-3 text-lg md:text-xl text-gray-600 font-light">
            <p className="flex items-center justify-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 shrink-0" />
              {t('problem.item1')}
            </p>
            <p className="flex items-center justify-center gap-3">
              <Table2 className="w-5 h-5 text-blue-600 shrink-0" />
              {t('problem.item2')}
            </p>
            <p className="flex items-center justify-center gap-3">
              <StickyNote className="w-5 h-5 text-blue-600 shrink-0" />
              {t('problem.item3')}
            </p>
          </div>
        </div>

        {/* Chaos Visual */}
        <div className="relative w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-200">
           <img
            src="/landing/problem-chaos.jpeg"
            alt={t('problem.imageAlt')}
            className="w-full h-auto object-contain drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-20"
           />
           {/* Overlay gradient to blend bottom edge if needed, though image looks standalone */}
           <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent opacity-20 rounded-20" />
        </div>
      </div>
    </section>
  )
}
