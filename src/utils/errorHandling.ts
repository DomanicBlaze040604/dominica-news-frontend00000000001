/**
 * Enhanced error handling utilities for API and application errors
 */

import React from 'react';
import { toast } from 'sonner';
import { config } from '../config/environment';

// Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: {
    data?: {
      error?: string;
      message?: string;
      details?: unknown;
    };
    status?: number;
    statusText?: string;
  };
}

export interface NetworkError extends Error {
  code?: string;
  isNetworkError: true;
}

export interface ValidationError extends Error {
  field?: string;
  value?: unknown;
  isValidationError: true;
}

// Error classification
export function classifyError(error: unknown): {
  type: 'network' | 'api' | 'validation' | 'auth' | 'unknown';
  message: string;
  shouldRetry: boolean;
  userMessage: string;
} {
  if (!error) {
    return {
      type: 'unknown',
      message: 'Unknown error occurred',
      shouldRetry: false,
      userMessage: 'An unexpected error occurred',
    };
  }

  const err = error as ApiError;

  // Network errors
  if (!err.response && (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error'))) {
    return {
      type: 'network',
      message: err.message || 'Network error',
      shouldRetry: true,
      userMessage: 'Connection problem. Please check your internet connection.',
    };
  }

  // Authentication errors
  if (err.response?.status === 401) {
    return {
      type: 'auth',
      message: 'Authentication failed',
      shouldRetry: false,
      userMessage: 'Your session has expired. Please log in again.',
    };
  }

  // Validation errors
  if (err.response?.status === 400) {
    return {
      type: 'validation',
      message: err.response.data?.error || err.response.data?.message || 'Validation error',
      shouldRetry: false,
      userMessage: err.response.data?.error || 'Please check your input and try again.',
    };
  }

  // Server errors
  if (err.response?.status && err.response.status >= 500) {
    return {
      type: 'api',
      message: `Server error: ${err.response.status}`,
      shouldRetry: true,
      userMessage: 'Server error. Please try again in a moment.',
    };
  }

  // Rate limiting
  if (err.response?.status === 429) {
    return {
      type: 'api',
      message: 'Rate limit exceeded',
      shouldRetry: true,
      userMessage: 'Too many requests. Please wait a moment and try again.',
    };
  }

  // Other API errors
  if (err.response?.status) {
    return {
      type: 'api',
      message: err.response.data?.error || err.response.statusText || 'API error',
      shouldRetry: false,
      userMessage: err.response.data?.error || 'Something went wrong. Please try again.',
    };
  }

  // Generic errors
  return {
    type: 'unknown',
    message: err.message || 'Unknown error',
    shouldRetry: false,
    userMessage: 'An unexpected error occurred. Please try again.',
  };
}

// Error notification system
export class ErrorNotificationService {
  private static instance: ErrorNotificationService;
  private notificationQueue: Array<{ message: string; type: string; timestamp: number }> = [];
  private readonly maxNotifications = 5;
  private readonly notificationWindow = 60000; // 1 minute

  static getInstance(): ErrorNotificationService {
    if (!ErrorNotificationService.instance) {
      ErrorNotificationService.instance = new ErrorNotificationService();
    }
    return ErrorNotificationService.instance;
  }

  private shouldShowNotification(message: string, type: string): boolean {
    const now = Date.now();
    
    // Clean old notifications
    this.notificationQueue = this.notificationQueue.filter(
      n => now - n.timestamp < this.notificationWindow
    );

    // Check if we've shown too many notifications recently
    if (this.notificationQueue.length >= this.maxNotifications) {
      return false;
    }

    // Check if we've shown this exact message recently
    const recentSimilar = this.notificationQueue.find(
      n => n.message === message && n.type === type && now - n.timestamp < 10000
    );

    return !recentSimilar;
  }

  showError(error: unknown, context?: string): void {
    const classified = classifyError(error);
    
    if (!this.shouldShowNotification(classified.userMessage, classified.type)) {
      return;
    }

    // Add to queue
    this.notificationQueue.push({
      message: classified.userMessage,
      type: classified.type,
      timestamp: Date.now(),
    });

    // Show notification
    const contextMessage = context ? `${context}: ${classified.userMessage}` : classified.userMessage;
    
    switch (classified.type) {
      case 'network':
        toast.error(contextMessage, {
          description: 'Check your connection and try again',
          duration: 5000,
        });
        break;
      case 'auth':
        toast.error(contextMessage, {
          description: 'Redirecting to login...',
          duration: 3000,
        });
        break;
      case 'validation':
        toast.error(contextMessage, {
          duration: 4000,
        });
        break;
      case 'api':
        if (classified.shouldRetry) {
          toast.error(contextMessage, {
            description: 'We\'ll retry automatically',
            duration: 4000,
          });
        } else {
          toast.error(contextMessage, {
            duration: 4000,
          });
        }
        break;
      default:
        toast.error(contextMessage, {
          duration: 4000,
        });
    }

    // Log error in development
    if (config.logging.enableConsole) {
      console.error(`Error in ${context || 'application'}:`, error);
    }
  }

  showSuccess(message: string): void {
    toast.success(message);
  }

  showInfo(message: string): void {
    toast.info(message);
  }

  showWarning(message: string): void {
    toast.warning(message);
  }
}

// Retry mechanism
export class RetryManager {
  private static retryAttempts = new Map<string, number>();
  private static readonly maxRetries = 3;
  private static readonly baseDelay = 1000;

  static async withRetry<T>(
    operation: () => Promise<T>,
    key: string,
    maxRetries: number = RetryManager.maxRetries
  ): Promise<T> {
    const attempts = RetryManager.retryAttempts.get(key) || 0;

    try {
      const result = await operation();
      // Reset attempts on success
      RetryManager.retryAttempts.delete(key);
      return result;
    } catch (error) {
      const classified = classifyError(error);
      
      if (!classified.shouldRetry || attempts >= maxRetries) {
        RetryManager.retryAttempts.delete(key);
        throw error;
      }

      // Increment attempts
      RetryManager.retryAttempts.set(key, attempts + 1);
      
      // Calculate delay with exponential backoff
      const delay = RetryManager.baseDelay * Math.pow(2, attempts);
      
      if (config.logging.enableConsole) {
        console.log(`Retrying operation "${key}" in ${delay}ms (attempt ${attempts + 1}/${maxRetries})`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry
      return RetryManager.withRetry(operation, key, maxRetries);
    }
  }

  static clearRetries(key?: string): void {
    if (key) {
      RetryManager.retryAttempts.delete(key);
    } else {
      RetryManager.retryAttempts.clear();
    }
  }
}

// Global error handler
export function setupGlobalErrorHandling(): void {
  const errorService = ErrorNotificationService.getInstance();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorService.showError(event.reason, 'Unhandled Promise');
    
    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    errorService.showError(event.error, 'Global Error');
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        console.error('Resource loading error:', target);
        errorService.showError(new Error(`Failed to load ${target.tagName.toLowerCase()}`), 'Resource Loading');
      }
    }
  }, true);
}

// Utility functions
export const errorHandler = ErrorNotificationService.getInstance();

export function handleApiError(error: unknown, context?: string): void {
  errorHandler.showError(error, context);
}

export function createErrorHandler(context: string) {
  return (error: unknown) => handleApiError(error, context);
}

// React hook for error handling
export function useErrorHandler() {
  const showError = React.useCallback((error: unknown, context?: string) => {
    errorHandler.showError(error, context);
  }, []);

  const showSuccess = React.useCallback((message: string) => {
    errorHandler.showSuccess(message);
  }, []);

  const showInfo = React.useCallback((message: string) => {
    errorHandler.showInfo(message);
  }, []);

  const showWarning = React.useCallback((message: string) => {
    errorHandler.showWarning(message);
  }, []);

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
}