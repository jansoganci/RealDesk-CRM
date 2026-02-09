import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Cloudflare Turnstile widget lifecycle.
 * Renders the widget into the given container, provides the token,
 * and cleans up on unmount.
 *
 * @param containerId - DOM element id to render the widget into
 */
export function useTurnstile(containerId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const renderWidget = () => {
      if (!isMounted) return;
      if (widgetIdRef.current) return;

      const container = document.getElementById(containerId);
      const turnstile = window.turnstile;
      const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

      if (!container || !turnstile || !siteKey) {
        if (!turnstile && isMounted) {
          timeoutId = setTimeout(renderWidget, 500);
        }
        return;
      }

      // Fallback DOM check (e.g. leftover widget from prior mount)
      if (container.querySelector('iframe')) return;

      try {
        const widgetId = turnstile.render(container, {
          sitekey: siteKey,
          callback: (t: string) => {
            if (!isMounted) return;
            setToken(t);
            setIsReady(true);
          },
          'error-callback': () => {
            if (!isMounted) return;
            setToken(null);
            setIsReady(false);
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setToken(null);
            setIsReady(false);
          },
          theme: 'light',
        });
        widgetIdRef.current = widgetId;
      } catch {
        // Render failed — widget stays unavailable
      }

      // Stop polling once render attempted
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    };

    timeoutId = setTimeout(renderWidget, 100);

    checkInterval = setInterval(() => {
      if (window.turnstile) {
        renderWidget();
      }
    }, 200);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (checkInterval) clearInterval(checkInterval);

      try {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [containerId]);

  const resetWidget = useCallback(() => {
    setToken(null);
    setIsReady(false);
    try {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } catch {
      // Ignore reset errors
    }
  }, []);

  return { token, isReady, resetWidget };
}
