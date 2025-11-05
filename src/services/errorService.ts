import { toast } from 'sonner';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

class ErrorService {
  private errorQueue: Array<{ error: Error; context?: ErrorContext }> = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private getUserFriendlyError(error: Error, context?: ErrorContext): UserFriendlyError {
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || !this.isOnline) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        },
        severity: 'medium',
        recoverable: true
      };
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/admin/login'
        },
        severity: 'medium',
        recoverable: true
      };
    }

    // Permission errors
    if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action. Please contact an administrator.',
        severity: 'medium',
        recoverable: false
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        title: 'Invalid Input',
        message: 'Please check your input and try again. Make sure all required fields are filled correctly.',
        severity: 'low',
        recoverable: true
      };
    }

    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('server') || errorMessage.includes('internal')) {
      return {
        title: 'Server Error',
        message: 'The server is experiencing issues. Our team has been notified and is working on a fix.',
        action: {
          label: 'Try Again',
          onClick: () => window.location.reload()
        },
        severity: 'high',
        recoverable: true
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        title: 'Too Many Requests',
        message: 'You\'re making requests too quickly. Please wait a moment and try again.',
        severity: 'low',
        recoverable: true
      };
    }

    // File upload errors
    if (errorMessage.includes('file') && (errorMessage.includes('size') || errorMessage.includes('type'))) {
      return {
        title: 'File Upload Error',
        message: 'The file you\'re trying to upload is either too large or not supported. Please try a different file.',
        severity: 'low',
        recoverable: true
      };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      return {
        title: 'Database Error',
        message: 'We\'re having trouble accessing our database. Please try again in a few minutes.',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        },
        severity: 'critical',
        recoverable: true
      };
    }

    // Default error
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Our team has been notified and is working on a fix.',
      action: {
        label: 'Refresh Page',
        onClick: () => window.location.reload()
      },
      severity: 'medium',
      recoverable: true
    };
  }

  private async reportError(error: Error, context?: ErrorContext): Promise<void> {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
        context,
        errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      if (this.isOnline) {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(errorReport),
        });
      } else {
        // Queue error for later reporting
        this.errorQueue.push({ error, context });
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      // Queue the original error for later reporting
      this.errorQueue.push({ error, context });
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const { error, context } of errors) {
      try {
        await this.reportError(error, context);
      } catch (reportError) {
        console.error('Failed to process queued error:', reportError);
        // Re-queue if still failing
        this.errorQueue.push({ error, context });
      }
    }
  }

  handleError(error: Error, context?: ErrorContext): void {
    console.error('Error handled by ErrorService:', error, context);

    // Report error to backend
    this.reportError(error, context);

    // Get user-friendly error information
    const userError = this.getUserFriendlyError(error, context);

    // Show user-friendly toast notification
    toast.error(userError.title, {
      description: userError.message,
      action: userError.action ? {
        label: userError.action.label,
        onClick: userError.action.onClick,
      } : undefined,
      duration: userError.severity === 'critical' ? 10000 : 5000,
    });
  }

  handleApiError(response: Response, context?: ErrorContext): void {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    this.handleError(error, { ...context, action: 'api_request' });
  }

  handleNetworkError(context?: ErrorContext): void {
    const error = new Error('Network request failed');
    this.handleError(error, { ...context, action: 'network_request' });
  }

  handleValidationError(message: string, context?: ErrorContext): void {
    const error = new Error(`Validation error: ${message}`);
    this.handleError(error, { ...context, action: 'validation' });
  }

  // Method for graceful degradation
  withGracefulDegradation<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: ErrorContext
  ): Promise<T> {
    return operation().catch((error) => {
      this.handleError(error, { ...context, action: 'graceful_degradation' });
      return fallback;
    });
  }

  // Method for retry with exponential backoff
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          this.handleError(lastError, { ...context, action: 'retry_failed', metadata: { attempts: attempt + 1 } });
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.warn(`Retry attempt ${attempt + 1} after ${delay}ms delay:`, lastError.message);
      }
    }

    throw lastError!;
  }

  // Method to check if error is recoverable
  isRecoverable(error: Error): boolean {
    const userError = this.getUserFriendlyError(error);
    return userError.recoverable;
  }

  // Method to get error severity
  getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const userError = this.getUserFriendlyError(error);
    return userError.severity;
  }
}

// Create singleton instance
const errorService = new ErrorService();

export default errorService;

// React hook for using error service
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: ErrorContext) => {
    errorService.handleError(error, context);
  };

  const handleApiError = (response: Response, context?: ErrorContext) => {
    errorService.handleApiError(response, context);
  };

  const handleNetworkError = (context?: ErrorContext) => {
    errorService.handleNetworkError(context);
  };

  const handleValidationError = (message: string, context?: ErrorContext) => {
    errorService.handleValidationError(message, context);
  };

  const withGracefulDegradation = <T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: ErrorContext
  ) => {
    return errorService.withGracefulDegradation(operation, fallback, context);
  };

  const withRetry = <T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    baseDelay?: number,
    context?: ErrorContext
  ) => {
    return errorService.withRetry(operation, maxRetries, baseDelay, context);
  };

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    withGracefulDegradation,
    withRetry,
    isRecoverable: errorService.isRecoverable.bind(errorService),
    getErrorSeverity: errorService.getErrorSeverity.bind(errorService),
  };
};