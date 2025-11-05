import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import React from 'react';

// Import components to test
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminCategories } from '../pages/admin/AdminCategories';
import { AdminArticles } from '../pages/admin/AdminArticles';

// Import services
import { authService } from '../services/auth';
import { categoriesService } from '../services/categories';
import { articlesService } from '../services/articles';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Frontend-Backend Integration Tests', () => {
  let authToken: string | null = null;
  let testCategoryId: string | null = null;

  beforeAll(async () => {
    // Authenticate for tests
    try {
      const response = await authService.login({
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      });
      authToken = response.data.token;
      localStorage.setItem('auth_token', authToken);
    } catch (error) {
      console.warn('Authentication failed for integration tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testCategoryId && authToken) {
      try {
        await categoriesService.deleteCategory(testCategoryId);
      } catch (error) {
        console.warn('Failed to clean up test category:', error);
      }
    }

    // Clean up auth
    if (authToken) {
      localStorage.removeItem('auth_token');
    }
  });

  beforeEach(() => {
    // Clear any existing toasts
    document.querySelectorAll('[data-sonner-toast]').forEach(toast => toast.remove());
  });

  describe('Admin Dashboard Integration', () => {
    it('should load dashboard with real data', async () => {
      if (!authToken) {
        console.warn('Skipping dashboard test - no auth token');
        return;
      }

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Check if dashboard cards are rendered
      expect(screen.getByText(/total articles/i)).toBeInTheDocument();
      expect(screen.getByText(/categories/i)).toBeInTheDocument();
    });

    it('should handle dashboard loading errors gracefully', async () => {
      // Remove auth token to simulate error
      const originalToken = localStorage.getItem('auth_token');
      localStorage.removeItem('auth_token');

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Should show fallback data or error state
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Restore token
      if (originalToken) {
        localStorage.setItem('auth_token', originalToken);
      }
    });
  });

  describe('Categories CRUD Integration', () => {
    it('should create, read, update, and delete categories', async () => {
      if (!authToken) {
        console.warn('Skipping CRUD test - no auth token');
        return;
      }

      // Test Create
      const createData = {
        name: 'Test Category Integration',
        slug: 'test-category-integration',
        description: 'Test category for integration testing'
      };

      const createResponse = await categoriesService.createCategory(createData);
      expect(createResponse.success).toBe(true);
      expect(createResponse.data.category.name).toBe(createData.name);
      testCategoryId = createResponse.data.category.id;

      // Test Read
      const readResponse = await categoriesService.getAdminCategories();
      expect(readResponse.success).toBe(true);
      const createdCategory = readResponse.data.find(cat => cat.id === testCategoryId);
      expect(createdCategory).toBeDefined();
      expect(createdCategory?.name).toBe(createData.name);

      // Test Update
      const updateData = {
        name: 'Updated Test Category',
        description: 'Updated description'
      };

      const updateResponse = await categoriesService.updateCategory(testCategoryId!, updateData);
      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.category.name).toBe(updateData.name);

      // Test Delete
      const deleteResponse = await categoriesService.deleteCategory(testCategoryId!);
      expect(deleteResponse.success).toBe(true);

      // Verify deletion
      const verifyResponse = await categoriesService.getAdminCategories();
      const deletedCategory = verifyResponse.data.find(cat => cat.id === testCategoryId);
      expect(deletedCategory).toBeUndefined();

      testCategoryId = null; // Mark as cleaned up
    }, 30000);

    it('should handle category form submission in UI', async () => {
      if (!authToken) {
        console.warn('Skipping UI test - no auth token');
        return;
      }

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Find and click the "Add Category" button
      const addButton = screen.getByText(/add category/i);
      fireEvent.click(addButton);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText(/category name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: 'UI Test Category' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      // Submit the form
      const submitButton = screen.getByText(/create category/i);
      fireEvent.click(submitButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/category created successfully/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 30000);
  });

  describe('Articles Integration', () => {
    it('should fetch and display articles', async () => {
      render(
        <TestWrapper>
          <AdminArticles />
        </TestWrapper>
      );

      // Wait for articles to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show articles table or empty state
      const articlesTable = screen.queryByRole('table');
      const emptyState = screen.queryByText(/no articles found/i);
      
      expect(articlesTable || emptyState).toBeTruthy();
    });

    it('should handle article filtering', async () => {
      const response = await articlesService.getAdminArticles({
        page: 1,
        limit: 10,
        status: 'published'
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('articles');
      expect(response.data).toHaveProperty('pagination');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Temporarily break the API URL
      const originalUrl = import.meta.env.VITE_API_URL;
      (import.meta.env as any).VITE_API_URL = 'http://invalid-url:9999/api';

      try {
        await categoriesService.getCategories();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe('ECONNREFUSED');
      } finally {
        // Restore original URL
        (import.meta.env as any).VITE_API_URL = originalUrl;
      }
    });

    it('should handle authentication errors', async () => {
      // Remove auth token
      const originalToken = localStorage.getItem('auth_token');
      localStorage.removeItem('auth_token');

      try {
        await categoriesService.createCategory({
          name: 'Test',
          slug: 'test',
          description: 'Test'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      } finally {
        // Restore token
        if (originalToken) {
          localStorage.setItem('auth_token', originalToken);
        }
      }
    });

    it('should handle validation errors', async () => {
      if (!authToken) {
        console.warn('Skipping validation test - no auth token');
        return;
      }

      try {
        await categoriesService.createCategory({
          name: '', // Invalid empty name
          slug: '',
          description: ''
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Real-time Data Sync', () => {
    it('should sync data after CRUD operations', async () => {
      if (!authToken) {
        console.warn('Skipping sync test - no auth token');
        return;
      }

      // Get initial count
      const initialResponse = await categoriesService.getAdminCategories();
      const initialCount = initialResponse.data.length;

      // Create a category
      const createResponse = await categoriesService.createCategory({
        name: 'Sync Test Category',
        slug: 'sync-test-category',
        description: 'Test sync'
      });
      const categoryId = createResponse.data.category.id;

      // Verify count increased
      const afterCreateResponse = await categoriesService.getAdminCategories();
      expect(afterCreateResponse.data.length).toBe(initialCount + 1);

      // Delete the category
      await categoriesService.deleteCategory(categoryId);

      // Verify count returned to original
      const afterDeleteResponse = await categoriesService.getAdminCategories();
      expect(afterDeleteResponse.data.length).toBe(initialCount);
    });
  });
});