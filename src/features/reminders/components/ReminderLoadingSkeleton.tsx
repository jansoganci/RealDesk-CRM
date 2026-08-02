import { MainLayout } from '../../../components/layout/MainLayout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { useTranslation } from 'react-i18next';

/**
 * Reminder Loading Skeleton Component
 * Displays skeleton loading state for the reminders page
 */

export function ReminderLoadingSkeleton() {
  const { t } = useTranslation('reminders');

  return (
    <MainLayout title={t('pageTitle')}>
      <PageContainer>
        <div className="space-y-4">
          {/* Tab skeleton */}
          <div className="grid w-full grid-cols-4 max-w-2xl">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-muted"
              />
            ))}
          </div>

          {/* Card skeletons */}
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                  <div className="h-10 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
