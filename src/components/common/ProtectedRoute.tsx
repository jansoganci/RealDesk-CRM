import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { ROUTES } from '../../config/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);

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
  }, [user, loading]);

  // Show loading state while checking
  if (loading || isChecking) {
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

  return <>{children}</>;
};
