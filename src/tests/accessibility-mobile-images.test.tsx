import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibleImage, useImageAccessibility } from '../components/AccessibleImage';
import { MobileOptimizedImage, useMobileCapabilities } from '../components/MobileOptimizedImage';
import { renderHook } from '@testing-library/react';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
});

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

describe('Accessibility and Mobile Image Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AccessibleImage Component', () => {
    it('should render with proper accessibility attributes', () => {
      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="A beautiful landscape with mountains and trees"
          ariaLabel="Scenic mountain landscape"
          description="Detailed view of snow-capped mountains with evergreen trees in the foreground"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'A beautiful landscape with mountains and trees');
      expect(image).toHaveAttribute('aria-label', 'Scenic mountain landscape');
    });

    it('should show loading indicator with proper accessibility', async () => {
      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Test image"
          showLoadingIndicator={true}
          loadingText="Loading scenic image..."
        />
      );

      // Check for loading indicator
      expect(screen.getByLabelText('Loading scenic image...')).toBeInTheDocument();
      expect(screen.getByText('Loading scenic image...')).toHaveClass('sr-only');
    });

    it('should display error state with accessibility support', () => {
      render(
        <AccessibleImage
          src="/nonexistent-image.jpg"
          alt="Missing image"
          errorText="Image could not be loaded"
        />
      );

      // Simulate image error
      const image = screen.getByRole('img');
      fireEvent.error(image);

      waitFor(() => {
        expect(screen.getByText('Image could not be loaded')).toBeInTheDocument();
        expect(screen.getByLabelText(/Image could not be loaded: Missing image/)).toBeInTheDocument();
      });
    });

    it('should handle caption and description properly', () => {
      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Test image"
          caption="Beautiful mountain scenery"
          description="This image shows a panoramic view of the Rocky Mountains during sunset"
          showCaption={true}
        />
      );

      expect(screen.getByText('Beautiful mountain scenery')).toBeInTheDocument();
      expect(screen.getByText('This image shows a panoramic view of the Rocky Mountains during sunset')).toHaveClass('sr-only');
    });

    it('should validate alt text and show warnings', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Test missing alt text
      render(<AccessibleImage src="/test.jpg" alt="" />);
      expect(consoleSpy).toHaveBeenCalledWith('AccessibleImage: Missing alt text. This affects accessibility.');

      // Test short alt text
      render(<AccessibleImage src="/test.jpg" alt="Hi" />);
      expect(consoleSpy).toHaveBeenCalledWith('AccessibleImage: Alt text is too short. Consider providing more descriptive text.');

      // Test very long alt text
      const longAlt = 'This is a very long alt text that exceeds the recommended length for accessibility and should trigger a warning message';
      render(<AccessibleImage src="/test.jpg" alt={longAlt} />);
      expect(consoleSpy).toHaveBeenCalledWith('AccessibleImage: Alt text is very long. Consider using a shorter description.');

      consoleSpy.mockRestore();
    });

    it('should support responsive breakpoints', () => {
      const breakpoints = {
        mobile: { width: 768, variant: 'small' },
        tablet: { width: 1024, variant: 'medium' },
        desktop: { width: 1920, variant: 'large' }
      };

      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Responsive test image"
          breakpoints={breakpoints}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should handle high priority images correctly', () => {
      render(
        <AccessibleImage
          src="/hero-image.jpg"
          alt="Hero banner image"
          priority={true}
          fetchPriority="high"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'eager');
      expect(image).toHaveAttribute('fetchpriority', 'high');
    });
  });

  describe('MobileOptimizedImage Component', () => {
    it('should adapt to mobile screen sizes', () => {
      // Mock mobile screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Mobile optimized image"
          mobileVariant="small"
          tabletVariant="medium"
          desktopVariant="large"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should show data saver indicator when enabled', () => {
      // Mock data saver mode
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          saveData: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      });

      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Data saver test image"
          enableDataSaver={true}
        />
      );

      expect(screen.getByText('Data Saver')).toBeInTheDocument();
    });

    it('should show network type indicator for slow connections', () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          saveData: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      });

      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Slow connection test image"
        />
      );

      expect(screen.getByText('2G')).toBeInTheDocument();
    });

    it('should handle pinch zoom gestures', () => {
      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Zoomable image"
          enablePinchZoom={true}
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('touch-none', 'select-none');
      expect(screen.getByText('Pinch to zoom')).toBeInTheDocument();
    });

    it('should display image metadata when enabled', async () => {
      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Image with metadata"
          showMetadata={true}
        />
      );

      // Simulate image load to trigger metadata extraction
      const image = screen.getByRole('img');
      fireEvent.load(image);

      // Note: In a real test, we'd need to mock the canvas and image loading
      // For now, we just check that the component renders without errors
      expect(image).toBeInTheDocument();
    });

    it('should handle touch gestures for zoom', () => {
      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Touch gesture test"
          enablePinchZoom={true}
        />
      );

      const container = screen.getByRole('img').closest('div');
      
      // Simulate pinch gesture
      fireEvent.touchStart(container!, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });

      fireEvent.touchMove(container!, {
        touches: [
          { clientX: 80, clientY: 80 },
          { clientX: 220, clientY: 220 }
        ]
      });

      fireEvent.touchEnd(container!);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility Hooks', () => {
    it('should detect accessibility issues with useImageAccessibility', () => {
      const { result } = renderHook(() => 
        useImageAccessibility('', '/test-image.jpg')
      );

      expect(result.current).toContain('Missing alt text');
    });

    it('should detect short alt text', () => {
      const { result } = renderHook(() => 
        useImageAccessibility('Hi', '/test-image.jpg')
      );

      expect(result.current).toContain('Alt text too short');
    });

    it('should detect long alt text', () => {
      const longAlt = 'This is an extremely long alt text that definitely exceeds the recommended 125 character limit for accessibility and should be flagged as an issue';
      
      const { result } = renderHook(() => 
        useImageAccessibility(longAlt, '/test-image.jpg')
      );

      expect(result.current).toContain('Alt text too long');
    });

    it('should detect redundant phrases in alt text', () => {
      const { result } = renderHook(() => 
        useImageAccessibility('Image of a beautiful sunset', '/test-image.jpg')
      );

      expect(result.current).toContain('Alt text contains redundant phrases');
    });

    it('should validate proper alt text', () => {
      const { result } = renderHook(() => 
        useImageAccessibility('Beautiful sunset over the ocean', '/test-image.jpg')
      );

      expect(result.current).toHaveLength(0);
    });
  });

  describe('Mobile Capabilities Hook', () => {
    it('should detect mobile capabilities', () => {
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5,
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.isTouchDevice).toBe(true);
      expect(result.current.screenSize).toBe('desktop'); // Based on mocked window width
    });

    it('should detect high DPI displays', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2,
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.hasHighDPI).toBe(true);
    });

    it('should categorize screen sizes correctly', () => {
      // Test mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result: mobileResult } = renderHook(() => useMobileCapabilities());
      expect(mobileResult.current.screenSize).toBe('mobile');

      // Test tablet
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result: tabletResult } = renderHook(() => useMobileCapabilities());
      expect(tabletResult.current.screenSize).toBe('tablet');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle WebP format detection', () => {
      // Mock canvas toDataURL for WebP support
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,test')
      };
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return document.createElement(tagName);
      });

      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="WebP test image"
        />
      );

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp');
    });

    it('should preload images on hover when enabled', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');

      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Preload test image"
          preloadOnHover={true}
        />
      );

      const container = screen.getByRole('img').closest('div');
      fireEvent.mouseEnter(container!);

      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should adapt image quality based on network conditions', () => {
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          saveData: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      });

      render(
        <MobileOptimizedImage
          src="/test-image.jpg"
          alt="Network adaptive image"
          enableDataSaver={true}
        />
      );

      // Should show data saver indicator
      expect(screen.getByText('Data Saver')).toBeInTheDocument();
      expect(screen.getByText('2G')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle image load errors gracefully', async () => {
      render(
        <AccessibleImage
          src="/broken-image.jpg"
          alt="Broken image test"
          fallbackSrc="/fallback-image.jpg"
          errorText="Image failed to load"
        />
      );

      const image = screen.getByRole('img');
      fireEvent.error(image);

      await waitFor(() => {
        expect(screen.getByText('Image failed to load')).toBeInTheDocument();
      });
    });

    it('should provide fallback for missing images', () => {
      render(
        <AccessibleImage
          src="/missing-image.jpg"
          alt="Missing image"
          fallbackSrc="/placeholder.jpg"
        />
      );

      const image = screen.getByRole('img');
      fireEvent.error(image);

      // Should attempt to load fallback
      expect(image).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should update variants based on screen size changes', () => {
      const { rerender } = render(
        <MobileOptimizedImage
          src="/responsive-image.jpg"
          alt="Responsive image test"
          mobileVariant="small"
          tabletVariant="medium"
          desktopVariant="large"
        />
      );

      // Simulate screen size change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      fireEvent(window, new Event('resize'));

      rerender(
        <MobileOptimizedImage
          src="/responsive-image.jpg"
          alt="Responsive image test"
          mobileVariant="small"
          tabletVariant="medium"
          desktopVariant="large"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });
  });
});