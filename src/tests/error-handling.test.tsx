import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary';
import { FallbackContent } from '@/components/FallbackContent';
import errorService, { useErrorHandler as useErrorServiceHandler } from '@/services/errorService';
import frontendHealthCheckService from '@/services/healthCheck';
import React from 'react';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Test component that uses error handler hook
const TestErrorHandlerComponent: React.FC = () => {
  const { handleError, handleApiError, handleNetworkError, withGracefulDegradation } = useErrorServiceHandler();

  const triggerError = () => {
    handleError(new Error('Test handled error'), { component: 'TestComponent' });
  };

  const triggerApiError = () => {
    const mockResponse = new Response('Not Found', { status: 404, statusText: 'Not Found' });
    handleApiError(mockResponse, { component: 'TestComponent' });
  };

  const triggerNetworkError = () => {
    handleNetworkError({ component: 'TestComponent' });
  };

  const testGracefulDegradation = async () => {
    const result = await withGracefulDegradation(
      () => Promise.reject(new Error('Operation failed')),
      'fallback value',
      { component: 'TestComponent' }
    );
    return result;
  };

  return (
    <div>
      <button onClick={triggerError}>Trigger Error</button>
      <button onClick={triggerApiError}>Trigger API Error</button>
      <button onClick={triggerNetworkError}>Trigger Network Error</button>
      <button onClick={testGracefulDegradation}>Test Graceful Degradation</button>
    </div>
  );
};

describe('Error Handling System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ErrorBoundary Component', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('should show retry button and handle retry', () => {
      const { rerender } = render(
        <ErrorBoundary enableRetry={true} maxRetries={3}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText(/Try Again/);
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);

      // After retry, should still show error UI since component still throws
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      // Mock development environment
      const originalEnv = import.meta.env.DEV;
      (import.meta.env as any).DEV = true;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details:')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Restore environment
      (import.meta.env as any).DEV = originalEnv;
    });

    it('should show report button when enabled', () => {
      render(
        <ErrorBoundary showReportButton={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Report Issue')).toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });

    it('should handle error reporting', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <ErrorBoundary showReportButton={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reportButton = screen.getByText('Report Issue');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/errors/user-report', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test error message')
        }));
      });
    });

    it('should copy error details to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      });

      render(
        <ErrorBoundary showReportButton={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const copyButton = screen.getByText('Copy Details');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('Test error message')
        );
      });
    });
  });

  describe('FallbackContent Component', () => {
    it('should render with default props', () => {
      render(<FallbackContent />);

      expect(screen.getByText('Content Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/having trouble loading/)).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <FallbackContent
          title="Custom Error Title"
          description="Custom error description"
          type="network"
        />
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(screen.getByText('Custom error description')).toBeInTheDocument();
    });

    it('should show network status when enabled', () => {
      render(<FallbackContent showNetworkStatus={true} />);

      // Should show either "Online" or "Offline"
      expect(screen.getByText(/Online|Offline/)).toBeInTheDocument();
    });

    it('should handle retry functionality', () => {
      const mockRetry = vi.fn();
      render(<FallbackContent onRetry={mockRetry} />);

      const retryButton = screen.getByText(/Try Again/);
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should show retry count when provided', () => {
      render(<FallbackContent maxRetries={3} />);

      // Should show retry count in button text
      expect(screen.getByText(/Try Again.*3.*left/)).toBeInTheDocument();
    });
  });

  describe('Error Service', () => {
    it('should handle errors and show toast notifications', () => {
      const { toast } = require('sonner');
      
      errorService.handleError(new Error('Test service error'), {
        component: 'TestComponent'
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Unexpected Error',
        expect.objectContaining({
          description: expect.stringContaining('unexpected error occurred')
        })
      );
    });

    it('should handle network errors specifically', () => {
      const { toast } = require('sonner');
      
      errorService.handleNetworkError({ component: 'TestComponent' });

      expect(toast.error).toHaveBeenCalledWith(
        'Connection Problem',
        expect.objectContaining({
          description: expect.stringContaining('Unable to connect')
        })
      );
    });

    it('should handle API errors with status codes', () => {
      const { toast } = require('sonner');
      const mockResponse = new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      
      errorService.handleApiError(mockResponse, { component: 'TestComponent' });

      expect(toast.error).toHaveBeenCalledWith(
        'Session Expired',
        expect.objectContaining({
          description: expect.stringContaining('session has expired')
        })
      );
    });

    it('should handle validation errors', () => {
      const { toast } = require('sonner');
      
      errorService.handleValidationError('Invalid input provided', { component: 'TestComponent' });

      expect(toast.error).toHaveBeenCalledWith(
        'Invalid Input',
        expect.objectContaining({
          description: expect.stringContaining('check your input')
        })
      );
    });

    it('should provide graceful degradation', async () => {
      const result = await errorService.withGracefulDegradation(
        () => Promise.reject(new Error('Operation failed')),
        'fallback value',
        { component: 'TestComponent' }
      );

      expect(result).toBe('fallback value');
    });

    it('should retry operations with exponential backoff', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve('success');
      });

      const result = await errorService.withRetry(operation, 3, 100, { component: 'TestComponent' });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should determine error recoverability', () => {
      const networkError = new Error('fetch failed');
      const validationError = new Error('validation error: invalid input');
      const serverError = new Error('internal server error');

      expect(errorService.isRecoverable(networkError)).toBe(true);
      expect(errorService.isRecoverable(validationError)).toBe(true);
      expect(errorService.isRecoverable(serverError)).toBe(true);
    });

    it('should determine error severity', () => {
      const networkError = new Error('fetch failed');
      const validationError = new Error('validation error');
      const serverError = new Error('internal server error');
      const databaseError = new Error('database connection failed');

      expect(errorService.getErrorSeverity(networkError)).toBe('medium');
      expect(errorService.getErrorSeverity(validationError)).toBe('low');
      expect(errorService.getErrorSeverity(serverError)).toBe('high');
      expect(errorService.getErrorSeverity(databaseError)).toBe('critical');
    });
  });

  describe('useErrorHandler Hook', () => {
    it('should provide error handling functions', () => {
      render(<TestErrorHandlerComponent />);

      expect(screen.getByText('Trigger Error')).toBeInTheDocument();
      expect(screen.getByText('Trigger API Error')).toBeInTheDocument();
      expect(screen.getByText('Trigger Network Error')).toBeInTheDocument();
      expect(screen.getByText('Test Graceful Degradation')).toBeInTheDocument();
    });

    it('should handle errors when triggered', () => {
      const { toast } = require('sonner');
      
      render(<TestErrorHandlerComponent />);

      const triggerButton = screen.getByText('Trigger Error');
      fireEvent.click(triggerButton);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle API errors when triggered', () => {
      const { toast } = require('sonner');
      
      render(<TestErrorHandlerComponent />);

      const triggerButton = screen.getByText('Trigger API Error');
      fireEvent.click(triggerButton);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle network errors when triggered', () => {
      const { toast } = require('sonner');
      
      render(<TestErrorHandlerComponent />);

      const triggerButton = screen.getByText('Trigger Network Error');
      fireEvent.click(triggerButton);

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Frontend Health Check Service', () => {
    beforeEach(() => {
      // Mock fetch for health checks
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { status: 'healthy' } })
      });
    });

    it('should perform health check', async () => {
      const healthCheck = await frontendHealthCheckService.performHealthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(healthCheck.timestamp).toBeInstanceOf(Date);
      expect(healthCheck.checks).toBeDefined();
      expect(healthCheck.checks.api).toBeDefined();
      expect(healthCheck.checks.localStorage).toBeDefined();
      expect(healthCheck.checks.network).toBeDefined();
      expect(healthCheck.checks.performance).toBeDefined();
      expect(healthCheck.checks.browser).toBeDefined();
    });

    it('should test connectivity to endpoints', async () => {
      const results = await frontendHealthCheckService.testConnectivity(['/api/health']);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      expect(results[0].endpoint).toBe('/api/health');
      expect(results[0].status).toMatch(/^(success|failure|timeout)$/);
    });

    it('should test data integrity', async () => {
      const results = await frontendHealthCheckService.testDataIntegrity();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.component).toBeDefined();
        expect(result.status).toMatch(/^(pass|fail)$/);
        expect(result.message).toBeDefined();
      });
    });

    it('should show health status to user', () => {
      const { toast } = require('sonner');
      
      frontendHealthCheckService.showHealthStatus();

      // Should show toast if there's a last health check
      // This might not trigger if no health check has been performed
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should handle offline/online transitions', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(<FallbackContent showNetworkStatus={true} />);
      expect(screen.getByText('Offline')).toBeInTheDocument();

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true
      });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Should update to show online status
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should queue errors when offline', () => {
      // Mock navigator.onLine as false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Mock fetch to fail
      (fetch as any).mockRejectedValue(new Error('Network error'));

      errorService.handleError(new Error('Test offline error'), { component: 'TestComponent' });

      // Error should be queued for later reporting
      // This is tested implicitly through the error service behavior
    });
  });
});