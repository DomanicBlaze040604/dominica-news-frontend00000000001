import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string | null;
  isReporting: boolean;
  reportSent: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null,
      isReporting: false,
      reportSent: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to backend
    this.reportError(error, errorInfo);

    // Show user-friendly toast notification
    const userMessage = this.getUserFriendlyMessage(error);
    toast.error('Something went wrong', {
      description: userMessage,
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload(),
      },
    });
  }

  getUserFriendlyMessage = (error: Error): string => {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }

    // Permission errors
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return 'You don\'t have permission to perform this action.';
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'Please check your input and try again.';
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('server')) {
      return 'The server is experiencing issues. Please try again in a few minutes.';
    }

    // Default message
    return 'An unexpected error occurred. Our team has been notified and is working on a fix.';
  };

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
        errorId: this.state.errorId,
      };

      // Send to backend error tracking
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached', {
        description: 'Please refresh the page or contact support if the problem persists.',
      });
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });

    toast.info('Retrying...', {
      description: `Attempt ${this.state.retryCount + 1} of ${maxRetries}`,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportIssue = async () => {
    if (this.state.reportSent) return;

    this.setState({ isReporting: true });

    try {
      const errorDetails = {
        error: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId,
      };

      await fetch('/api/errors/user-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });

      this.setState({ reportSent: true });
      toast.success('Error report sent', {
        description: 'Thank you for helping us improve the application.',
      });
    } catch (error) {
      toast.error('Failed to send report', {
        description: 'Please try again or contact support directly.',
      });
    } finally {
      this.setState({ isReporting: false });
    }
  };

  copyErrorDetails = () => {
    const errorDetails = `
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      toast.success('Error details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy error details');
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.props.enableRetry !== false && this.state.retryCount < maxRetries;
      const userMessage = this.state.error ? this.getUserFriendlyMessage(this.state.error) : 'An unexpected error occurred.';

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                {userMessage}
              </CardDescription>
              {this.state.errorId && (
                <div className="mt-2 text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
                  <p className="text-xs text-red-700 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {this.state.retryCount > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Retry attempt: {this.state.retryCount} of {maxRetries}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  {canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      className="flex-1"
                      variant="default"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({maxRetries - this.state.retryCount} left)
                    </Button>
                  )}
                  <Button
                    onClick={this.handleGoHome}
                    className="flex-1"
                    variant="outline"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {this.props.showReportButton !== false && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={this.handleReportIssue}
                      disabled={this.state.isReporting || this.state.reportSent}
                      className="flex-1"
                      variant="secondary"
                    >
                      {this.state.isReporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending Report...
                        </>
                      ) : this.state.reportSent ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Report Sent
                        </>
                      ) : (
                        <>
                          <Bug className="w-4 h-4 mr-2" />
                          Report Issue
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={this.copyErrorDetails}
                      className="flex-1"
                      variant="ghost"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Details
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  If the problem persists, please contact our support team.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    toast.error('An error occurred', {
      description: error.message || 'Something went wrong. Please try again.',
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload(),
      },
    });
  }, []);

  return { handleError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};