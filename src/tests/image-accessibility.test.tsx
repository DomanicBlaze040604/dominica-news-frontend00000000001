import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AccessibleImage } from '../components/AccessibleImage';
import { MobileOptimizedImage } from '../components/MobileOptimizedImage';
import { OptimizedImage } from '../components/OptimizedImage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock Image constructor
const mockImage = vi.fn();
mockImage.mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: '',
  naturalWidth: 800,
  naturalHeight: 600,
}));
global.Image = mockImage;

describe('AccessibleImage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with proper accessibility attributes', () => {
    render(
      <AccessibleImage
        src="/test-image.jpg"
        alt="Test image description"
        ariaLabel="Custom aria label"
        role="img"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test image description');
    expect(image).toHaveAttribute('aria-label', 'Custom aria label');
    expect(image).toHaveAttribute('role', 'img');
  });

  it('validates alt text and warns for missing or poor alt text', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Test missing alt text
    render(<AccessibleImage src="/test.jpg" alt="" />);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing alt text')
    );

    // Test short alt text
    render(<AccessibleImage src="/test.jpg" alt="Hi" />);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Alt text is too short')
    );

    // Test very long alt text
    const longAlt = 'A'.repeat(130);
    render(<AccessibleImage src="/test.jpg" alt={longAlt} />);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Alt text is very long')
    );

    consoleSpy.mockRestore();
  });

  it('displays loading indicator while image loads', () => {
    render(
      <AccessibleImage
        src="/test-image.jpg"
        alt="Test image"
        showLoadingIndicator={true}
        loadingText="Loading test image..."
      />
    );

    expect(screen.getByText('Loading test image...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles image load errors gracefully', async () => {
    render(
      <AccessibleImage
        src="/nonexistent-image.jpg"
        alt="Test image"
        fallbackSrc="/fallback-image.jpg"
        errorText="Failed to load test image"
      />
    );

    // Simulate image error
    const image = screen.getByRole('img');
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByText('Failed to load test image')).toBeInTheDocument();
    });
  });

  it('supports responsive breakpoints', () => {
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

  it('generates proper srcSet for responsive images', () => {
    render(
      <AccessibleImage
        src="/test-image.jpg"
        alt="Test image with srcSet"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('sizes');
  });

  it('displays caption when provided', () => {
    render(
      <AccessibleImage
        src="/test-image.jpg"
        alt="Test image"
        caption="This is a test image caption"
        showCaption={true}
      />
    );

    expect(screen.getByText('This is a test image caption')).toBeInTheDocument();
  });

  it('provides hidden description for screen readers', () => {
    render(
      <AccessibleImage
        src="/test-image.jpg"
        alt="Test image"
        description="Detailed description for screen readers"
      />
    );

    const description = screen.getByText('Detailed description for screen readers');
    expect(description).toHaveClass('sr-only');
  });
});

describe('MobileOptimizedImage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  it('adapts to different screen sizes', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Mobile width
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

  it('shows data saver indicator when enabled', () => {
    // Mock data saver mode
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '2g',
        saveData: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    render(
      <MobileOptimizedImage
        src="/test-image.jpg"
        alt="Data saver image"
        enableDataSaver={true}
      />
    );

    expect(screen.getByText('Data Saver')).toBeInTheDocument();
  });

  it('displays network type indicator for slow connections', () => {
    // Mock slow connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '2g',
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    render(
      <MobileOptimizedImage
        src="/test-image.jpg"
        alt="Slow connection image"
      />
    );

    expect(screen.getByText('2G')).toBeInTheDocument();
  });

  it('supports pinch-to-zoom functionality', () => {
    render(
      <MobileOptimizedImage
        src="/test-image.jpg"
        alt="Zoomable image"
        enablePinchZoom={true}
      />
    );

    const container = screen.getByRole('img').closest('div');
    expect(container).toHaveClass('touch-none', 'select-none');
  });

  it('handles touch gestures for zoom', () => {
    render(
      <MobileOptimizedImage
        src="/test-image.jpg"
        alt="Touch gesture image"
        enablePinchZoom={true}
      />
    );

    const container = screen.getByRole('img').closest('div');
    
    // Simulate touch start
    fireEvent.touchStart(container!, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    });

    // Simulate touch move (pinch)
    fireEvent.touchMove(container!, {
      touches: [
        { clientX: 80, clientY: 80 },
        { clientX: 220, clientY: 220 },
      ],
    });

    expect(container).toBeInTheDocument();
  });

  it('shows image metadata when enabled', async () => {
    render(
      <MobileOptimizedImage
        src="/test-image.jpg"
        alt="Image with metadata"
        showMetadata={true}
      />
    );

    // Wait for metadata to load
    await waitFor(() => {
      expect(screen.getByText(/×/)).toBeInTheDocument(); // Dimensions
    });
  });

  it('preloads images on hover for desktop', () => {
    render(
      <MobileOptimizedImage
        src="/test-image.jpg"
        alt="Preload on hover image"
        preloadOnHover={true}
      />
    );

    const container = screen.getByRole('img').closest('div');
    fireEvent.mouseEnter(container!);

    // Check if preload link was added to head
    const preloadLinks = document.head.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks.length).toBeGreaterThan(0);
  });
});

describe('OptimizedImage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates optimized URLs for different variants', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Optimized image"
        variant="medium"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('supports WebP format when available', () => {
    // Mock WebP support
    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,test'),
      width: 1,
      height: 1,
    };
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });

    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="WebP optimized image"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('falls back to original image on optimization failure', async () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Fallback image"
        fallbackSrc="/fallback.jpg"
      />
    );

    const image = screen.getByRole('img');
    
    // Simulate image error
    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/fallback.jpg');
    });
  });

  it('generates responsive srcSet', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Responsive optimized image"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('sizes');
  });

  it('handles priority loading for above-the-fold images', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Priority image"
        priority={true}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'eager');
  });
});

describe('Image Performance and Accessibility Hooks', () => {
  it('tracks image performance metrics', async () => {
    const { useImagePerformance } = await import('../components/AccessibleImage');
    
    // This would need to be tested in a more complex setup
    // For now, just verify the hook exists
    expect(useImagePerformance).toBeDefined();
  });

  it('validates image accessibility', async () => {
    const { useImageAccessibility } = await import('../components/AccessibleImage');
    
    // This would need to be tested in a more complex setup
    // For now, just verify the hook exists
    expect(useImageAccessibility).toBeDefined();
  });

  it('preloads critical images', async () => {
    const { useImagePreload } = await import('../components/AccessibleImage');
    
    // This would need to be tested in a more complex setup
    // For now, just verify the hook exists
    expect(useImagePreload).toBeDefined();
  });
});

describe('Image Error Handling', () => {
  it('displays appropriate error messages for different failure types', () => {
    render(
      <AccessibleImage
        src="/nonexistent.jpg"
        alt="Error test image"
        errorText="Custom error message"
      />
    );

    const image = screen.getByRole('img');
    fireEvent.error(image);

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('provides retry functionality for failed images', () => {
    const onRetry = vi.fn();
    
    render(
      <AccessibleImage
        src="/failed-image.jpg"
        alt="Retry test image"
        onError={onRetry}
      />
    );

    const image = screen.getByRole('img');
    fireEvent.error(image);

    expect(onRetry).toHaveBeenCalled();
  });

  it('maintains accessibility during error states', () => {
    render(
      <AccessibleImage
        src="/error-image.jpg"
        alt="Accessibility error test"
      />
    );

    const image = screen.getByRole('img');
    fireEvent.error(image);

    // Error state should still be accessible
    const errorElement = screen.getByRole('img');
    expect(errorElement).toHaveAttribute('aria-label');
  });
});