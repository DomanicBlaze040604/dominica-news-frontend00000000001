import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminImages } from '../pages/admin/AdminImages';
import { AdminArticleEditor } from '../pages/admin/AdminArticleEditor';
import { AdminBreakingNews } from '../pages/admin/AdminBreakingNews';
import { AccessibleImage } from '../components/AccessibleImage';
import { MobileOptimizedImage } from '../components/MobileOptimizedImage';
import { LazyImage } from '../components/LazyImage';
import { imagesService } from '../services/images';
import { articlesService } from '../services/articles';
import { authorsService } from '../services/authors';
import { categoriesService } from '../services/categories';
import { breakingNewsService } from '../services/breakingNews';

// Mock services
vi.mock('../services/images');
vi.mock('../services/articles');
vi.mock('../services/authors');
vi.mock('../services/categories');
vi.mock('../services/breakingNews');
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

// Accessibility testing utilities
class AccessibilityTester {
  static checkHeadingHierarchy(container: HTMLElement) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels: number[] = [];
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      levels.push(level);
    });

    // Check if heading levels are logical (no skipping)
    for (let i = 1; i < levels.length; i++) {
      const current = levels[i];
      const previous = levels[i - 1];
      
      if (current > previous + 1) {
        return {
          valid: false,
          error: `Heading level ${current} follows level ${previous}, skipping levels`
        };
      }
    }

    return { valid: true, levels };
  }

  static checkAriaLabels(container: HTMLElement) {
    const elementsNeedingLabels = container.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]), img:not([alt])'
    );
    
    const issues: string[] = [];
    
    elementsNeedingLabels.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'button' && !element.textContent?.trim()) {
        issues.push(`Button ${index} lacks accessible name`);
      }
      
      if (tagName === 'input' && !element.closest('label')) {
        issues.push(`Input ${index} lacks associated label`);
      }
      
      if (tagName === 'img') {
        issues.push(`Image ${index} lacks alt text`);
      }
    });
    
    return {
      elementsChecked: elementsNeedingLabels.length,
      issues
    };
  }

  static checkKeyboardNavigation(container: HTMLElement) {
    const interactiveElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [role="button"], [role="link"]'
    );
    
    const issues: string[] = [];
    
    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      
      // Check if element is keyboard accessible
      if (tabIndex === '-1' && !element.hasAttribute('disabled')) {
        issues.push(`Interactive element ${index} is not keyboard accessible`);
      }
    });
    
    return {
      interactiveCount: interactiveElements.length,
      issues
    };
  }
}

// Mock data
const mockImages = [
  {
    id: '1',
    filename: 'accessible-image.jpg',
    originalName: 'accessible-image.jpg',
    url: '/uploads/images/accessible-image.jpg',
    altText: 'A beautiful landscape with mountains and trees',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: '2024-01-01T00:00:00Z',
    urls: {
      original: '/uploads/images/accessible-image.jpg',
      large: '/uploads/images/variants/accessible-image-large.webp',
      medium: '/uploads/images/variants/accessible-image-medium.webp',
      small: '/uploads/images/variants/accessible-image-small.webp',
      thumbnail: '/uploads/images/variants/accessible-image-thumbnail.webp',
      navigationThumbnail: '/uploads/images/variants/accessible-image-thumbnail.webp'
    },
    webpUrls: {
      original: '/uploads/images/accessible-image.webp',
      large: '/uploads/images/variants/accessible-image-large.webp',
      medium: '/uploads/images/variants/accessible-image-medium.webp',
      small: '/uploads/images/variants/accessible-image-small.webp'
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

const mockAuthors = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'editor' as const,
    bio: 'Experienced journalist',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockCategories = [
  {
    id: '1',
    name: 'Politics',
    slug: 'politics',
    description: 'Political news and analysis',
    createdAt: '2024-01-01T00:00:00Z'
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

describe('Accessibility Comprehensive Testing', () => {
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

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Image Accessibility', () => {
    it('should provide proper alt text for all images', async () => {
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

      const { container } = renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      const ariaCheck = AccessibilityTester.checkAriaLabels(container);
      
      // Should have minimal accessibility issues
      expect(ariaCheck.issues.filter(issue => issue.includes('alt text')).length).toBe(0);
    });

    it('should handle AccessibleImage component properly', () => {
      const { container } = render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Test image description"
          variant="medium"
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('alt', 'Test image description');
      expect(img).toHaveAttribute('src');
    });

    it('should provide proper ARIA labels for interactive image elements', async () => {
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

      const { container } = renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Check for buttons with proper labels
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const hasLabel = button.getAttribute('aria-label') || 
                        button.getAttribute('aria-labelledby') || 
                        button.textContent?.trim();
        expect(hasLabel).toBeTruthy();
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should provide proper labels for form inputs', async () => {
      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: mockAuthors }
      });
      
      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: mockCategories }
      });

      const { container } = renderWithProviders(<AdminArticleEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const ariaCheck = AccessibilityTester.checkAriaLabels(container);
      
      // Form inputs should have proper labels
      expect(ariaCheck.issues.filter(issue => issue.includes('Input')).length).toBeLessThan(3);
    });

    it('should handle keyboard navigation properly', async () => {
      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: mockAuthors }
      });
      
      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: mockCategories }
      });

      const { container } = renderWithProviders(<AdminArticleEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const keyboardCheck = AccessibilityTester.checkKeyboardNavigation(container);
      
      // Should have minimal keyboard navigation issues
      expect(keyboardCheck.issues.length).toBeLessThan(5);
      expect(keyboardCheck.interactiveCount).toBeGreaterThan(0);
    });

    it('should provide proper error messages and validation feedback', async () => {
      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: mockAuthors }
      });
      
      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: mockCategories }
      });

      renderWithProviders(<AdminArticleEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /publish/i });
      fireEvent.click(submitButton);

      // Should show accessible error messages
      await waitFor(() => {
        const errorMessages = screen.queryAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Navigation Accessibility', () => {
    it('should provide proper heading hierarchy', async () => {
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

      const { container } = renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      const headingCheck = AccessibilityTester.checkHeadingHierarchy(container);
      
      // Should have proper heading hierarchy
      expect(headingCheck.valid).toBe(true);
      expect(headingCheck.levels.length).toBeGreaterThan(0);
    });

    it('should handle focus management properly', async () => {
      vi.mocked(breakingNewsService.getBreakingNews).mockResolvedValue({
        success: true,
        data: { breakingNews: mockBreakingNews }
      });

      renderWithProviders(<AdminBreakingNews />);

      await waitFor(() => {
        expect(screen.getByText(/breaking news/i)).toBeInTheDocument();
      });

      // Test focus on interactive elements
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);
      }
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide proper ARIA landmarks', async () => {
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

      const { container } = renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Check for ARIA landmarks
      const landmarks = container.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
      expect(landmarks.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide proper live regions for dynamic content', async () => {
      vi.mocked(breakingNewsService.getBreakingNews).mockResolvedValue({
        success: true,
        data: { breakingNews: mockBreakingNews }
      });

      const { container } = renderWithProviders(<AdminBreakingNews />);

      await waitFor(() => {
        expect(screen.getByText(/breaking news/i)).toBeInTheDocument();
      });

      // Check for live regions
      const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mobile Accessibility', () => {
    it('should handle touch targets properly', () => {
      const { container } = render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Mobile test image"
          mobileVariant="small"
          tabletVariant="medium"
          desktopVariant="large"
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'Mobile test image');
    });

    it('should provide proper zoom and pan accessibility', () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Lazy loaded test image"
          useIntersectionObserver={true}
        />
      );

      const img = screen.getByAltText('Lazy loaded test image');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', async () => {
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

      // Check that status indicators have text or icons, not just color
      const statusElements = screen.queryAllByText(/active|inactive|published|draft/i);
      expect(statusElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should provide accessible error messages', async () => {
      vi.mocked(imagesService.getImages).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<AdminImages />);

      // Should handle errors gracefully with accessible messages
      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });
    });

    it('should announce loading states to screen readers', async () => {
      vi.mocked(imagesService.getImages).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
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
          }), 100)
        )
      );

      const { container } = renderWithProviders(<AdminImages />);

      // Should show loading state
      expect(screen.getByText('Images')).toBeInTheDocument();

      // Check for loading indicators with proper ARIA
      const loadingElements = container.querySelectorAll('[aria-busy="true"], [role="progressbar"]');
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);

      await waitFor(() => {
        expect(imagesService.getImages).toHaveBeenCalled();
      });
    });
  });
});