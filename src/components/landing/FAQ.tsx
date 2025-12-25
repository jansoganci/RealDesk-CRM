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
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{t('faq.title')}</h2>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b border-gray-100 py-2">
            <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {t('faq.items.0.question')}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 leading-relaxed pt-2">
              {t('faq.items.0.answer')}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="border-b border-gray-100 py-2">
            <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {t('faq.items.1.question')}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 leading-relaxed pt-2">
              {t('faq.items.1.answer')}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3" className="border-none py-2">
            <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {t('faq.items.2.question')}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 leading-relaxed pt-2">
              {t('faq.items.2.answer')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}
