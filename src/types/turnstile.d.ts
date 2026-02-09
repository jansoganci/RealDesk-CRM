/**
 * Cloudflare Turnstile TypeScript Declarations
 */

interface TurnstileWidget {
  render: (element: string | HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  execute: (widgetId?: string) => void;
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  tabindex?: number;
  'retry-interval'?: number;
  'retry-timeout'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  'appearance'?: 'always' | 'execute' | 'interaction-only';
}

interface Window {
  turnstile?: TurnstileWidget;
}
