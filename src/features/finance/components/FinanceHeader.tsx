import { Button } from '../../../components/ui/button';
import { Plus, RefreshCw, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FinanceHeaderProps {
  onAddTransaction: () => void;
  onRefresh: () => void;
  onRunAutomation: () => void;
  loading: boolean;
  runningAutomation: boolean;
}

export const FinanceHeader = ({
  onAddTransaction,
  onRefresh,
  onRunAutomation,
  loading,
  runningAutomation,
}: FinanceHeaderProps) => {
  const { t } = useTranslation(['finance', 'common']);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1" />
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRunAutomation}
          disabled={runningAutomation}
          className="gap-2"
        >
          <Play className={`h-4 w-4 ${runningAutomation ? 'animate-pulse' : ''}`} />
          {t('finance:automation.runNow')}
        </Button>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common:actions.refresh')}
        </Button>
        <Button onClick={onAddTransaction} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('finance:actions.addTransaction')}
        </Button>
      </div>
    </div>
  );
};

