import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminCategories } from '../pages/admin/AdminCategories';
import { categoriesService } from '../services/categories';

// Mock the services
vi.mock('../services/categories');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCategoriesService = categoriesService as {
  getAdminCategories: Mock;
  createCategory: Mock;
  updateCategory: Mock;
  deleteCategory: Mock;
  checkSlugAvailability: Mock;
  getCategoryBySlug: Mock;
};

// Test wrapper component
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
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Category Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Category CRUD Operations', () => {
    it('should display categories list', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'News',
          slug: 'news',
          description: 'Latest news updates',
          displayOrder: 1,
          articleCount: 5,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Sports',
          slug: 'sports',
          description: 'Sports coverage',
          displayOrder: 2,
          articleCount: 3,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('News')).toBeInTheDocument();
        expect(screen.getByText('Sports')).toBeInTheDocument();
        expect(screen.getByText('/news')).toBeInTheDocument();
        expect(screen.getByText('/sports')).toBeInTheDocument();
      });
    });

    it('should create a new category', async () => {
      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [],
      });

      mockCategoriesService.createCategory.mockResolvedValue({
        success: true,
        data: {
          category: {
            id: '1',
            name: 'Technology',
            slug: 'technology',
            description: 'Tech news',
            displayOrder: 1,
          },
        },
      });

      mockCategoriesService.checkSlugAvailability.mockResolvedValue({
        success: true,
        data: { available: true },
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Click new category button
      const newCategoryButton = await screen.findByText('New Category');
      fireEvent.click(newCategoryButton);

      // Fill form
      const nameInput = screen.getByLabelText('Category Name');
      fireEvent.change(nameInput, { target: { value: 'Technology' } });

      const descriptionInput = screen.getByLabelText('Description (Optional)');
      fireEvent.change(descriptionInput, { target: { value: 'Tech news' } });

      // Submit form
      const submitButton = screen.getByText('Create Category');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCategoriesService.createCategory).toHaveBeenCalledWith({
          name: 'Technology',
          slug: 'technology',
          description: 'Tech news',
          displayOrder: 0,
        });
      });
    });

    it('should update an existing category', async () => {
      const mockCategory = {
        id: '1',
        name: 'News',
        slug: 'news',
        description: 'Latest news',
        displayOrder: 1,
        articleCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [mockCategory],
      });

      mockCategoriesService.updateCategory.mockResolvedValue({
        success: true,
        data: { category: { ...mockCategory, name: 'Updated News' } },
      });

      mockCategoriesService.checkSlugAvailability.mockResolvedValue({
        success: true,
        data: { available: true },
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Wait for category to load and click edit
      await waitFor(() => {
        const editButtons = screen.getAllByRole('button');
        const editButton = editButtons.find(button => 
          button.querySelector('svg.lucide-square-pen')
        );
        expect(editButton).toBeTruthy();
        fireEvent.click(editButton!);
      });

      // Update name
      const nameInput = screen.getByDisplayValue('News');
      fireEvent.change(nameInput, { target: { value: 'Updated News' } });

      // Submit form
      const updateButton = screen.getByText('Update Category');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockCategoriesService.updateCategory).toHaveBeenCalledWith('1', {
          name: 'Updated News',
          slug: 'news',
          description: 'Latest news',
          displayOrder: 1,
        });
      });
    });

    it('should handle category deletion with article reassignment', async () => {
      const mockCategory = {
        id: '1',
        name: 'Old Category',
        slug: 'old-category',
        description: 'To be deleted',
        displayOrder: 1,
        articleCount: 3,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [mockCategory],
      });

      // First deletion attempt should fail with reassignment requirement
      mockCategoriesService.deleteCategory.mockRejectedValueOnce({
        response: {
          data: {
            data: {
              requiresReassignment: true,
              articlesCount: 3,
            },
          },
        },
      });

      // Second deletion attempt with force delete should succeed
      mockCategoriesService.deleteCategory.mockResolvedValueOnce({
        success: true,
        data: {
          articlesReassigned: 3,
          reassignedTo: 'uncategorized',
        },
      });

      // Mock window.confirm to return true
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Wait for category to load and click delete
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button');
        const deleteButton = deleteButtons.find(button => 
          button.querySelector('svg.lucide-trash2')
        );
        expect(deleteButton).toBeTruthy();
        fireEvent.click(deleteButton!);
      });

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          expect.stringContaining('This category "Old Category" has 3 article(s)')
        );
        expect(mockCategoriesService.deleteCategory).toHaveBeenCalledWith('1', {
          forceDelete: true,
        });
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Auto-slug Generation', () => {
    it('should generate slug from category name', async () => {
      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [],
      });

      mockCategoriesService.checkSlugAvailability.mockResolvedValue({
        success: true,
        data: { available: true },
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Click new category button
      const newCategoryButton = await screen.findByText('New Category');
      fireEvent.click(newCategoryButton);

      // Type in category name
      const nameInput = screen.getByLabelText('Category Name');
      fireEvent.change(nameInput, { target: { value: 'Breaking News Updates' } });

      // Check if slug is generated
      await waitFor(() => {
        const slugInput = screen.getByDisplayValue('breaking-news-updates');
        expect(slugInput).toBeInTheDocument();
      });
    });

    it('should validate slug uniqueness', async () => {
      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [],
      });

      // First check returns slug is taken
      mockCategoriesService.checkSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: false },
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Click new category button
      const newCategoryButton = await screen.findByText('New Category');
      fireEvent.click(newCategoryButton);

      // Type in category name
      const nameInput = screen.getByLabelText('Category Name');
      fireEvent.change(nameInput, { target: { value: 'News' } });

      await waitFor(() => {
        expect(mockCategoriesService.checkSlugAvailability).toHaveBeenCalledWith('news', undefined);
      });
    });
  });

  describe('Category-Article Relationships', () => {
    it('should display article count for each category', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'News',
          slug: 'news',
          description: 'Latest news',
          displayOrder: 1,
          articleCount: 15,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Sports',
          slug: 'sports',
          description: 'Sports coverage',
          displayOrder: 2,
          articleCount: 8,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('15 articles')).toBeInTheDocument();
        expect(screen.getByText('8 articles')).toBeInTheDocument();
      });
    });

    it('should prevent deletion of category with articles without confirmation', async () => {
      const mockCategory = {
        id: '1',
        name: 'Popular Category',
        slug: 'popular-category',
        description: 'Has many articles',
        displayOrder: 1,
        articleCount: 25,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [mockCategory],
      });

      mockCategoriesService.deleteCategory.mockRejectedValue({
        response: {
          data: {
            data: {
              requiresReassignment: true,
              articlesCount: 25,
            },
          },
        },
      });

      // Mock window.confirm to return false (user cancels)
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Wait for category to load and click delete
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button');
        const deleteButton = deleteButtons.find(button => 
          button.querySelector('svg.lucide-trash2')
        );
        expect(deleteButton).toBeTruthy();
        fireEvent.click(deleteButton!);
      });

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        // Should not call delete with forceDelete since user cancelled
        expect(mockCategoriesService.deleteCategory).not.toHaveBeenCalledWith('1', {
          forceDelete: true,
        });
      });
     

      confirmSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockCategoriesService.getAdminCategories.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Should still render the component without crashing
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    it('should show validation errors for invalid input', async () => {
      mockCategoriesService.getAdminCategories.mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <TestWrapper>
          <AdminCategories />
        </TestWrapper>
      );

      // Click new category button
      const newCategoryButton = await screen.findByText('New Category');
      fireEvent.click(newCategoryButton);

      // Try to submit with empty name
      const submitButton = screen.getByText('Create Category');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name must be at least 2 characters')).toBeInTheDocument();
      });
    });
  });
});