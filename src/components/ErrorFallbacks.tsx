import React from 'react';
import { AlertTriangle, Wifi, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
}

// Generic error fallback
export const GenericErrorFallback: React.FC<ErrorFallbackProps & { error?: Error }> = ({
  error,
  onRetry,
  onGoHome,
}) => (
  <div className="flex items-center justify-center min-h-[400px] px-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          We encountered an unexpected error. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {error.message}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Network error fallback
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  onGoHome,
}) => (
  <div className="flex items-center justify-center min-h-[400px] px-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Wifi className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle>Connection Problem</CardTitle>
        <CardDescription>
          Unable to connect to our servers. Please check your internet connection and try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <ul className="space-y-1">
            <li>• Check your internet connection</li>
            <li>• Try refreshing the page</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Loading error fallback
export const LoadingErrorFallback: React.FC<ErrorFallbackProps & { 
  resource?: string;
}> = ({
  resource = 'content',
  onRetry,
  onGoBack,
}) => (
  <div className="flex items-center justify-center min-h-[200px] px-4">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        </div>
        <CardTitle className="text-lg">Failed to Load</CardTitle>
        <CardDescription>
          Unable to load {resource}. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack} size="sm" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Inline error fallback for smaller components
export const InlineErrorFallback: React.FC<ErrorFallbackProps & {
  message?: string;
  compact?: boolean;
}> = ({
  message = 'Something went wrong',
  compact = false,
  onRetry,
}) => (
  <div className={`flex items-center justify-center ${compact ? 'py-4' : 'py-8'} px-4`}>
    <div className="text-center">
      <AlertTriangle className={`mx-auto mb-2 text-red-500 ${compact ? 'h-5 w-5' : 'h-8 w-8'}`} />
      <p className={`text-gray-600 mb-3 ${compact ? 'text-sm' : 'text-base'}`}>
        {message}
      </p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          size={compact ? 'sm' : 'default'}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  </div>
);

// Admin panel specific error fallback
export const AdminErrorFallback: React.FC<ErrorFallbackProps & {
  feature?: string;
}> = ({
  feature = 'feature',
  onRetry,
  onGoHome,
}) => (
  <div className="flex items-center justify-center min-h-[400px] px-4">
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle>Admin Panel Error</CardTitle>
        <CardDescription>
          There was an error loading the {feature}. This might be due to a temporary issue or insufficient permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-2">Possible causes:</p>
          <ul className="space-y-1">
            <li>• Session expired - try logging in again</li>
            <li>• Insufficient permissions</li>
            <li>• Temporary server issue</li>
            <li>• Network connectivity problem</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);