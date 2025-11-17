import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { financialTransactionsService } from '../../../lib/serviceProxy';

interface UseFinanceAutomationProps {
  onDataChange: () => Promise<void>;
}

export const useFinanceAutomation = ({ onDataChange }: UseFinanceAutomationProps) => {
  const { t } = useTranslation(['finance']);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [lastAutomationRun, setLastAutomationRun] = useState<string | null>(null);

  const runAutomation = useCallback(async (force = false) => {
    // Check if automation has already run today
    if (!force) {
      const today = new Date().toISOString().split('T')[0];
      if (lastAutomationRun === today) {
        console.log('Automation already ran today, skipping...');
        return;
      }
    }

    setRunningAutomation(true);
    try {
      const count = await financialTransactionsService.generateRecurringTransactions();
      if (count > 0) {
        console.log(`Generated ${count} recurring transactions`);
        toast.success(t('finance:automation.transactionsGenerated', { count }));
        await onDataChange();
      } else {
        if (force) {
          toast.info(t('finance:automation.noTransactionsToGenerate'));
        } else {
          console.log('No recurring transactions to generate');
        }
      }
      setLastAutomationRun(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error running automation:', error);
      if (force) {
        toast.error(t('finance:automation.automationError'));
      }
      // Don't show error toast on mount, just log
    } finally {
      setRunningAutomation(false);
    }
  }, [lastAutomationRun, onDataChange, t]);

  return {
    runningAutomation,
    runAutomation,
  };
};

