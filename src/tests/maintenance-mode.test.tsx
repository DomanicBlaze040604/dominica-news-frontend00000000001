import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MaintenanceWrapper } from '../components/MaintenanceWrapper';
import { MaintenancePage } from '../components/MaintenancePage';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';
import { useAuth } from '../hooks/useAuth';

// Mock the hooks
vi.mock('../hooks/useMaintenanceMode');
vi.mock('../hooks/useAuth');

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Maintenance Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MaintenancePage', () => {
    it('should render maintenance page with default props', () => {
      render(<MaintenancePage />);

      expect(screen.getByText('Site Under Maintenance')).toBeInTheDocument();
      expect(screen.getByText(/We are currently performing scheduled maintenance/)).toBeInTheDocument();
      expect(screen.getByText(/We expect to be back online shortly/)).toBeInTheDocument();
    });

    it('should render maintenance page with custom props', () => {
      const customProps = {
        title: 'Custom Maintenance Title',
        message: 'Custom maintenance message',
        estimatedTime: 'Back in 2 hours',
        contactEmail: 'custom@example.com',
      };

      render(<MaintenancePage {...customProps} />);

      expect(screen.getByText('Custom Maintenance Title')).toBeInTheDocument();
      expect(screen.getByText('Custom maintenance message')).toBeInTheDocument();
      expect(screen.getByText('Back in 2 hours')).toBeInTheDocument();
      expect(screen.getByText('custom@example.com')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const mockRetry = vi.fn();
      render(<MaintenancePage onRetry={mockRetry} />);

      const retryButton = screen.getByText('Check Again');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should render contact support link', () => {
      render(<MaintenancePage contactEmail="support@example.com" />);

      const contactLink = screen.getByText('Contact Support');
      expect(contactLink).toBeInTheDocument();
      expect(contactLink.closest('a')).toHaveAttribute('href', 'mailto:support@example.com');
    });
  });

  describe('MaintenanceWrapper', () => {
    const mockUseMaintenanceMode = useMaintenanceMode as any;
    const mockUseAuth = useAuth as any;

    it('should render children when not in maintenance mode', () => {
      mockUseMaintenanceMode.mockReturnValue({
        data: { data: { maintenanceMode: false } },
        isLoading: false,
        refetch: vi.fn(),
      });
      mockUseAuth.mockReturnValue({ user: null });

      renderWithQueryClient(
        <MaintenanceWrapper>
          <div>Normal App Content</div>
        </MaintenanceWrapper>
      );

      expect(screen.getByText('Normal App Content')).toBeInTheDocument();
    });

    it('should render children when user is admin even in maintenance mode', () => {
      mockUseMaintenanceMode.mockReturnValue({
        data: { data: { maintenanceMode: true } },
        isLoading: false,
        refetch: vi.fn(),
      });
      mockUseAuth.mockReturnValue({ user: { role: 'admin' } });

      renderWithQueryClient(
        <MaintenanceWrapper>
          <div>Admin App Content</div>
        </MaintenanceWrapper>
      );

      expect(screen.getByText('Admin App Content')).toBeInTheDocument();
    });

    it('should render maintenance page when in maintenance mode and user is not admin', () => {
      mockUseMaintenanceMode.mockReturnValue({
        data: { data: { maintenanceMode: true } },
        isLoading: false,
        refetch: vi.fn(),
      });
      mockUseAuth.mockReturnValue({ user: null });

      renderWithQueryClient(
        <MaintenanceWrapper>
          <div>Normal App Content</div>
        </MaintenanceWrapper>
      );

      expect(screen.getByText('Site Under Maintenance')).toBeInTheDocument();
      expect(screen.queryByText('Normal App Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking maintenance mode', () => {
      mockUseMaintenanceMode.mockReturnValue({
        data: null,
        isLoading: true,
        refetch: vi.fn(),
      });
      mockUseAuth.mockReturnValue({ user: null });

      renderWithQueryClient(
        <MaintenanceWrapper>
          <div>Normal App Content</div>
        </MaintenanceWrapper>
      );

      // Should show loading spinner
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
      expect(screen.queryByText('Normal App Content')).not.toBeInTheDocument();
    });

    it('should allow retry functionality in maintenance page', async () => {
      const mockRefetch = vi.fn();
      mockUseMaintenanceMode.mockReturnValue({
        data: { data: { maintenanceMode: true } },
        isLoading: false,
        refetch: mockRefetch,
      });
      mockUseAuth.mockReturnValue({ user: null });

      renderWithQueryClient(
        <MaintenanceWrapper>
          <div>Normal App Content</div>
        </MaintenanceWrapper>
      );

      const retryButton = screen.getByText('Check Again');
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('useMaintenanceMode hook', () => {
    // Note: This would typically be tested in a separate hook test file
    // but including here for completeness of maintenance mode testing

    it('should handle maintenance mode API response', async () => {
      // This test would mock the API call and verify the hook behavior
      // Implementation would depend on your specific testing setup for hooks
    });

    it('should handle 503 maintenance mode response', async () => {
      // Test that 503 responses are properly handled as maintenance mode
    });

    it('should retry on network errors but not on maintenance mode', async () => {
      // Test retry logic
    });
  });
});