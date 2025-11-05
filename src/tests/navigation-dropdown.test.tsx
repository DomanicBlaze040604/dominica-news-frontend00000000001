import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CategoryDropdown } from '../components/CategoryDropdown';
import { categoriesService } from '../services/categories';

// Mock the categories service
vi.mock('../services/categories', () => ({
  categoriesService: {
    getCategoryPreview: vi.fn(),
  },
}));

// Mock LazyImage component
vi.mock('../components/LazyImage', () => ({
  LazyImage: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="lazy-image" />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: any) => <div className={className} data-testid="chevron-down" />,
  Clock: ({ className }: any) => <div className={className} data-testid="clock-icon" />,
  User: ({ className }: any) => <div className={className} data-testid="user-icon" />,
}));

const mockArticles = [
  {
    id: '1',
    title: 'Breaking Weather Update for Dominica',
    slug: 'breaking-weather-update',
    featuredImage: 'https://example.com/weather.jpg',
    author: { name: 'Weather Desk' },
    publishedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Hurricane Season Preparations Begin',
    slug: 'hurricane-season-preparations',
    featuredImage: 'https://example.com/hurricane.jpg',
    author: { name: 'Meteorology Team' },
    publishedAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    title: 'Tropical Storm Warning Issued',
    slug: 'tropical-storm-warning',
    featuredImage: null,
    author: { name: 'Emergency Services' },
    publishedAt: '2024-01-13T08:45:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CategoryDropdown Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Dropdown Functionality', () => {
    it('should render category name with chevron icon', () => {
      const Wrapper = createWrapper();
      
      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('Weather')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should show active state styling when isActive is true', () => {
      const Wrapper = createWrapper();
      
      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={true}
        />,
        { wrapper: Wrapper }
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-primary', 'border-b-2', 'border-primary');
    });

    it('should have correct link href', () => {
      const Wrapper = createWrapper();
      
      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/category/weather');
    });
  });

  describe('Hover Effects and Dropdown Display', () => {
    it('should show dropdown on mouse enter with delay', async () => {
      const Wrapper = createWrapper();
      
      // Mock successful API response
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      
      // Hover over the category
      fireEvent.mouseEnter(container!);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByText('Latest in Weather')).toBeInTheDocument();
      });

      // Verify API was called
      expect(categoriesService.getCategoryPreview).toHaveBeenCalledWith('weather', 5);
    });

    it('should hide dropdown on mouse leave with delay', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      
      // Show dropdown first
      fireEvent.mouseEnter(container!);
      await waitFor(() => {
        expect(screen.getByText('Latest in Weather')).toBeInTheDocument();
      });

      // Then hide it
      fireEvent.mouseLeave(container!);
      
      await waitFor(() => {
        expect(screen.queryByText('Latest in Weather')).not.toBeInTheDocument();
      }, { timeout: 300 });
    });

    it('should rotate chevron icon when dropdown is open', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      const chevron = screen.getByTestId('chevron-down');
      
      // Initially should have rotate-0
      expect(chevron).toHaveClass('rotate-0');

      // Hover to open dropdown
      fireEvent.mouseEnter(container!);
      
      await waitFor(() => {
        expect(chevron).toHaveClass('rotate-180');
      });
    });
  });

  describe('Article Preview Loading and Display', () => {
    it('should show loading state while fetching articles', async () => {
      const Wrapper = createWrapper();
      
      // Mock delayed response that never resolves during test
      let resolvePromise: any;
      vi.mocked(categoriesService.getCategoryPreview).mockImplementation(
        () => new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Latest in Weather')).toBeInTheDocument();
      });

      // Check for loading skeletons - look for elements with animate-pulse class
      await waitFor(() => {
        const loadingElements = document.querySelectorAll('.animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
      });

      // Clean up by resolving the promise
      if (resolvePromise) {
        resolvePromise({
          success: true,
          data: {
            category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
            articles: mockArticles,
            count: 3,
          },
        });
      }
    });

    it('should display article previews with correct information', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        expect(screen.getByText('Breaking Weather Update for Dominica')).toBeInTheDocument();
        expect(screen.getByText('Hurricane Season Preparations Begin')).toBeInTheDocument();
        expect(screen.getByText('Tropical Storm Warning Issued')).toBeInTheDocument();
      });

      // Check author names
      expect(screen.getByText('Weather Desk')).toBeInTheDocument();
      expect(screen.getByText('Meteorology Team')).toBeInTheDocument();
      expect(screen.getByText('Emergency Services')).toBeInTheDocument();

      // Check dates are formatted
      expect(screen.getByText('Jan 15')).toBeInTheDocument();
      expect(screen.getByText('Jan 14')).toBeInTheDocument();
      expect(screen.getByText('Jan 13')).toBeInTheDocument();
    });

    it('should display images for articles with featured images', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        const images = screen.getAllByTestId('lazy-image');
        expect(images).toHaveLength(2); // Two articles have featured images
        
        expect(images[0]).toHaveAttribute('src', 'https://example.com/weather.jpg');
        expect(images[1]).toHaveAttribute('src', 'https://example.com/hurricane.jpg');
      });
    });

    it('should show placeholder for articles without featured images', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        // Should show category initial for article without image
        const placeholders = screen.getAllByText('W'); // Weather category initial
        expect(placeholders.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no articles are available', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: [],
          count: 0,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        expect(screen.getByText('No articles available yet')).toBeInTheDocument();
        expect(screen.getByText('Check back soon for updates')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links and Interactions', () => {
    it('should have correct article links', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        const articleLinks = screen.getAllByRole('link');
        
        // Find article links (excluding category link and "View All" link)
        const articleHrefs = articleLinks
          .map(link => link.getAttribute('href'))
          .filter(href => href?.startsWith('/articles/'));
        
        expect(articleHrefs).toContain('/articles/breaking-weather-update');
        expect(articleHrefs).toContain('/articles/hurricane-season-preparations');
        expect(articleHrefs).toContain('/articles/tropical-storm-warning');
      });
    });

    it('should have "View All" link pointing to category page', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        const viewAllLink = screen.getByText('View All →');
        expect(viewAllLink).toHaveAttribute('href', '/category/weather');
      });
    });

    it('should show additional articles count when more than 4 articles', async () => {
      const Wrapper = createWrapper();
      
      const manyArticles = [
        ...mockArticles,
        { id: '4', title: 'Article 4', slug: 'article-4', featuredImage: null, author: { name: 'Author 4' }, publishedAt: '2024-01-12T10:00:00Z' },
        { id: '5', title: 'Article 5', slug: 'article-5', featuredImage: null, author: { name: 'Author 5' }, publishedAt: '2024-01-11T10:00:00Z' },
        { id: '6', title: 'Article 6', slug: 'article-6', featuredImage: null, author: { name: 'Author 6' }, publishedAt: '2024-01-10T10:00:00Z' },
      ];
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: manyArticles,
          count: 6,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        expect(screen.getByText('+2 more articles')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain proper styling classes for responsive design', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockResolvedValue({
        success: true,
        data: {
          category: { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
          articles: mockArticles,
          count: 3,
        },
      });

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      await waitFor(() => {
        // Find the dropdown container with the w-96 class
        const dropdownContainer = document.querySelector('.w-96');
        expect(dropdownContainer).toBeInTheDocument();
        expect(dropdownContainer).toHaveClass('w-96');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const Wrapper = createWrapper();
      
      vi.mocked(categoriesService.getCategoryPreview).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <CategoryDropdown
          categorySlug="weather"
          categoryName="Weather"
          isActive={false}
        />,
        { wrapper: Wrapper }
      );

      const container = screen.getByText('Weather').closest('div');
      fireEvent.mouseEnter(container!);

      // Should still show the dropdown header even if API fails
      await waitFor(() => {
        expect(screen.getByText('Latest in Weather')).toBeInTheDocument();
      });

      // Should show empty state or loading state, not crash
      expect(screen.getByText('No articles available yet')).toBeInTheDocument();
    });
  });
});
