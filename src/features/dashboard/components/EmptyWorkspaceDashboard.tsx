import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  Circle,
  FileUp,
  ListChecks,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';

interface EmptyWorkspaceDashboardProps {
  onAddLead: () => void;
  onAddProperty: () => void;
  onImportContract: () => void;
}

const checklistItems = ['lead', 'property', 'transaction'] as const;

export function EmptyWorkspaceDashboard({
  onAddLead,
  onAddProperty,
  onImportContract,
}: EmptyWorkspaceDashboardProps) {
  const { t } = useTranslation('dashboard');

  return (
    <section aria-labelledby="empty-workspace-title" className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-7 sm:py-8">
        <p className={cn('text-sm font-semibold', COLORS.primary.text)}>
          {t('emptyWorkspace.eyebrow')}
        </p>
        <h1
          id="empty-workspace-title"
          className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white"
        >
          {t('emptyWorkspace.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
          {t('emptyWorkspace.description')}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-700 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-700/15">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-white">
              {t('emptyWorkspace.actions.lead.title')}
            </CardTitle>
            <CardDescription className="leading-6 text-blue-100">
              {t('emptyWorkspace.actions.lead.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={onAddLead}
              className="min-h-11 w-full bg-white text-blue-700 shadow-sm hover:bg-blue-50"
            >
              {t('emptyWorkspace.actions.lead.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-slate-950 dark:text-white">
              {t('emptyWorkspace.actions.property.title')}
            </CardTitle>
            <CardDescription className="leading-6 text-slate-600 dark:text-slate-300">
              {t('emptyWorkspace.actions.property.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={onAddProperty}
              className="min-h-11 w-full border-slate-300 dark:border-slate-700"
            >
              {t('emptyWorkspace.actions.property.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-slate-300 bg-slate-50/70 shadow-none dark:border-slate-700 dark:bg-slate-900/60">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
              <FileUp className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-slate-950 dark:text-white">
              {t('emptyWorkspace.actions.contract.title')}
            </CardTitle>
            <CardDescription className="leading-6 text-slate-600 dark:text-slate-300">
              {t('emptyWorkspace.actions.contract.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={onImportContract}
              className="min-h-11 w-full border-slate-300 bg-transparent dark:border-slate-700"
            >
              {t('emptyWorkspace.actions.contract.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base text-slate-950 dark:text-white">
                {t('emptyWorkspace.checklist.title')}
              </CardTitle>
              <CardDescription className="mt-1 text-slate-600 dark:text-slate-300">
                {t('emptyWorkspace.checklist.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-3">
            {checklistItems.map((item) => (
              <li
                key={item}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <Circle className="h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
                {t(`emptyWorkspace.checklist.items.${item}`)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
