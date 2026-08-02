import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardContent } from '../../components/ui/card';
import { COLORS } from '@/config/colors';
import { useToast } from '@/components/ui/use-toast';
import { CompletionBanner } from '@/components/onboarding/CompletionBanner';
import { useOnboardingBanner } from '@/hooks/useOnboardingBanner';
import { useOrg } from '@/contexts/OrgContext';
import { useDailyBrief } from './hooks/useDailyBrief';
import { WaitingOnOthers } from './components/WaitingOnOthers';
import { DailyBriefHeader } from './components/DailyBriefHeader';
import { DealHealthCard } from './components/DealHealthCard';
import { IncomeForecastCard } from './components/IncomeForecastCard';
import { TeamPerformanceSummaryCard } from './components/TeamPerformanceSummaryCard';
import { FirstDashboardWelcome } from './components/FirstDashboardWelcome';
import { EmptyWorkspaceDashboard } from './components/EmptyWorkspaceDashboard';
import { NeedsAttentionSection } from './components/NeedsAttentionSection';
import { useDashboardExperience } from './hooks/useDashboardExperience';
import { mergeAttentionItems } from './utils/mergeAttentionItems';
import { ROUTES } from '@/config/constants';

export const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { shouldShowBanner, dismissBanner, resumeOnboarding, isLoading: bannerLoading } = useOnboardingBanner();
  const { isOwner } = useOrg();
  const { data, loading, error } = useDailyBrief();
  const {
    experience,
    loading: experienceLoading,
    markWelcomeSeen,
  } = useDashboardExperience();

  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout');

    if (checkoutSuccess === 'success') {
      toast({
        title: t('checkoutSuccess.title'),
        description: t('checkoutSuccess.description'),
        duration: 5000,
      });

      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, t]);

  const attentionItems = useMemo(() => mergeAttentionItems(data), [data]);
  const attentionCount = attentionItems.length + data.waitingOnOthers.length;

  const showWelcomeSaveError = () => {
    toast({
      title: t('dashboardExperience.saveError.title'),
      description: t('dashboardExperience.saveError.description'),
      variant: 'destructive',
    });
  };

  const acknowledgeAndNavigate = async (route: string) => {
    try {
      await markWelcomeSeen();
    } catch {
      showWelcomeSaveError();
    } finally {
      navigate(route);
    }
  };

  const continueLater = async () => {
    try {
      await markWelcomeSeen();
    } catch {
      showWelcomeSaveError();
    }
  };

  return (
    <MainLayout title="Dashboard">
      <PageContainer>
        {shouldShowBanner && !bannerLoading && (
          <CompletionBanner
            onDismiss={dismissBanner}
            onResume={resumeOnboarding}
          />
        )}
        {experienceLoading ? (
          <Card>
            <CardContent className="py-6">
              <p className={`text-sm ${COLORS.gray.text600}`}>
                {t('dashboardExperience.loading')}
              </p>
            </CardContent>
          </Card>
        ) : experience === 'first_visit' ? (
          <FirstDashboardWelcome
            onAddLead={() => void acknowledgeAndNavigate(ROUTES.LEADS)}
            onAddProperty={() => void acknowledgeAndNavigate(ROUTES.PROPERTIES)}
            onImportContract={() => void acknowledgeAndNavigate(ROUTES.CONTRACT_IMPORT)}
            onContinueLater={() => void continueLater()}
          />
        ) : experience === 'empty_workspace' ? (
          <EmptyWorkspaceDashboard
            onAddLead={() => navigate(ROUTES.LEADS)}
            onAddProperty={() => navigate(ROUTES.PROPERTIES)}
            onImportContract={() => navigate(ROUTES.CONTRACT_IMPORT)}
          />
        ) : loading ? (
          <Card>
            <CardContent className="py-6">
              <p className={`text-sm ${COLORS.gray.text600}`}>{t('dailyBrief.loading')}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className={`text-sm ${COLORS.danger.textDark}`}>{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <DailyBriefHeader
              attentionCount={attentionCount}
              activeDealsCount={data.dealHealthCards.length}
            />

            <NeedsAttentionSection items={attentionItems} />

            {data.waitingOnOthers.length > 0 && (
              <WaitingOnOthers items={data.waitingOnOthers} />
            )}

            {data.dealHealthCards.length > 0 && (
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${COLORS.gray.text900}`}>
                  {t('dailyBrief.dealCard.title')}
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.dealHealthCards.map((card) => (
                    <DealHealthCard key={card.dealId} card={card} />
                  ))}
                </div>
              </div>
            )}

            <section className="space-y-2 border-t border-border pt-4">
              <p className={`text-sm font-semibold ${COLORS.gray.text900}`}>
                {t('dailyBrief.moneySnapshot.title')}
              </p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <IncomeForecastCard />
                {isOwner && <TeamPerformanceSummaryCard />}
              </div>
            </section>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
};
