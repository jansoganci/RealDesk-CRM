import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/gtm';

/**
 * GTM Page View Tracker
 * Automatically tracks virtual pageviews on route changes in SPA
 * Place this component inside BrowserRouter
 */
export function GTMPageViewTracker(): null {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
}
