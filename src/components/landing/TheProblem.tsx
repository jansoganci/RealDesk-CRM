// TheProblem – LIGHT section. Show the scattered chaos.
import { useTranslation } from "react-i18next"
import { MessageSquare, Table2, StickyNote } from "lucide-react"

export const TheProblem = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="bg-[#f8fafc] text-slate-900 text-center py-32 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="flex justify-center">
            <span className="ld-eyebrow">
              <span className="ld-eyebrow-dot" />
              {t('problem.eyebrow')}
            </span>
          </div>

          <h2 className="ld-serif text-4xl md:text-5xl lg:text-6xl text-slate-900">
            {t('problem.title')}
          </h2>

          <div className="space-y-3 text-lg md:text-xl text-slate-500 font-light">
            <p className="flex items-center justify-center gap-3">
              <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
              {t('problem.item1')}
            </p>
            <p className="flex items-center justify-center gap-3">
              <Table2 className="w-5 h-5 text-amber-500 shrink-0" />
              {t('problem.item2')}
            </p>
            <p className="flex items-center justify-center gap-3">
              <StickyNote className="w-5 h-5 text-amber-500 shrink-0" />
              {t('problem.item3')}
            </p>
          </div>
        </div>

        <div className="relative w-full max-w-2xl mx-auto">
          <img
            src="/landing/problem-chaos.jpeg"
            alt={t('problem.imageAlt')}
            className="w-full h-auto object-contain drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent opacity-20 rounded-20" />
        </div>
      </div>
    </section>
  )
}
