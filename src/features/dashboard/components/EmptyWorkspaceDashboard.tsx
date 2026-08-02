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
      <header className="rounded-2xl border border-border bg-white px-5 py-6 shadow-sm dark:border-border dark:bg-muted sm:px-7 sm:py-8">
        <p className={cn('text-sm font-semibold', COLORS.primary.text)}>
          {t('emptyWorkspace.eyebrow')}
        </p>
        <h1
          id="empty-workspace-title"
          className="mt-2 text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl dark:text-white"
        >
          {t('emptyWorkspace.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base dark:text-muted-foreground">
          {t('emptyWorkspace.description')}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/30 bg-gradient-to-br from-primary to-primary text-white shadow-lg shadow-primary/20">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-white">
              {t('emptyWorkspace.actions.lead.title')}
            </CardTitle>
            <CardDescription className="leading-6 text-primary-foreground/90">
              {t('emptyWorkspace.actions.lead.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={onAddLead}
              className="min-h-11 w-full bg-white text-primary shadow-sm hover:bg-primary/10"
            >
              {t('emptyWorkspace.actions.lead.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-muted">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground/80 dark:bg-muted dark:text-muted-foreground">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-muted-foreground dark:text-white">
              {t('emptyWorkspace.actions.property.title')}
            </CardTitle>
            <CardDescription className="leading-6 text-muted-foreground">
              {t('emptyWorkspace.actions.property.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={onAddProperty}
              className="min-h-11 w-full border-border dark:border-border"
            >
              {t('emptyWorkspace.actions.property.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-border bg-muted/70 shadow-none dark:border-border dark:bg-muted">
          <CardHeader className="pb-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-foreground/80 shadow-sm dark:bg-muted dark:text-muted-foreground">
              <FileUp className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-muted-foreground dark:text-white">
              {t('emptyWorkspace.actions.contract.title')}
            </CardTitle>
            <CardDescription className="leading-6 text-muted-foreground">
              {t('emptyWorkspace.actions.contract.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={onImportContract}
              className="min-h-11 w-full border-border bg-transparent dark:border-border"
            >
              {t('emptyWorkspace.actions.contract.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-white shadow-sm dark:border-border dark:bg-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary dark:text-primary">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base text-muted-foreground dark:text-white">
                {t('emptyWorkspace.checklist.title')}
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
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
                className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground/80 dark:border-border dark:bg-muted dark:text-muted-foreground"
              >
                <Circle className="h-4 w-4 flex-none text-muted-foreground/70" aria-hidden="true" />
                {t(`emptyWorkspace.checklist.items.${item}`)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
