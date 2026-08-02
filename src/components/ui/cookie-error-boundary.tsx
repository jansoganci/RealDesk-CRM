"use client";

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import i18n from '@/i18n';

/**
 * Error logger interface for external error tracking services
 * Replace this noop implementation with your error tracking service (Sentry, etc.)
 */
interface ErrorLogger {
  (error: Error, context: Record<string, unknown>): void;
}

/**
 * Noop error logger (default - no external service integration)
 * Replace this with your error tracking service implementation when ready
 * 
 * Example implementation:
 * ```typescript
 * const errorLogger: ErrorLogger = (error, context) => {
 *   if (typeof Sentry !== 'undefined') {
 *     Sentry.captureException(error, { extra: context });
 *   }
 * };
 * ```
 */
const noopErrorLogger: ErrorLogger = (_error, _context) => {
  // No-op: External error tracking disabled by default
  // To enable: Replace this function with your error tracking service
};

interface CookieErrorBoundaryProps {
  children: ReactNode;
}

interface CookieErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Cookie Error Boundary
 * 
 * Catches errors in cookie consent components and shows a fallback UI.
 * Prevents cookie consent system failures from breaking the entire app.
 */
export class CookieErrorBoundary extends Component<
  CookieErrorBoundaryProps,
  CookieErrorBoundaryState
> {
  constructor(props: CookieErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CookieErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    const errorContext = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
    
    console.error('[CookieErrorBoundary] Error in cookie consent system:', errorContext);

    // Optional: Send to external error tracking service (Sentry, etc.)
    // To enable: Replace noopErrorLogger with your error tracking service
    // Example: errorTrackingService.captureException(error, { extra: errorContext });
    noopErrorLogger(error, errorContext);
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const cookiePolicyLink = '/legal/cookie-policy-en.html';
      const privacyPolicyLink = '/legal/privacy-policy-en.html';

      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-[400px] px-4 sm:px-0">
          <Card className="shadow-lg rounded-2xl border border-warning/30 bg-warning/15">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">
                    {i18n.t('cookie:errorBoundary.title')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {i18n.t('cookie:errorBoundary.body')}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a
                      href={cookiePolicyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary/80 transition-colors"
                    >
                      {i18n.t('cookie:banner.cookiePolicy')}
                    </a>
                    <span className="text-muted-foreground/40">•</span>
                    <a
                      href={privacyPolicyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary/80 transition-colors"
                    >
                      {i18n.t('cookie:banner.privacyPolicy')}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleDismiss}
                    className="mt-2 w-full sm:w-auto"
                  >
                    {i18n.t('cookie:errorBoundary.dismiss')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

