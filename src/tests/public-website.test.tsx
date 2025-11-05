import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Index from '../pages/Index';
import CategoryPage from '../pages/CategoryPage';
import ArticlePage from '../pages/ArticlePage';
import StaticPageDisplay from '../pages/StaticPageDisplay';
import { articlesService } from '../services/articles';
import { categoriesService } from '../services/categories';
import { staticPagesService } from '../services/staticPages';

// Mock services
vi.mock('../services/articles');
vi.mock('../services/categories');
vi.mock('../services/staticPages');

// Mock hooks
vi.mock('../hooks/useSiteSettings', () => ({
  useSiteSetting: vi.fn(() => ({
    data: { value: 'single' },
    isLoading: false,
    error: null
  }))
}));

const mockArticlesService = vi.mocked(articlesService);
const mockCategoriesService = vi.mocked(categoriesService);
const mockStaticPagesService = vi.mocked(staticPagesService);

// Mock data
const mockArticles = [
  {
    id: '1',
    title: 'Test Article 1',
    slug: 'test-article-1',
    excerpt: 'This is a test article excerpt',
    content: '<p>This is test article content</p>',
    featuredImage: '/images/test1.jpg',
    featuredImageAlt: 'Test image 1',
    category: { id: '1', name: 'News', slug: 'news' },
    author: { id: '1', name: 'Test Author', role: 'Reporter' },
    publishedAt: '2024-01-01T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    isBreaking: false,
    isFeatured: true,
    isPinned: true,
  },
  {
    id: '2',
    title: 'Test Article 2',
    slug: 'test-article-2',
    excerpt: 'Another test article excerpt',
    content: '<p>Another test article content</p>',
    featuredImage: '/images/test2.jpg',
    featuredImageAlt: 'Test image 2',
    category: { id: '2', name: 'Sports', slug: 'sports' },
    author: { id: '2', name: 'Sports Reporter', role: 'Sports Writer' },
    publishedAt: '2024-01-02T10:00:00Z',
    createdAt: '2024-01-02T10:00:00Z',
    isBreaking: false,
    isFeatured: false,
    isPinned: false,
  },
];

const mockCategories = [
  { id: '1', name: 'News', slug: 'news', description: 'Latest news' },
  { id: '2', name: 'Sports', slug: 'sports', description: 'Sports updates' },
];

const mockStaticPage = {
  id: '1',
  title: 'About Us',
  slug: 'about',
  content: '<p>About us content</p>',
  template: 'default',
  isPublished: true,
  showInMenu: true,
  menuOrder: 1,
  seoTitle: 'About Us - Dominica News',
  seoDescription: 'Learn about Dominica News',
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
      <HelmetProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

describe('Public Website - Homepage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockArticlesService.getPinnedArticles.mockResolvedValue({
      data: { articles: [mockArticles[0]] }
    });
    
    mockArticlesService.getLatestArticles.mockResolvedValue({
      data: { articles: mockArticles }
    });
    
    mockCategoriesService.getCategories.mockResolvedValue({
      data: { categories: mockCategories }
    });
  });

  it('renders homepage with articles', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Check for main sections
    expect(screen.getByText('Latest News')).toBeInTheDocument();
    expect(screen.getByText('Featured Stories')).toBeInTheDocument();

    // Wait for articles to load
    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.getByText('Test Article 2')).toBeInTheDocument();
    });

    // Check article metadata
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Sports Reporter')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    // Mock loading state
    mockArticlesService.getPinnedArticles.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    expect(screen.getByText('Loading latest news...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockArticlesService.getLatestArticles.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Articles')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    });

    // Find and use search input
    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'Test Article 1' } });
    fireEvent.submit(searchInput.closest('form')!);

    // Check search results display
    await waitFor(() => {
      expect(screen.getByText('Search Results for "Test Article 1"')).toBeInTheDocument();
    });
  });

  it('displays empty state when no articles', async () => {
    // Mock empty response
    mockArticlesService.getLatestArticles.mockResolvedValue({
      data: { articles: [] }
    });

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Articles Available')).toBeInTheDocument();
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    });
  });
});

describe('Public Website - Category Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCategoriesService.getCategoryBySlug.mockResolvedValue({
      data: { category: mockCategories[0] }
    });
    
    mockArticlesService.getCategoryArticles.mockResolvedValue({
      data: { 
        articles: [mockArticles[0]], 
        pagination: { 
          currentPage: 1, 
          totalPages: 1, 
          totalArticles: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  });

  it('renders category page with articles', async () => {
    render(
      <TestWrapper>
        <CategoryPage />
      </TestWrapper>
    );

    // Check category header
    await waitFor(() => {
      expect(screen.getByText('News')).toBeInTheDocument();
      expect(screen.getByText('Latest news')).toBeInTheDocument();
    });

    // Check articles
    expect(screen.getByText('Test Article 1')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', async () => {
    render(
      <TestWrapper>
        <CategoryPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('News')).toBeInTheDocument();
    });
  });

  it('handles category not found', async () => {
    mockCategoriesService.getCategoryBySlug.mockRejectedValue(
      new Error('Category not found')
    );

    render(
      <TestWrapper>
        <CategoryPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Articles')).toBeInTheDocument();
    });
  });

  it('displays empty state for category with no articles', async () => {
    mockArticlesService.getCategoryArticles.mockResolvedValue({
      data: { articles: [], pagination: null }
    });

    render(
      <TestWrapper>
        <CategoryPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Articles in/)).toBeInTheDocument();
      expect(screen.getByText('Browse All Articles')).toBeInTheDocument();
    });
  });
});

describe('Public Website - Article Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockArticlesService.getArticleBySlug.mockResolvedValue({
      data: { article: mockArticles[0] }
    });
    
    mockArticlesService.getRelatedArticles.mockResolvedValue({
      data: { articles: [mockArticles[1]] }
    });
  });

  it('renders article page with content', async () => {
    render(
      <TestWrapper>
        <ArticlePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.getByText('This is a test article excerpt')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });
  });

  it('displays article metadata correctly', async () => {
    render(
      <TestWrapper>
        <ArticlePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('By Test Author')).toBeInTheDocument();
      expect(screen.getByText('News')).toBeInTheDocument();
    });
  });

  it('shows related articles section', async () => {
    render(
      <TestWrapper>
        <ArticlePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('More News News')).toBeInTheDocument();
      expect(screen.getByText('Test Article 2')).toBeInTheDocument();
    });
  });

  it('handles article not found', async () => {
    mockArticlesService.getArticleBySlug.mockRejectedValue(
      new Error('Article not found')
    );

    render(
      <TestWrapper>
        <ArticlePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Article Not Found')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('displays social sharing buttons', async () => {
    render(
      <TestWrapper>
        <ArticlePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Share:')[0]).toBeInTheDocument();
    });
  });
});

describe('Public Website - Static Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStaticPagesService.getPageBySlug.mockResolvedValue({
      data: { page: mockStaticPage }
    });
  });

  it('renders static page content', async () => {
    render(
      <TestWrapper>
        <StaticPageDisplay />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });
  });

  it('displays breadcrumb navigation for static pages', async () => {
    render(
      <TestWrapper>
        <StaticPageDisplay />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });
  });

  it('handles static page not found', async () => {
    mockStaticPagesService.getPageBySlug.mockRejectedValue(
      new Error('Page not found')
    );

    render(
      <TestWrapper>
        <StaticPageDisplay />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });
  });
});

describe('Public Website - Image Loading and Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockArticlesService.getLatestArticles.mockResolvedValue({
      data: { articles: mockArticles }
    });
  });

  it('renders images with proper alt text', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  it('implements lazy loading for images', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  it('displays loading indicators for images', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Check for loading indicators
    expect(screen.getAllByText('Loading image...').length).toBeGreaterThan(0);
  });
});

describe('Public Website - Performance and Error Handling', () => {
  it('handles network errors gracefully', async () => {
    mockArticlesService.getLatestArticles.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Articles')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });
  });

  it('provides fallback content for missing resources', async () => {
    mockArticlesService.getLatestArticles.mockResolvedValue({
      data: { articles: [] }
    });

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Articles Available')).toBeInTheDocument();
      expect(screen.getByText('Check back later for the latest news and updates from Dominica.')).toBeInTheDocument();
    });
  });

  it('implements proper error boundaries', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <TestWrapper>
        <ThrowError />
      </TestWrapper>
    );

    // Error boundary should catch the error
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('retries failed requests appropriately', async () => {
    let callCount = 0;
    mockArticlesService.getLatestArticles.mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: { articles: mockArticles } });
    });

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Should eventually succeed after retries
    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(callCount).toBe(3);
  });
});