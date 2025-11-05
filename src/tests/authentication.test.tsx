import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Auth from '../pages/Auth';
import { mockAuthToken, clearAuthToken } from './setup';
import { api } from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Test component that uses auth
const TestComponent = () => {
  const { user, isAuthenticated, isAdmin, login, logout, changePassword, updateProfile } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-role">{user?.role || 'no-role'}</div>
      <div data-testid="is-admin">{isAdmin ? 'admin' : 'not-admin'}</div>
      <div data-testid="user-name">{user?.fullName || 'no-name'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
      <button 
        data-testid="change-password-btn" 
        onClick={() => changePassword({ currentPassword: 'old', newPassword: 'new' })}
      >
        Change Password
      </button>
      <button 
        data-testid="update-profile-btn" 
        onClick={() => updateProfile({ fullName: 'Updated Name' })}
      >
        Update Profile
      </button>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthToken();
  });

  afterEach(() => {
    clearAuthToken();
  });

  describe('AuthProvider', () => {
    it('should initialize with no user when no token exists', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-role')).toHaveTextContent('no-role');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
    });

    it('should initialize with user when valid token exists', async () => {
      mockAuthToken();
      
      // Mock successful user fetch
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });

    it('should handle login successfully', async () => {
      const mockLoginResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
            token: 'new-token',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockLoginResponse);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid credentials',
          },
        },
      };

      vi.mocked(api.post).mockRejectedValueOnce(mockError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle logout successfully', async () => {
      mockAuthToken();
      vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });

    it('should handle password change successfully', async () => {
      mockAuthToken();
      vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const changePasswordBtn = screen.getByTestId('change-password-btn');
      fireEvent.click(changePasswordBtn);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/auth/change-password', {
          currentPassword: 'old',
          newPassword: 'new',
        });
      });

      // Should clear tokens after password change
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
      });
    });

    it('should handle profile update successfully', async () => {
      mockAuthToken();
      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Updated Name',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      vi.mocked(api.put).mockResolvedValueOnce({
        data: {
          success: true,
          data: { user: updatedUser },
        },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const updateProfileBtn = screen.getByTestId('update-profile-btn');
      fireEvent.click(updateProfileBtn);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/auth/profile', {
          fullName: 'Updated Name',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Updated Name');
      });
    });
  });

  describe('ProtectedRoute', () => {
    it('should render children when user is authenticated', async () => {
      mockAuthToken();
      
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should redirect to auth when user is not authenticated', () => {
      render(
        <TestWrapper>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render children when user is admin and admin is required', async () => {
      mockAuthToken();
      
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <ProtectedRoute requireAdmin>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      });
    });

    it('should redirect when user is not admin but admin is required', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user', // Not admin
        createdAt: new Date().toISOString(),
      }));
      
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'user',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <ProtectedRoute requireAdmin>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auth Page', () => {
    it('should render login form by default', () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      expect(screen.getByRole('tab', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should switch to register form when register tab is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const registerTab = screen.getByRole('tab', { name: /register/i });
      await user.click(registerTab);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should validate login form', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate register form', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const registerTab = screen.getByRole('tab', { name: /register/i });
      await user.click(registerTab);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate password requirements in register form', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const registerTab = screen.getByRole('tab', { name: /register/i });
      await user.click(registerTab);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'weak');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const registerTab = screen.getByRole('tab', { name: /register/i });
      await user.click(registerTab);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      await user.type(passwordInput, 'StrongPassword123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('should submit login form with valid data', async () => {
      const user = userEvent.setup();
      
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-token',
          },
        },
      });

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Token Management', () => {
    it('should handle expired tokens', async () => {
      // Set an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid';
      localStorage.setItem('auth_token', expiredToken);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      // Should clear expired token
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle invalid tokens', async () => {
      localStorage.setItem('auth_token', 'invalid-token');

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      // Should clear invalid token
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Role-based Access', () => {
    it('should correctly identify admin users', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify({
        id: '1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      }));

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'admin@example.com',
              fullName: 'Admin User',
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
      });
    });

    it('should correctly identify editor users', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify({
        id: '1',
        email: 'editor@example.com',
        fullName: 'Editor User',
        role: 'editor',
        createdAt: new Date().toISOString(),
      }));

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'editor@example.com',
              fullName: 'Editor User',
              role: 'editor',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('editor');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
      });
    });

    it('should correctly identify regular users', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify({
        id: '1',
        email: 'user@example.com',
        fullName: 'Regular User',
        role: 'user',
        createdAt: new Date().toISOString(),
      }));

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'user@example.com',
              fullName: 'Regular User',
              role: 'user',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('user');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
      });
    });
  });
});