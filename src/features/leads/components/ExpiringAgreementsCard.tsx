import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/config/constants';
import { COLORS } from '@/config/colors';
import { useExpiringAgreements } from '../hooks/useExpiringAgreements';

export function ExpiringAgreementsCard() {
  const { t } = useTranslation('leads');
  const navigate = useNavigate();
  const { agreements, loading, error } = useExpiringAgreements(30);

  const getExpiryBadge = (expirationDate: string) => {
    const daysLeft = differenceInDays(new Date(expirationDate), new Date());
    if (daysLeft <= 7) return { variant: 'destructive' as const, label: `${daysLeft}d` };
    if (daysLeft <= 14) return { variant: 'warning' as const, label: `${daysLeft}d` };
    return { variant: 'default' as const, label: `${daysLeft}d` };
  };

  return (
    <Card className="shadow-lg border-border dark:border-border bg-card/80 dark:bg-muted backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-warning" />
            <CardTitle className="text-sm font-semibold">
              {t('dashboard.expiringAgreements')}
            </CardTitle>
          </div>
          {agreements.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {agreements.length} {t('dashboard.expiring')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <p className={`text-sm ${COLORS.danger.textDark}`}>{error}</p>
        ) : agreements.length === 0 ? (
          <p className={`text-sm ${COLORS.gray.text500} dark:text-muted-foreground/70`}>{t('dashboard.noExpiringAgreements')}</p>
        ) : (
          <div className="space-y-2">
            {agreements.slice(0, 5).map((agreement) => {
              const badge = getExpiryBadge(agreement.expiration_date);
              return (
                <div
                  key={agreement.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted dark:hover:bg-muted cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(generatePath(ROUTES.LEAD_DETAIL, { id: agreement.lead_id }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(generatePath(ROUTES.LEAD_DETAIL, { id: agreement.lead_id }));
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t('dashboard.agreementLeadLabel', { id: agreement.lead_id.slice(0, 8) })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.expiresOn', {
                        date: format(new Date(agreement.expiration_date), 'MMM d, yyyy'),
                      })}
                    </p>
                  </div>
                  <Badge variant={badge.variant} className="ml-2 shrink-0 text-xs">
                    {badge.label}
                  </Badge>
                </div>
              );
            })}
            {agreements.length > 5 && (
              <Button
                variant="link"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(ROUTES.LEADS)}
              >
                {t('dashboard.viewAll', { count: agreements.length })}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
