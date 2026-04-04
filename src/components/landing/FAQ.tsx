// FAQ – LIGHT section.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslation } from "react-i18next"

export const FAQ = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="bg-[#f8fafc] py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="flex justify-center">
            <span className="ld-eyebrow">
              <span className="ld-eyebrow-dot" />
              {t('faq.eyebrow')}
            </span>
          </div>
          <h2 className="ld-serif text-4xl md:text-5xl text-slate-900">
            {t('faq.title')}
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b border-slate-200 py-2">
            <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-amber-600 transition-colors">
              {t('faq.items.0.question')}
            </AccordionTrigger>
            <AccordionContent className="text-slate-500 font-light leading-relaxed pt-2">
              {t('faq.items.0.answer')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b border-slate-200 py-2">
            <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-amber-600 transition-colors">
              {t('faq.items.1.question')}
            </AccordionTrigger>
            <AccordionContent className="text-slate-500 font-light leading-relaxed pt-2">
              {t('faq.items.1.answer')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-none py-2">
            <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-amber-600 transition-colors">
              {t('faq.items.2.question')}
            </AccordionTrigger>
            <AccordionContent className="text-slate-500 font-light leading-relaxed pt-2">
              {t('faq.items.2.answer')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}
