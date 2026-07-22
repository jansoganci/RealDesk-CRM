import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  FileUp,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';

interface FirstDashboardWelcomeProps {
  onAddLead: () => void;
  onAddProperty: () => void;
  onImportContract: () => void;
  onContinueLater: () => void;
}

const steps = [
  { key: 'lead', icon: UsersRound },
  { key: 'property', icon: Building2 },
  { key: 'contract', icon: FileUp },
] as const;

export function FirstDashboardWelcome({
  onAddLead,
  onAddProperty,
  onImportContract,
  onContinueLater,
}: FirstDashboardWelcomeProps) {
  const { t } = useTranslation('dashboard');

  return (
    <section aria-labelledby="first-dashboard-welcome-title">
      <Card className="relative overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-blue-50/70 to-slate-100 shadow-lg dark:border-slate-800 dark:from-slate-950 dark:via-blue-950/40 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-700/20"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-700/20"
        />

        <CardHeader className="relative px-5 pb-4 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-12">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 sm:h-14 sm:w-14">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
          <p className={cn('text-sm font-semibold uppercase tracking-[0.16em]', COLORS.primary.text)}>
            {t('firstVisit.eyebrow')}
          </p>
          <h1
            id="first-dashboard-welcome-title"
            className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white"
          >
            {t('firstVisit.title')}
          </h1>
          <CardDescription className="max-w-2xl pt-2 text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            {t('firstVisit.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative px-5 pb-8 sm:px-8 sm:pb-10 lg:px-12 lg:pb-12">
          <ol className="my-6 grid gap-3 md:grid-cols-3 lg:my-8 lg:gap-4">
            {steps.map(({ key, icon: Icon }, index) => (
              <li
                key={key}
                className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/75 sm:p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('firstVisit.stepLabel', { number: index + 1 })}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-950 dark:text-white">
                  {t(`firstVisit.steps.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(`firstVisit.steps.${key}.description`)}
                </p>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={onAddLead}
              className={cn('min-h-11 w-full sm:w-auto', COLORS.primary.bgGradient, COLORS.primary.bgGradientHover)}
            >
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              {t('firstVisit.actions.addLead')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onAddProperty}
              className="min-h-11 w-full border-slate-300 bg-white/80 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {t('firstVisit.actions.addProperty')}
            </Button>
          </div>

          <div className="mt-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="link"
              onClick={onImportContract}
              className="min-h-11 px-0 text-blue-700 dark:text-blue-300"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              {t('firstVisit.actions.importContract')}
            </Button>
            <span className="hidden text-slate-300 sm:inline dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={onContinueLater}
              className="min-h-11 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {t('firstVisit.actions.continueLater')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
