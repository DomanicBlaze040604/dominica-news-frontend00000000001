import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { OptimizedImage, ResponsiveImage } from '../components/OptimizedImage';
import { ImageOptimizationInfo } from '../components/admin/ImageOptimizationInfo';

// Mock LazyImage component
vi.mock('../components/LazyImage', () => ({
  LazyImage: ({ src, alt, className, onLoad, onError, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  ),
}));

describe('Image Optimization Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas for WebP support detection
    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,test'),
      width: 1,
      height: 1
    };
    
    global.document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return {
        rel: '',
        as: '',
        href: '',
        type: ''
      };
    });
    
    global.document.head = {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    } as any;
  });

  describe('OptimizedImage Component', () => {
    it('should render optimized image with correct src', () => {
      render(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="Test image"
          variant="medium"
        />
      );

      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src');
    });

    it('should use WebP format when supported', () => {
      render(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="Test image"
          variant="large"
        />
      );

      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      // Should use optimized URL structure
      expect(img.getAttribute('src')).toContain('/optimized/');
    });

    it('should handle different variants', () => {
      const { rerender } = render(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="Test image"
          variant="thumbnail"
        />
      );

      let img = screen.getByAltText('Test image');
      expect(img.getAttribute('src')).toContain('thumbnail');

      rerender(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="Test image"
          variant="large"
        />
      );

      img = screen.getByAltText('Test image');
      expect(img.getAttribute('src')).toContain('large');
    });

    it('should handle external URLs correctly', () => {
      render(
        <OptimizedImage
          src="https://external.com/image.jpg"
          alt="External image"
        />
      );

      const img = screen.getByAltText('External image');
      expect(img.getAttribute('src')).toBe('https://external.com/image.jpg');
    });

    it('should use fallback on error', async () => {
      const mockOnError = vi.fn();
      
      render(
        <OptimizedImage
          src="/uploads/broken-image.jpg"
          alt="Broken image"
          fallbackSrc="/uploads/fallback.jpg"
          onError={mockOnError}
        />
      );

      const img = screen.getByAltText('Broken image');
      
      // Simulate image error
      img.dispatchEvent(new Event('error'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it('should generate responsive srcSet', () => {
      render(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="Responsive image"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );

      const img = screen.getByAltText('Responsive image');
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
    });
  });

  describe('ResponsiveImage Component', () => {
    it('should render with default breakpoints', () => {
      render(
        <ResponsiveImage
          src="/uploads/test-image.jpg"
          alt="Responsive test image"
        />
      );

      const img = screen.getByAltText('Responsive test image');
      expect(img).toBeInTheDocument();
    });

    it('should use custom breakpoints', () => {
      render(
        <ResponsiveImage
          src="/uploads/test-image.jpg"
          alt="Custom responsive image"
          breakpoints={{
            mobile: 'thumbnail',
            tablet: 'small',
            desktop: 'medium'
          }}
        />
      );

      const img = screen.getByAltText('Custom responsive image');
      expect(img).toBeInTheDocument();
    });
  });

  describe('ImageOptimizationInfo Component', () => {
    const mockImageData = {
      filename: 'test-image.jpg',
      original: {
        size: 1024000, // 1MB
        width: 1920,
        height: 1080,
        format: 'jpeg'
      },
      variants: {
        thumbnail: {
          webp: { size: 15000, url: '/variants/test-thumbnail.webp' },
          jpeg: { size: 20000, url: '/variants/test-thumbnail.jpg' }
        },
        medium: {
          webp: { size: 150000, url: '/variants/test-medium.webp' },
          jpeg: { size: 200000, url: '/variants/test-medium.jpg' }
        },
        large: {
          webp: { size: 300000, url: '/variants/test-large.webp' },
          jpeg: { size: 400000, url: '/variants/test-large.jpg' }
        }
      },
      processing: {
        variantsCreated: 6,
        compressionRatio: '75.5%',
        totalSize: 465000,
        originalSize: 1024000
      },
      metadata: {
        width: 1920,
        height: 1080,
        format: 'jpeg',
        hasAlpha: false,
        colorSpace: 'srgb'
      }
    };

    it('should display optimization summary', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Image Optimization Summary')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument(); // Variants created
      expect(screen.getByText('75.5%')).toBeInTheDocument(); // Compression ratio
    });

    it('should show size comparison', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Size Comparison')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument(); // Original size
      expect(screen.getByText('454.10 KB')).toBeInTheDocument(); // Optimized size
    });

    it('should display variant details', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Generated Variants')).toBeInTheDocument();
      expect(screen.getByText('Thumbnail')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
    });

    it('should show technical details', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
      expect(screen.getByText('JPEG')).toBeInTheDocument();
      expect(screen.getByText('srgb')).toBeInTheDocument();
    });

    it('should display optimization benefits', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Optimization Benefits')).toBeInTheDocument();
      expect(screen.getByText('Multiple Format Support')).toBeInTheDocument();
      expect(screen.getByText('Responsive Variants')).toBeInTheDocument();
      expect(screen.getByText('Bandwidth Savings')).toBeInTheDocument();
      expect(screen.getByText('SEO Benefits')).toBeInTheDocument();
    });

    it('should show compression quality badges', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument(); // 75.5% compression
    });

    it('should calculate WebP vs JPEG savings', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      // Should show WebP savings for each variant
      expect(screen.getByText(/25\.0% smaller than JPEG/)).toBeInTheDocument(); // Thumbnail
      expect(screen.getByText(/25\.0% smaller than JPEG/)).toBeInTheDocument(); // Medium
      expect(screen.getByText(/25\.0% smaller than JPEG/)).toBeInTheDocument(); // Large
    });
  });

  describe('Image Format Support Detection', () => {
    it('should detect WebP support correctly', () => {
      // Mock WebP support
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,test'),
        width: 1,
        height: 1
      };
      
      global.document.createElement = vi.fn().mockReturnValue(mockCanvas);

      render(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="WebP test"
        />
      );

      const img = screen.getByAltText('WebP test');
      expect(img).toBeInTheDocument();
    });

    it('should fallback to JPEG when WebP not supported', () => {
      // Mock no WebP support
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
        width: 1,
        height: 1
      };
      
      global.document.createElement = vi.fn().mockReturnValue(mockCanvas);

      render(
        <OptimizedImage
          src="/uploads/test-image.jpg"
          alt="JPEG fallback test"
        />
      );

      const img = screen.getByAltText('JPEG fallback test');
      expect(img).toBeInTheDocument();
    });
  });
});