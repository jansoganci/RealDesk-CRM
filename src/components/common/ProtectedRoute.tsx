import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { ROUTES } from '../../config/constants';
import { useBilling } from '../../contexts/BillingContext';
import { useOrg } from '../../contexts/OrgContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isEmailConfirmed } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const { billingStatus, billingLoading } = useBilling();
  const { currentOrg, loading: orgLoading } = useOrg();
  const hasActiveAccess = billingStatus?.hasActiveAccess ?? null;
  const isTrialActive = billingStatus?.isTrial ?? false;

  // Additional check for session (helps with iOS Safari/PWA race conditions)
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Wait for auth context to finish loading first
        if (loading) {
          return;
        }

        // If auth context says no user, double-check with Supabase directly
        // This helps with iOS Safari/PWA timing issues
        if (!user) {
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted) {
            setHasUser(!!session?.user);
            setIsChecking(false);
          }
        } else {
          if (isMounted) {
            setHasUser(true);
            setIsChecking(false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (isMounted) {
          setHasUser(false);
          setIsChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [user, loading, isEmailConfirmed]);

  // Show loading state while checking auth, org, or billing
  if (loading || isChecking || orgLoading || billingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if no user found
  if (!user && !hasUser) {
    // Store intended destination for redirect after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If user exists but email is not confirmed, allow access
  // (Supabase will handle blocking unconfirmed users via RLS if configured)
  // We allow access here because email confirmation page handles the confirmation flow
  // Note: If email confirmation is required, users won't have a session until confirmed,
  // so this check is mainly for edge cases

  // Step 2: Check onboarding FIRST (before billing)
  // Only check if org is loaded (not null)
  if (currentOrg) {
    // If already on onboarding page and onboarding is complete, redirect to dashboard
    if (location.pathname === ROUTES.ONBOARDING && currentOrg.onboarding_completed) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
    
    // If not on onboarding page and onboarding is incomplete, redirect to onboarding
    if (location.pathname !== ROUTES.ONBOARDING && !currentOrg.onboarding_completed) {
      return <Navigate to={ROUTES.ONBOARDING} replace />;
    }
    
    // If on onboarding page and onboarding is incomplete, allow it (skip billing check)
    if (location.pathname === ROUTES.ONBOARDING && !currentOrg.onboarding_completed) {
      return <>{children}</>;
    }
  }

  // Check billing access after authentication is confirmed
  // Skip billing check if already on billing subscribe page
  if (location.pathname === ROUTES.BILLING_SUBSCRIBE) {
    return <>{children}</>;
  }

  // Redirect to billing subscribe if no active access
  if (hasActiveAccess === false && !isTrialActive) {
    return (
      <Navigate
        to={ROUTES.BILLING_SUBSCRIBE}
        replace
        state={{
          billingStatus,
          from: location.pathname,
        }}
      />
    );
  }

  // Render children if user has active access
  if (hasActiveAccess === true || isTrialActive) {
    return <>{children}</>;
  }

  // Fallback: render children if billing status is still null (shouldn't happen, but safe fallback)
  return <>{children}</>;
};
