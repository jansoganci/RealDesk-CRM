import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { ROUTES } from '../../config/constants';
import { createLogger } from '../../lib/logger';

const callbackLogger = createLogger('AuthCallback');

/**
 * OAuth callback landing page.
 * Waits for auth + org contexts to settle, then routes the user
 * to the correct destination (onboarding vs dashboard).
 * Eliminates the flash that occurred when OAuth redirected directly to /dashboard.
 */
export const AuthCallback = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, loading: orgLoading, refreshOrg } = useOrg();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    // Wait for both contexts to finish loading
    if (authLoading || orgLoading) return;

    // No authenticated user — send to login
    if (!user) {
      callbackLogger.debug('No user after auth loaded, redirecting to login');
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    // Org loaded — route based on onboarding status
    if (currentOrg) {
      const savedRedirect = localStorage.getItem('oauth_redirect');
      localStorage.removeItem('oauth_redirect');

      if (!currentOrg.onboarding_completed) {
        callbackLogger.debug('Onboarding incomplete, redirecting to onboarding');
        navigate(ROUTES.ONBOARDING, { replace: true });
      } else {
        const destination = savedRedirect || ROUTES.DASHBOARD;
        callbackLogger.debug('Onboarding complete, redirecting to', destination);
        navigate(destination, { replace: true });
      }
      return;
    }

    // No org yet (brand-new user, DB trigger may still be running).
    // Retry a few times before falling back to onboarding.
    if (retryCount < maxRetries) {
      const timer = setTimeout(() => {
        callbackLogger.debug(`No org found, retry ${retryCount + 1}/${maxRetries}`);
        refreshOrg();
        setRetryCount(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Exhausted retries — new user without org, send to onboarding
    callbackLogger.debug('Org not found after retries, redirecting to onboarding');
    localStorage.removeItem('oauth_redirect');
    navigate(ROUTES.ONBOARDING, { replace: true });
  }, [authLoading, orgLoading, user, currentOrg, navigate, retryCount, refreshOrg]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
};
