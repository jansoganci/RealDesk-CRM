import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, Trash2, ShieldOff, HelpCircle, Search, AlertTriangle } from 'lucide-react';
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
import { supabase } from '@/config/supabase';
import { DataSubjectRequestForm } from './components/DataSubjectRequestForm';
import { RequestStatusCheck } from './components/RequestStatusCheck';

const ORG_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type OrgLinkState = 'loading' | 'valid' | 'invalid';

export function CompliancePage() {
  const { t } = useTranslation('compliance');
  const [searchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [orgLinkState, setOrgLinkState] = useState<OrgLinkState>('loading');
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const orgParam = searchParams.get('org');

    if (!orgParam || !ORG_UUID_RE.test(orgParam)) {
      setOrgLinkState('invalid');
      setOrgId(null);
      return;
    }

    setOrgLinkState('loading');

    void (async () => {
      const { data, error } = await supabase.rpc('ccpa_org_link_valid', {
        p_org_id: orgParam,
      });

      if (cancelled) return;

      if (error || data !== true) {
        setOrgLinkState('invalid');
        setOrgId(null);
        return;
      }

      setOrgId(orgParam);
      setOrgLinkState('valid');
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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
              disabled={orgLinkState !== 'valid'}
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

      {orgLinkState === 'invalid' && (
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 p-4 flex gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {t('page.invalidOrgTitle')}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('page.invalidOrgMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {orgLinkState === 'loading' && (
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {t('page.validatingOrg')}
          </p>
        </div>
      )}

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

      {/* Submit Request Dialog — only when org link is valid */}
      {orgId && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('form.title')}</DialogTitle>
            </DialogHeader>
            <DataSubjectRequestForm orgId={orgId} />
          </DialogContent>
        </Dialog>
      )}

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
