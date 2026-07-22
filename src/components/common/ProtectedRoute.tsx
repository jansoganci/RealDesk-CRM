import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { ROUTES } from '../../config/constants';
import { useOrg } from '../../contexts/OrgContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isEmailConfirmed } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const { currentOrg, loading: orgLoading } = useOrg();

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

  // Keep rendering when an organization is already loaded during a background refresh.
  const isInitialOrgLoad = orgLoading && !currentOrg;
  if (loading || isChecking || isInitialOrgLoad) {
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

  // Step 2: Check onboarding before allowing application access
  // If user is authenticated but has NO organization, redirect to onboarding
  if (!currentOrg && !orgLoading) {
    if (location.pathname !== ROUTES.ONBOARDING) {
      return <Navigate to={ROUTES.ONBOARDING} replace />;
    }
    return <>{children}</>;
  }

  // If user has an organization, check onboarding status
  if (currentOrg) {
    // If already on onboarding page and onboarding is complete, redirect to dashboard
    if (location.pathname === ROUTES.ONBOARDING && currentOrg.onboarding_completed) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
    
    // If not on onboarding page and onboarding is incomplete, redirect to onboarding
    if (location.pathname !== ROUTES.ONBOARDING && !currentOrg.onboarding_completed) {
      return <Navigate to={ROUTES.ONBOARDING} replace />;
    }
    
    // If on onboarding page and onboarding is incomplete, allow it
    if (location.pathname === ROUTES.ONBOARDING && !currentOrg.onboarding_completed) {
      return <>{children}</>;
    }
  }

  return <>{children}</>;
};
