import React, { Component, ReactNode } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {i18n.t('errors:boundary.title')}
            </h1>
            <p className="text-muted-foreground">
              {i18n.t('errors:boundary.description')}
            </p>
            {this.state.error && (
              <details className="text-left bg-muted p-4 rounded text-sm">
                <summary className="cursor-pointer font-semibold mb-2">
                  {i18n.t('errors:boundary.details')}
                </summary>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleReload} className="w-full">
              {i18n.t('errors:boundary.reload')}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
