import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getBillingStatus, type BillingStatusResponse } from '@/services/billingService';
import { useAuth } from './AuthContext';

interface BillingContextValue {
  billingStatus: BillingStatusResponse | null;
  billingLoading: boolean;
  billingError: string | null;
  refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextValue | undefined>(undefined);

export const BillingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [billingStatus, setBillingStatus] = useState<BillingStatusResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState<boolean>(true);
  const [billingError, setBillingError] = useState<string | null>(null);

  const refreshBilling = useCallback(async () => {
    if (authLoading) {
      setBillingLoading(true);
      return;
    }

    if (!user) {
      setBillingStatus(null);
      setBillingLoading(false);
      setBillingError(null);
      return;
    }

    setBillingLoading(true);
    try {
      const status = await getBillingStatus();
      setBillingStatus(status);
      setBillingError(null);
    } catch (error) {
      console.error('[Billing] Failed to refresh billing status', error);
      setBillingError(error instanceof Error ? error.message : 'Unknown billing error');
    } finally {
      setBillingLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) {
      setBillingLoading(true);
      return;
    }

    if (!user) {
      setBillingStatus(null);
      setBillingLoading(false);
      setBillingError(null);
      return;
    }

    refreshBilling();
  }, [authLoading, refreshBilling, user]);

  const value = useMemo(
    () => ({
      billingStatus,
      billingLoading,
      billingError,
      refreshBilling,
    }),
    [billingStatus, billingLoading, billingError, refreshBilling]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
