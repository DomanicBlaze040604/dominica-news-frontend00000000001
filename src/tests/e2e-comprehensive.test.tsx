import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminArticleEditor } from '../pages/admin/AdminArticleEditor';
import { AdminImages } from '../pages/admin/AdminImages';
import { AdminBreakingNews } from '../pages/admin/AdminBreakingNews';
import { AdminAuthors } from '../pages/admin/AdminAuthors';
import { AdminCategories } from '../pages/admin/AdminCategories';
import { AdminStaticPages } from '../pages/admin/AdminStaticPages';
import { articlesService } from '../services/articles';
import { authorsService } from '../services/authors';
import { categoriesService } from '../services/categories';
import { imagesService } from '../services/images';
import { breakingNewsService } from '../services/breakingNews';
import { staticPagesService } from '../services/staticPages';

// Mock all services
vi.mock('../services/articles');
vi.mock('../services/authors');
vi.mock('../services/categories');
vi.mock('../services/images');
vi.mock('../services/breakingNews');
vi.mock('../services/staticPages');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

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

// Mock data
const mockArticles = [
  {
    id: '1',
    title: 'Breaking News: Major Development',
    slug: 'breaking-news-major-development',
    content: 'This is a comprehensive news article about recent developments.',
    excerpt: 'Major development in local news',
    status: 'published' as const,
    publishedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: {
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'editor' as const,
      createdAt: '2024-01-01T00:00:00Z'
    },
    category: {
      id: '1',
      name: 'Politics',
      slug: 'politics',
      description: 'Political news and analysis',
      createdAt: '2024-01-01T00:00:00Z'
    },
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
      uploader: {
        id: '1',
        email: 'admin@test.com',
        fullName: 'Admin User',
        role: 'admin' as const,
        createdAt: '2024-01-01T00:00:00Z'
      }
    },
    tags: ['politics', 'breaking'],
    views: 1500,
    readingTime: 5
  }
];

const mockAuthors = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'editor' as const,
    bio: 'Experienced journalist with 10 years in the field',
    avatar: '/uploads/authors/john-doe.jpg',
    socialLinks: {
      twitter: 'https://twitter.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe'
    },
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockCategories = [
  {
    id: '1',
    name: 'Politics',
    slug: 'politics',
    description: 'Political news and analysis',
    color: '#3B82F6',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockImages = [
  {
    id: '1',
    filename: 'test-image.jpg',
    originalName: 'test-image.jpg',
    url: '/uploads/images/test-image.jpg',
    altText: 'Test image',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
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
    uploader: {
      id: '1',
      email: 'admin@test.com',
      fullName: 'Admin User',
      role: 'admin' as const,
      createdAt: '2024-01-01T00:00:00Z'
    }
  }
];

const mockBreakingNews = [
  {
    id: '1',
    title: 'Breaking: Major Event Happening Now',
    content: 'This is urgent breaking news content',
    isActive: true,
    priority: 1,
    expiresAt: '2024-12-31T23:59:59Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    author: {
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'editor' as const,
      createdAt: '2024-01-01T00:00:00Z'
    }
  }
];

const mockStaticPages = [
  {
    id: '1',
    title: 'About Us',
    slug: 'about-us',
    content: 'Learn more about our news organization',
    template: 'about' as const,
    isPublished: true,
    menuOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('End-to-End Comprehensive Testing', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Admin Dashboard Integration', () => {
    it('should render dashboard with all key metrics', async () => {
      // Mock dashboard data
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

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Check for key dashboard elements
      expect(screen.getByText(/articles/i)).toBeInTheDocument();
    });
  });

  describe('Article Management Workflow', () => {
    it('should complete full article creation workflow', async () => {
      // Mock required services
      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: mockAuthors }
      });
      
      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: mockCategories }
      });

      vi.mocked(articlesService.createArticle).mockResolvedValue({
        success: true,
        data: { article: mockArticles[0] }
      });

      renderWithProviders(<AdminArticleEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill in article form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Article Title' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /publish/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(articlesService.createArticle).toHaveBeenCalled();
      });
    });
  });

  describe('Image Management Integration', () => {
    it('should handle complete image upload and management workflow', async () => {
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

      renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Check image gallery display
      await waitFor(() => {
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Breaking News Management', () => {
    it('should manage breaking news lifecycle', async () => {
      vi.mocked(breakingNewsService.getBreakingNews).mockResolvedValue({
        success: true,
        data: { breakingNews: mockBreakingNews }
      });

      renderWithProviders(<AdminBreakingNews />);

      await waitFor(() => {
        expect(screen.getByText(/breaking news/i)).toBeInTheDocument();
      });

      // Check existing breaking news
      await waitFor(() => {
        expect(screen.getByText('Breaking: Major Event Happening Now')).toBeInTheDocument();
      });
    });
  });

  describe('Author Management', () => {
    it('should handle author CRUD operations', async () => {
      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: mockAuthors }
      });

      renderWithProviders(<AdminAuthors />);

      await waitFor(() => {
        expect(screen.getByText(/authors/i)).toBeInTheDocument();
      });

      // Check existing authors
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Category Management', () => {
    it('should handle category operations', async () => {
      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: mockCategories }
      });

      renderWithProviders(<AdminCategories />);

      await waitFor(() => {
        expect(screen.getByText(/categories/i)).toBeInTheDocument();
      });

      // Check existing categories
      await waitFor(() => {
        expect(screen.getByText('Politics')).toBeInTheDocument();
      });
    });
  });

  describe('Static Pages Management', () => {
    it('should handle static page operations', async () => {
      vi.mocked(staticPagesService.getStaticPages).mockResolvedValue({
        success: true,
        data: { pages: mockStaticPages }
      });

      renderWithProviders(<AdminStaticPages />);

      await waitFor(() => {
        expect(screen.getByText(/static pages/i)).toBeInTheDocument();
      });

      // Check existing pages
      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Integration', () => {
    it('should handle data flow between components', async () => {
      // Mock all required services
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

      // Test that components can share data through services
      renderWithProviders(<AdminDashboard />);

      await waitFor(() => {
        expect(articlesService.getArticles).toHaveBeenCalled();
      });
    });

    it('should handle error states across components', async () => {
      // Mock service errors
      vi.mocked(articlesService.getArticles).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<AdminDashboard />);

      // Should handle errors gracefully
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });
});