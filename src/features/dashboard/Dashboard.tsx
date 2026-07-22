import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent } from '../../components/ui/card';
import { COLORS } from '@/config/colors';
import { useToast } from '@/components/ui/use-toast';
import { CompletionBanner } from '@/components/onboarding/CompletionBanner';
import { useOnboardingBanner } from '@/hooks/useOnboardingBanner';
import { useDailyBrief } from './hooks/useDailyBrief';
import { OverdueZone } from './components/OverdueZone';
import { HorizonZone } from './components/HorizonZone';
import { WaitingOnOthers } from './components/WaitingOnOthers';
import { ThisWeek } from './components/ThisWeek';
import { DailyBriefHeader } from './components/DailyBriefHeader';
import { DealHealthCard } from './components/DealHealthCard';
import { IncomeForecastCard } from './components/IncomeForecastCard';
import { ExpiringAgreementsCard } from '@/features/leads/components/ExpiringAgreementsCard';
import { LeadSourceBreakdownCard } from '@/features/leads/components/LeadSourceBreakdownCard';

const leadInsightsGrid = (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ExpiringAgreementsCard />
    <LeadSourceBreakdownCard />
  </div>
);

export const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { shouldShowBanner, dismissBanner, resumeOnboarding, isLoading: bannerLoading } = useOnboardingBanner();
  const { data, loading, error } = useDailyBrief();

  // Handle checkout success
  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout');

    if (checkoutSuccess === 'success') {
      toast({
        title: t('checkoutSuccess.title'),
        description: t('checkoutSuccess.description'),
        duration: 5000,
      });

      // Clear query parameter
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, t]);

  const overdueAndToday = [...data.overdue, ...data.dueToday];
  const hasActiveDeals = data.dealHealthCards.length > 0 || overdueAndToday.length > 0 || data.due3Days.length > 0;
  const attentionCount =
    overdueAndToday.length + data.due3Days.length + data.waitingOnOthers.length;

  return (
    <MainLayout title="Dashboard">
      <PageContainer>
        {shouldShowBanner && !bannerLoading && (
          <CompletionBanner
            onDismiss={dismissBanner}
            onResume={resumeOnboarding}
          />
        )}
        {loading ? (
          <Card>
            <CardContent className="py-6">
              <p className={`text-sm ${COLORS.gray.text600} dark:text-slate-300`}>{t('dailyBrief.loading')}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
            <CardContent className="py-6">
              <p className={`text-sm ${COLORS.danger.textDark}`}>{error}</p>
            </CardContent>
          </Card>
        ) : !hasActiveDeals ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="py-6">
                <p className={`text-sm ${COLORS.gray.text700} dark:text-slate-200`}>{t('dailyBrief.empty.noDeals')}</p>
              </CardContent>
            </Card>
            {leadInsightsGrid}
          </div>
        ) : (
          <div className="space-y-4">
            <DailyBriefHeader
              attentionCount={attentionCount}
              activeDealsCount={data.dealHealthCards.length}
            />
            <OverdueZone items={overdueAndToday} />
            <HorizonZone items={data.due3Days} />
            <WaitingOnOthers items={data.waitingOnOthers} />
            <ThisWeek items={data.due7Days} />
            <IncomeForecastCard />
            {leadInsightsGrid}
            {data.dealHealthCards.length > 0 && (
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${COLORS.gray.text900} dark:text-slate-100`}>
                  {t('dailyBrief.dealCard.title')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {data.dealHealthCards.map((card) => (
                    <DealHealthCard key={card.dealId} card={card} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
};
