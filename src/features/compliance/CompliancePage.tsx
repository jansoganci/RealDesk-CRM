import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, Trash2, ShieldOff, HelpCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DataSubjectRequestForm } from './components/DataSubjectRequestForm';
import { RequestStatusCheck } from './components/RequestStatusCheck';

export function CompliancePage() {
  const { t } = useTranslation('compliance');
  const [formOpen, setFormOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const rights = [
    { key: 'know', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { key: 'delete', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { key: 'optOut', icon: ShieldOff, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    { key: 'nonDiscrimination', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">{t('page.title')}</h1>
          <p className="text-blue-100 text-lg">{t('page.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 dark:bg-slate-100 dark:text-blue-900 dark:hover:bg-white font-semibold shadow-lg"
              onClick={() => setFormOpen(true)}
            >
              {t('page.submitRequest')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => setStatusOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              {t('page.checkStatus')}
            </Button>
          </div>
        </div>
      </div>

      {/* Rights Overview */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <section>
          <h2 className="text-xl font-bold mb-6">{t('page.yourRights')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rights.map(({ key, icon: Icon, color, bg }) => (
              <div key={key} className={`rounded-2xl border p-5 ${bg}`}>
                <Icon className={`h-6 w-6 mb-3 ${color}`} />
                <h3 className="font-semibold text-sm mb-1">{t(`rights.${key}.title`)}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{t(`rights.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold mb-4">
            <HelpCircle className="inline h-5 w-5 mr-2 text-blue-600" />
            {t('page.faqTitle')}
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {(['whoQualifies', 'howLong', 'whatData', 'verification'] as const).map((key) => (
              <AccordionItem key={key} value={key} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium">{t(`faq.${key}.q`)}</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 dark:text-slate-300">{t(`faq.${key}.a`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">{t('page.contactNotice')}</p>
      </div>

      {/* Submit Request Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('form.title')}</DialogTitle>
          </DialogHeader>
          <DataSubjectRequestForm onSuccess={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Check Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('statusCheck.title')}</DialogTitle>
          </DialogHeader>
          <RequestStatusCheck />
        </DialogContent>
      </Dialog>
    </div>
  );
}
