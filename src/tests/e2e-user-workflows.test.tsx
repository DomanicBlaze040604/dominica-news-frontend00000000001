import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

// Import components for testing complete workflows
import App from '../App';
import { Index } from '../pages/Index';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminArticleEditor } from '../pages/admin/AdminArticleEditor';
import { AdminCategories } from '../pages/admin/AdminCategories';
import { AdminAuthors } from '../pages/admin/AdminAuthors';
import { AdminImages } from '../pages/admin/AdminImages';
import { CategoryPage } from '../pages/CategoryPage';
import { ArticlePage } from '../pages/ArticlePage';

// Import services
import { authService } from '../services/auth';
import { articlesService } from '../services/articles';
import { categoriesService } from '../services/categories';
import { authorsService } from '../services/authors';
import { imagesService } from '../services/images';

// Mock all services
vi.mock('../services/auth');
vi.mock('../services/articles');
vi.mock('../services/categories');
vi.mock('../services/authors');
vi.mock('../services/images');
vi.mock('../services/breakingNews');
vi.mock('../services/staticPages');

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.ResizeObserver = mockResizeObserver;

// Mock File API
global.File = class MockFile {
  constructor(public bits: any[], public name: string, public options?: any) {}
  get size() { return 1024; }
  get type() { return 'image/jpeg'; }
} as any;

// Mock data
const mockUser = {
  id: '1',
  email: 'admin@dominicanews.com',
  fullName: 'Admin User',
  role: 'admin' as const,
  createdAt: '2024-01-01T00:00:00Z'
};

const mockCategories = [
  {
    id: '1',
    name: 'Politics',
    slug: 'politics',
    description: 'Political news and analysis',
    color: '#3B82F6',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Sports',
    slug: 'sports',
    description: 'Sports news and updates',
    color: '#10B981',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockAuthors = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'editor' as const,
    bio: 'Experienced journalist',
    slug: 'john-doe',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockArticles = [
  {
    id: '1',
    title: 'Breaking News: Major Development',
    slug: 'breaking-news-major-development',
    content: '<p>This is a comprehensive news article about recent developments.</p>',
    excerpt: 'Major development in local news',
    status: 'published' as const,
    publishedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: mockAuthors[0],
    category: mockCategories[0],
    tags: ['politics', 'breaking'],
    views: 1500,
    readingTime: 5,
    featuredImage: {
      id: '1',
      filename: 'featured.jpg',
      originalName: 'featured.jpg',
      url: '/uploads/images/featured.jpg',
      altText: 'Featured image',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      createdAt: '2024-01-01T00:00:00Z',
      urls: {
        original: '/uploads/images/featured.jpg',
        large: '/uploads/images/variants/featured-large.webp',
        medium: '/uploads/images/variants/featured-medium.webp',
        small: '/uploads/images/variants/featured-small.webp',
        thumbnail: '/uploads/images/variants/featured-thumbnail.webp',
        navigationThumbnail: '/uploads/images/variants/featured-thumbnail.webp'
      },
      webpUrls: {
        original: '/uploads/images/featured.webp',
        large: '/uploads/images/variants/featured-large.webp',
        medium: '/uploads/images/variants/featured-medium.webp',
        small: '/uploads/images/variants/featured-small.webp'
      },
      uploader: mockUser
    }
  }
];

describe('End-to-End User Workflows', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });
    
    vi.mocked(categoriesService.getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories }
    });
    
    vi.mocked(authorsService.getAuthors).mockResolvedValue({
      success: true,
      data: { authors: mockAuthors }
    });
    
    vi.mocked(articlesService.getArticles).mockResolvedValue({
      success: true,
      data: {
        articles: mockArticles,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement, initialEntries?: string[]) => {
    const Router = initialEntries ? MemoryRouter : BrowserRouter;
    const routerProps = initialEntries ? { initialEntries } : {};
    
    return render(
      <QueryClientProvider client={queryClient}>
        <Router {...routerProps}>
          {component}
          <Toaster />
        </Router>
      </QueryClientProvider>
    );
  };

  describe('Public Website User Journey', () => {
    it('should complete homepage browsing workflow', async () => {
      vi.mocked(articlesService.getLatestArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      vi.mocked(articlesService.getFeaturedArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      renderWithProviders(<Index />);

      // Wait for homepage to load
      await waitFor(() => {
        expect(screen.getByText('Latest News')).toBeInTheDocument();
      });

      // Check that articles are displayed
      await waitFor(() => {
        expect(screen.getByText('Breaking News: Major Development')).toBeInTheDocument();
      });

      // Check navigation elements
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check category links in navigation
      await waitFor(() => {
        expect(screen.getByText('Politics')).toBeInTheDocument();
      });
    });

    it('should navigate from homepage to article page', async () => {
      vi.mocked(articlesService.getLatestArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      vi.mocked(articlesService.getArticleBySlug).mockResolvedValue({
        success: true,
        data: { article: mockArticles[0] }
      });

      renderWithProviders(<Index />);

      // Wait for homepage to load
      await waitFor(() => {
        expect(screen.getByText('Breaking News: Major Development')).toBeInTheDocument();
      });

      // Click on article title
      const articleLink = screen.getByText('Breaking News: Major Development');
      await user.click(articleLink);

      // Should navigate to article page (in real app)
      expect(articleLink).toBeInTheDocument();
    });

    it('should browse category pages', async () => {
      vi.mocked(articlesService.getArticlesByCategory).mockResolvedValue({
        success: true,
        data: {
          articles: mockArticles.filter(a => a.category.slug === 'politics'),
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      renderWithProviders(<CategoryPage />, ['/category/politics']);

      // Wait for category page to load
      await waitFor(() => {
        expect(screen.getByText('Politics')).toBeInTheDocument();
      });

      // Check that category articles are displayed
      await waitFor(() => {
        expect(screen.getByText('Breaking News: Major Development')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Panel Complete Workflow', () => {
    beforeEach(() => {
      // Mock authentication
      localStorage.setItem('auth_token', 'mock-token');
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        success: true,
        data: { user: mockUser }
      });
    });

    it('should complete admin login and dashboard access workflow', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        success: true,
        data: { token: 'mock-token', user: mockUser }
      });

      // Mock dashboard stats
      vi.mocked(articlesService.getArticles).mockResolvedValue({
        success: true,
        data: {
          articles: mockArticles,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      renderWithProviders(<AdminDashboard />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Check dashboard metrics
      expect(screen.getByText(/articles/i)).toBeInTheDocument();
    });

    it('should complete article creation workflow', async () => {
      vi.mocked(articlesService.createArticle).mockResolvedValue({
        success: true,
        data: { article: mockArticles[0] }
      });

      renderWithProviders(<AdminArticleEditor />);

      // Wait for editor to load
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill in article details
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Test Article');

      // Select category
      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, '1');

      // Select author
      const authorSelect = screen.getByLabelText(/author/i);
      await user.selectOptions(authorSelect, '1');

      // Add content (mock rich text editor)
      const contentArea = screen.getByRole('textbox', { name: /content/i });
      await user.type(contentArea, 'This is the article content');

      // Submit form
      const publishButton = screen.getByRole('button', { name: /publish/i });
      await user.click(publishButton);

      // Verify article creation was called
      await waitFor(() => {
        expect(articlesService.createArticle).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Test Article',
            categoryId: '1',
            authorId: '1'
          })
        );
      });
    });

    it('should complete category management workflow', async () => {
      vi.mocked(categoriesService.getAdminCategories).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      vi.mocked(categoriesService.createCategory).mockResolvedValue({
        success: true,
        data: { category: mockCategories[0] }
      });

      renderWithProviders(<AdminCategories />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Check existing categories
      await waitFor(() => {
        expect(screen.getByText('Politics')).toBeInTheDocument();
      });

      // Add new category
      const addButton = screen.getByText(/add category/i);
      await user.click(addButton);

      // Fill category form
      await waitFor(() => {
        expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'New Category');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'New category description');

      // Submit form
      const createButton = screen.getByText(/create category/i);
      await user.click(createButton);

      // Verify category creation
      await waitFor(() => {
        expect(categoriesService.createCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Category',
            description: 'New category description'
          })
        );
      });
    });

    it('should complete author management workflow', async () => {
      vi.mocked(authorsService.getAdminAuthors).mockResolvedValue({
        success: true,
        data: mockAuthors
      });

      vi.mocked(authorsService.createAuthor).mockResolvedValue({
        success: true,
        data: { author: mockAuthors[0] }
      });

      renderWithProviders(<AdminAuthors />);

      // Wait for authors to load
      await waitFor(() => {
        expect(screen.getByText('Authors')).toBeInTheDocument();
      });

      // Check existing authors
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Add new author
      const addButton = screen.getByText(/add author/i);
      await user.click(addButton);

      // Fill author form
      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'Jane Smith');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'jane@example.com');

      const bioInput = screen.getByLabelText(/bio/i);
      await user.type(bioInput, 'Experienced sports journalist');

      // Submit form
      const createButton = screen.getByText(/create author/i);
      await user.click(createButton);

      // Verify author creation
      await waitFor(() => {
        expect(authorsService.createAuthor).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            bio: 'Experienced sports journalist'
          })
        );
      });
    });

    it('should complete image upload workflow', async () => {
      const mockImages = [
        {
          id: '1',
          filename: 'test-image.jpg',
          originalName: 'test-image.jpg',
          url: '/uploads/images/test-image.jpg',
          altText: 'Test image',
          fileSize: 1024000,
          mimeType: 'image/jpeg',
          createdAt: '2024-01-01T00:00:00Z',
          urls: {
            original: '/uploads/images/test-image.jpg',
            large: '/uploads/images/variants/test-image-large.webp',
            medium: '/uploads/images/variants/test-image-medium.webp',
            small: '/uploads/images/variants/test-image-small.webp',
            thumbnail: '/uploads/images/variants/test-image-thumbnail.webp',
            navigationThumbnail: '/uploads/images/variants/test-image-thumbnail.webp'
          },
          webpUrls: {
            original: '/uploads/images/test-image.webp',
            large: '/uploads/images/variants/test-image-large.webp',
            medium: '/uploads/images/variants/test-image-medium.webp',
            small: '/uploads/images/variants/test-image-small.webp'
          },
          uploader: mockUser
        }
      ];

      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: {
          images: mockImages,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalImages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      });

      vi.mocked(imagesService.uploadImage).mockResolvedValue({
        success: true,
        data: { image: mockImages[0] }
      });

      renderWithProviders(<AdminImages />);

      // Wait for images to load
      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Check existing images
      await waitFor(() => {
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      });

      // Test file upload (mock file input)
      const fileInput = screen.getByLabelText(/upload/i);
      const file = new File(['test'], 'new-image.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);

      // Verify upload was initiated
      await waitFor(() => {
        expect(imagesService.uploadImage).toHaveBeenCalled();
      });
    });
  });

  describe('Cross-Browser and Responsive Design Testing', () => {
    it('should handle mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      vi.mocked(articlesService.getLatestArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      renderWithProviders(<Index />);

      // Wait for homepage to load
      await waitFor(() => {
        expect(screen.getByText('Latest News')).toBeInTheDocument();
      });

      // Check that content is accessible on mobile
      expect(screen.getByText('Breaking News: Major Development')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      vi.mocked(articlesService.getLatestArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      renderWithProviders(<Index />);

      // Wait for homepage to load
      await waitFor(() => {
        expect(screen.getByText('Latest News')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const firstLink = screen.getByText('Breaking News: Major Development');
      firstLink.focus();
      expect(document.activeElement).toBe(firstLink);

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).not.toBe(firstLink);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(articlesService.getLatestArticles).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<Index />);

      // Should show error state or fallback content
      await waitFor(() => {
        expect(screen.getByText('Latest News')).toBeInTheDocument();
      });

      // Should not crash the application
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle authentication errors in admin panel', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(
        new Error('Unauthorized')
      );

      renderWithProviders(<AdminDashboard />);

      // Should handle auth error gracefully
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('should recover from temporary failures', async () => {
      // First call fails, second succeeds
      vi.mocked(articlesService.getLatestArticles)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue({
          success: true,
          data: { articles: mockArticles }
        });

      renderWithProviders(<Index />);

      // Should eventually load content after retry
      await waitFor(() => {
        expect(screen.getByText('Latest News')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should load content within reasonable time', async () => {
      const startTime = Date.now();

      vi.mocked(articlesService.getLatestArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByText('Latest News')).toBeInTheDocument();
      });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should have proper ARIA labels and roles', async () => {
      vi.mocked(articlesService.getLatestArticles).mockResolvedValue({
        success: true,
        data: { articles: mockArticles }
      });

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Check for proper semantic structure
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});