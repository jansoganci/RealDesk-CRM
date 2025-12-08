import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { ROUTES } from '../../config/constants';
import { getBillingStatus } from '../../services/billingService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isEmailConfirmed } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const [billingLoading, setBillingLoading] = useState(true);
  const [hasActiveAccess, setHasActiveAccess] = useState<boolean | null>(null);

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

  // Check billing status after authentication is confirmed
  useEffect(() => {
    let isMounted = true;

    const checkBilling = async () => {
      // Only check billing if user is authenticated
      if (!user || !hasUser) {
        setBillingLoading(false);
        return;
      }

      // Skip billing check if already on billing subscribe page (prevent redirect loop)
      if (location.pathname === ROUTES.BILLING_SUBSCRIBE) {
        setHasActiveAccess(true);
        setBillingLoading(false);
        return;
      }

      try {
        const { hasActiveAccess } = await getBillingStatus();
        if (isMounted) {
          setHasActiveAccess(hasActiveAccess);
          setBillingLoading(false);
        }
      } catch (error) {
        console.error('[ProtectedRoute] Billing check error:', error);
        // Treat error as no access
        if (isMounted) {
          setHasActiveAccess(false);
          setBillingLoading(false);
        }
      }
    };

    // Only check billing after auth check is complete
    if (!loading && !isChecking) {
      checkBilling();
    }

    return () => {
      isMounted = false;
    };
  }, [user, hasUser, loading, isChecking, location.pathname]);

  // Show loading state while checking auth or billing
  if (loading || isChecking || billingLoading) {
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

  // Check billing access after authentication is confirmed
  // Skip billing check if already on billing subscribe page
  if (location.pathname === ROUTES.BILLING_SUBSCRIBE) {
    return <>{children}</>;
  }

  // Redirect to billing subscribe if no active access
  if (hasActiveAccess === false) {
    return <Navigate to={ROUTES.BILLING_SUBSCRIBE} replace />;
  }

  // Render children if user has active access
  if (hasActiveAccess === true) {
    return <>{children}</>;
  }

  // Fallback: render children if billing status is still null (shouldn't happen, but safe fallback)
  return <>{children}</>;
};
