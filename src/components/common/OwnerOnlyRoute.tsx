import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useOrg } from '../../contexts/OrgContext';
import { ROUTES } from '../../config/constants';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface OwnerOnlyRouteProps {
  children: React.ReactNode;
}

/**
 * Route protection component that only allows organization owners to access the route.
 * Non-owners are redirected to the dashboard with an error message.
 */
export const OwnerOnlyRoute = ({ children }: OwnerOnlyRouteProps) => {
  const { isOwner, loading: orgLoading } = useOrg();
  const { t } = useTranslation(['common', 'team']);

  // Show error toast when non-owner tries to access
  useEffect(() => {
    if (!orgLoading && !isOwner) {
      toast.error(t('team:errors.accessDeniedTitle') || 'Access Denied', {
        description: t('team:errors.accessDeniedDescription') || 'Only organization owners can access this page.',
      });
    }
  }, [isOwner, orgLoading, t]);

  // Show loading state while checking org membership
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect non-owners to dashboard
  if (!isOwner) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Render children if user is owner
  return <>{children}</>;
};
