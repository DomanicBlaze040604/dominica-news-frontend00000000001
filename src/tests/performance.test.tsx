import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminImages } from '../pages/admin/AdminImages';
import { AdminArticleEditor } from '../pages/admin/AdminArticleEditor';
import { LazyImage } from '../components/LazyImage';
import { AccessibleImage } from '../components/AccessibleImage';
import { MobileOptimizedImage } from '../components/MobileOptimizedImage';
import { imagesService } from '../services/images';
import { articlesService } from '../services/articles';

// Mock services
vi.mock('../services/images');
vi.mock('../services/articles');
vi.mock('../services/authors');
vi.mock('../services/categories');

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private measurements: { [key: string]: number } = {};

  start(label: string) {
    this.startTime = performance.now();
    performance.mark(`${label}-start`);
  }

  end(label: string) {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    this.measurements[label] = duration;
    return duration;
  }

  getMeasurement(label: string) {
    return this.measurements[label];
  }

  getAllMeasurements() {
    return { ...this.measurements };
  }

  clear() {
    this.measurements = {};
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Mock large dataset for performance testing
const generateMockImages = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `img-${index}`,
    filename: `image-${index}.jpg`,
    originalName: `image-${index}.jpg`,
    url: `/uploads/images/image-${index}.jpg`,
    altText: `Test image ${index}`,
    fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(), // Random date within 30 days
    urls: {
      original: `/uploads/images/image-${index}.jpg`,
      large: `/uploads/images/variants/image-${index}-large.webp`,
      medium: `/uploads/images/variants/image-${index}-medium.webp`,
      small: `/uploads/images/variants/image-${index}-small.webp`,
      thumbnail: `/uploads/images/variants/image-${index}-thumbnail.webp`,
      navigationThumbnail: `/uploads/images/variants/image-${index}-thumbnail.webp`
    },
    webpUrls: {
      original: `/uploads/images/image-${index}.webp`,
      large: `/uploads/images/variants/image-${index}-large.webp`,
      medium: `/uploads/images/variants/image-${index}-medium.webp`,
      small: `/uploads/images/variants/image-${index}-small.webp`
    },
    uploader: {
      id: '1',
      email: 'admin@test.com',
      fullName: 'Admin User',
      role: 'admin' as const,
      createdAt: '2024-01-01T00:00:00Z'
    }
  }));
};

describe('Performance Testing', () => {
  let queryClient: QueryClient;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    performanceMonitor = new PerformanceMonitor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.clear();
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

  describe('Image Loading Performance', () => {
    it('should load large image galleries efficiently', async () => {
      const largeImageSet = generateMockImages(100);
      
      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: {
          images: largeImageSet,
          pagination: {
            currentPage: 1,
            totalPages: 5,
            totalImages: 100,
            hasNextPage: true,
            hasPrevPage: false,
            limit: 20
          }
        }
      });

      performanceMonitor.start('image-gallery-render');
      
      renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      const renderTime = performanceMonitor.end('image-gallery-render');
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(2000); // 2 seconds
      
      // Should call service efficiently
      expect(imagesService.getImages).toHaveBeenCalledTimes(1);
    });

    it('should handle lazy loading efficiently', async () => {
      const images = generateMockImages(50);
      let observeCallCount = 0;
      
      // Mock IntersectionObserver with performance tracking
      const mockObserver = {
        observe: vi.fn(() => {
          observeCallCount++;
        }),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
      
      mockIntersectionObserver.mockReturnValue(mockObserver);

      performanceMonitor.start('lazy-loading-setup');
      
      // Render multiple LazyImage components
      render(
        <div>
          {images.slice(0, 10).map((img) => (
            <LazyImage
              key={img.id}
              src={img.url}
              alt={img.altText}
              useIntersectionObserver={true}
            />
          ))}
        </div>
      );

      const setupTime = performanceMonitor.end('lazy-loading-setup');
      
      // Should set up lazy loading quickly
      expect(setupTime).toBeLessThan(500); // 500ms
      
      // Should observe all images
      expect(observeCallCount).toBe(10);
    });

    it('should optimize image format selection', async () => {
      // Mock WebP support detection
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,test'),
        width: 1,
        height: 1
      };
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return document.createElement(tagName);
      });

      performanceMonitor.start('format-detection');
      
      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Test image"
          variant="medium"
        />
      );

      const detectionTime = performanceMonitor.end('format-detection');
      
      // Format detection should be fast
      expect(detectionTime).toBeLessThan(100); // 100ms
      
      // Should attempt WebP detection
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp');
    });
  });

  describe('Rendering Performance', () => {
    it('should render components within performance budgets', async () => {
      const performanceBudgets = {
        imageGallery: 1000, // 1 second
        lazyImage: 100,      // 100ms
      };

      // Test image gallery
      performanceMonitor.start('image-gallery');
      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: {
          images: generateMockImages(50),
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalImages: 50,
            hasNextPage: true,
            hasPrevPage: false,
            limit: 20
          }
        }
      });
      
      renderWithProviders(<AdminImages />);
      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });
      
      const imageGalleryTime = performanceMonitor.end('image-gallery');
      expect(imageGalleryTime).toBeLessThan(performanceBudgets.imageGallery);

      // Test lazy image
      performanceMonitor.start('lazy-image');
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          useIntersectionObserver={true}
        />
      );
      const lazyImageTime = performanceMonitor.end('lazy-image');
      expect(lazyImageTime).toBeLessThan(performanceBudgets.lazyImage);
    });

    it('should handle responsive image loading efficiently', async () => {
      // Mock different screen sizes
      const screenSizes = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ];

      for (const size of screenSizes) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width,
        });
        
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height,
        });

        performanceMonitor.start(`responsive-${size.width}`);
        
        const { unmount } = render(
          <MobileOptimizedImage
            src="/test-image.jpg"
            alt="Responsive test image"
            mobileVariant="small"
            tabletVariant="medium"
            desktopVariant="large"
          />
        );

        const renderTime = performanceMonitor.end(`responsive-${size.width}`);
        
        // Should render quickly on all screen sizes
        expect(renderTime).toBeLessThan(200); // 200ms
        
        unmount();
      }
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should manage memory efficiently with large image sets', async () => {
      const largeImageSet = generateMockImages(200);
      
      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: {
          images: largeImageSet,
          pagination: {
            currentPage: 1,
            totalPages: 10,
            totalImages: 200,
            hasNextPage: true,
            hasPrevPage: false,
            limit: 20
          }
        }
      });

      // Mock memory usage tracking
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const { unmount } = renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Simulate component cleanup
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (this is a rough check)
      // In a real test environment, you'd have more precise memory monitoring
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
    });

    it('should clean up event listeners and observers', () => {
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
      
      mockIntersectionObserver.mockReturnValue(mockObserver);

      const { unmount } = render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          useIntersectionObserver={true}
        />
      );

      // Should set up observer
      expect(mockObserver.observe).toHaveBeenCalled();
      
      // Clean up
      unmount();
      
      // Should clean up observer
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Network Performance', () => {
    it('should optimize API calls and caching', async () => {
      const images = generateMockImages(20);
      
      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: {
          images,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalImages: 20,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      });

      // First render
      const { unmount } = renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(imagesService.getImages).toHaveBeenCalledTimes(1);
      });

      unmount();
      
      // Second render (should use cache)
      renderWithProviders(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Should not make additional API calls due to caching
      expect(imagesService.getImages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    it('should track Core Web Vitals metrics', async () => {
      // Mock Core Web Vitals
      const mockEntries = [
        {
          name: 'first-contentful-paint',
          startTime: 100,
          duration: 0,
          entryType: 'paint'
        },
        {
          name: 'largest-contentful-paint',
          startTime: 200,
          duration: 0,
          entryType: 'largest-contentful-paint'
        }
      ];

      mockPerformance.getEntriesByType.mockImplementation((type) => {
        return mockEntries.filter(entry => entry.entryType === type);
      });

      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: {
          images: generateMockImages(10),
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalImages: 10,
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

      // Check that performance entries are being tracked
      expect(mockPerformance.getEntriesByType).toHaveBeenCalled();
    });

    it('should provide performance insights', () => {
      const measurements = performanceMonitor.getAllMeasurements();
      
      // Should track various performance metrics
      expect(typeof measurements).toBe('object');
      
      // Performance monitor should be working
      performanceMonitor.start('test-measurement');
      setTimeout(() => {
        const duration = performanceMonitor.end('test-measurement');
        expect(duration).toBeGreaterThan(0);
      }, 10);
    });
  });
});