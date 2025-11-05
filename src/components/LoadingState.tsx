import React from 'react';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'card';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

export const LoadingCard: React.FC<LoadingStateProps> = ({
  message = 'Loading content...',
  className = '',
}) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </CardContent>
  </Card>
);

interface NetworkStatusProps {
  isOnline?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline = navigator.onLine,
  onRetry,
  className = '',
}) => {
  if (isOnline) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <Wifi className="w-4 h-4" />
        <span className="text-sm">Connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
      <WifiOff className="w-4 h-4" />
      <span className="text-sm">No connection</span>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  onGoHome,
  className = '',
}) => (
  <Card className={className}>
    <CardContent className="p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <div className="flex justify-center space-x-2">
        {onRetry && (
          <Button size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onGoHome && (
          <Button size="sm" variant="outline" onClick={onGoHome}>
            Go Home
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There is no content to display at the moment.',
  action,
  className = '',
}) => (
  <Card className={className}>
    <CardContent className="p-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<Error | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((error: Error) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset,
  };
};