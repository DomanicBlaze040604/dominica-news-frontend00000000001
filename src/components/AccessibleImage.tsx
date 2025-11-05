import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LazyImage } from './LazyImage';
import { cn } from '@/lib/utils';

interface AccessibleImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  variant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  // Accessibility props
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  // Performance props
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'sync' | 'async' | 'auto';
  // Responsive props
  breakpoints?: {
    mobile: { width: number; variant: string };
    tablet: { width: number; variant: string };
    desktop: { width: number; variant: string };
  };
  // Caption and description
  caption?: string;
  description?: string;
  showCaption?: boolean;
  // Loading states
  showLoadingIndicator?: boolean;
  loadingText?: string;
  errorText?: string;
}

export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  src,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
  variant = 'medium',
  fallbackSrc,
  onLoad,
  onError,
  role,
  ariaLabel,
  ariaDescribedBy,
  ariaLabelledBy,
  fetchPriority = 'auto',
  decoding = 'async',
  breakpoints,
  caption,
  description,
  showCaption = false,
  showLoadingIndicator = true,
  loadingText = 'Loading image...',
  errorText = 'Failed to load image',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentVariant, setCurrentVariant] = useState(variant);
  const [imageSrc, setImageSrc] = useState(src);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageId = useRef(`img-${Math.random().toString(36).substr(2, 9)}`);
  const captionId = useRef(`caption-${imageId.current}`);
  const descriptionId = useRef(`desc-${imageId.current}`);

  // Check if browser supports WebP
  const supportsWebP = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }, []);

  // Generate optimized image URLs
  const generateOptimizedUrls = useCallback((baseSrc: string, imageVariant: string) => {
    // If it's already an optimized URL or external URL, return as is
    if (baseSrc.includes('/optimized/') || baseSrc.startsWith('http')) {
      return {
        webp: baseSrc,
        jpeg: baseSrc,
        fallback: baseSrc
      };
    }

    // Extract filename from src
    const filename = baseSrc.split('/').pop() || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    return {
      webp: `${baseUrl}/images/optimized/${filename}/${imageVariant}`,
      jpeg: `${baseUrl}/images/optimized/${filename}/${imageVariant}`,
      fallback: baseSrc
    };
  }, []);

  // Responsive image handling
  useEffect(() => {
    if (!breakpoints) return;

    const updateVariant = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.tablet.width) {
        setCurrentVariant(breakpoints.mobile.variant);
      } else if (width < breakpoints.desktop.width) {
        setCurrentVariant(breakpoints.tablet.variant);
      } else {
        setCurrentVariant(breakpoints.desktop.variant);
      }
    };

    updateVariant();
    window.addEventListener('resize', updateVariant);
    
    return () => window.removeEventListener('resize', updateVariant);
  }, [breakpoints]);

  // Update image source when variant changes
  useEffect(() => {
    const urls = generateOptimizedUrls(src, currentVariant);
    const bestSource = supportsWebP() ? urls.webp : urls.jpeg;
    setImageSrc(bestSource);
  }, [src, currentVariant, generateOptimizedUrls, supportsWebP]);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback(() => {
    if (hasError || src.startsWith('http')) {
      return undefined;
    }

    const filename = src.split('/').pop() || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const format = supportsWebP() ? 'webp' : 'jpeg';
    
    const variants = [
      { name: 'small', width: 400 },
      { name: 'medium', width: 800 },
      { name: 'large', width: 1200 }
    ];

    return variants
      .map(v => `${baseUrl}/images/optimized/${filename}/${v.name} ${v.width}w`)
      .join(', ');
  }, [src, hasError, supportsWebP]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    if (!hasError && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    } else {
      setHasError(true);
    }
    onError?.();
  }, [hasError, fallbackSrc, onError]);

  // Build accessibility attributes
  const accessibilityProps = {
    id: imageId.current,
    role: role || (alt ? undefined : 'presentation'),
    'aria-label': ariaLabel,
    'aria-describedby': [
      ariaDescribedBy,
      description ? descriptionId.current : undefined,
      showCaption && caption ? captionId.current : undefined
    ].filter(Boolean).join(' ') || undefined,
    'aria-labelledby': ariaLabelledBy,
  };

  // Validate alt text for accessibility
  const validateAltText = (altText: string) => {
    if (!altText) {
      console.warn('AccessibleImage: Missing alt text. This affects accessibility.');
      return false;
    }
    if (altText.length < 3) {
      console.warn('AccessibleImage: Alt text is too short. Consider providing more descriptive text.');
      return false;
    }
    if (altText.length > 125) {
      console.warn('AccessibleImage: Alt text is very long. Consider using a shorter description.');
    }
    return true;
  };

  // Validate alt text on mount and when alt changes
  useEffect(() => {
    validateAltText(alt);
  }, [alt]);

  if (hasError && !fallbackSrc) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-4 rounded-lg border-2 border-dashed border-gray-300',
          className
        )}
        role="img"
        aria-label={`${errorText}: ${alt}`}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium">{errorText}</p>
          <p className="text-xs text-gray-400 mt-1">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <figure 
      ref={containerRef}
      className={cn('relative', showCaption && 'space-y-2')}
    >
      <div className="relative overflow-hidden">
        {/* Loading indicator */}
        {!isLoaded && showLoadingIndicator && (
          <div
            className={cn(
              'absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10',
              className
            )}
            aria-label={loadingText}
          >
            <div className="text-center">
              <div 
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
                aria-label={loadingText}
              >
                <span className="sr-only">{loadingText}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 sr-only">{loadingText}</p>
            </div>
          </div>
        )}

        {/* Main image */}
        <LazyImage
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          srcSet={generateSrcSet()}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={fetchPriority}
          decoding={decoding}
          onLoad={handleImageLoad}
          onError={handleImageError}
          useIntersectionObserver={!priority}
          threshold={0.1}
          rootMargin="50px"
          {...accessibilityProps}
        />
      </div>

      {/* Caption */}
      {showCaption && caption && (
        <figcaption 
          id={captionId.current}
          className="text-sm text-gray-600 text-center italic"
        >
          {caption}
        </figcaption>
      )}

      {/* Hidden description for screen readers */}
      {description && (
        <div 
          id={descriptionId.current}
          className="sr-only"
        >
          {description}
        </div>
      )}
    </figure>
  );
};

// Hook for preloading critical images
export const useImagePreload = (src: string, variant: string = 'medium') => {
  useEffect(() => {
    if (!src) return;

    const filename = src.split('/').pop() || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    // Create preload links
    const createPreloadLink = (url: string, type: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.type = type;
      return link;
    };

    // Preload WebP version
    const webpUrl = `${baseUrl}/images/optimized/${filename}/${variant}`;
    const webpLink = createPreloadLink(webpUrl, 'image/webp');
    
    // Preload JPEG fallback
    const jpegUrl = `${baseUrl}/images/optimized/${filename}/${variant}`;
    const jpegLink = createPreloadLink(jpegUrl, 'image/jpeg');
    
    document.head.appendChild(webpLink);
    document.head.appendChild(jpegLink);
    
    return () => {
      try {
        document.head.removeChild(webpLink);
        document.head.removeChild(jpegLink);
      } catch {
        // Links may have already been removed
      }
    };
  }, [src, variant]);
};

// Performance monitoring hook
export const useImagePerformance = (src: string) => {
  const [metrics, setMetrics] = useState<{
    loadTime: number;
    size: number;
    format: string;
  } | null>(null);

  useEffect(() => {
    if (!src) return;

    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      
      // Try to get image size (approximate)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const size = imageData.data.length;
        
        setMetrics({
          loadTime,
          size,
          format: src.includes('.webp') ? 'webp' : 'jpeg'
        });
      }
    };
    
    img.src = src;
  }, [src]);

  return metrics;
};

// Accessibility validation hook
export const useImageAccessibility = (alt: string, src: string) => {
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const newIssues: string[] = [];

    // Check alt text
    if (!alt) {
      newIssues.push('Missing alt text');
    } else if (alt.length < 3) {
      newIssues.push('Alt text too short');
    } else if (alt.length > 125) {
      newIssues.push('Alt text too long');
    }

    // Check for decorative images
    if (alt === '' && !src.includes('decorative')) {
      newIssues.push('Empty alt text without decorative indication');
    }

    // Check for redundant text
    const redundantPhrases = ['image of', 'picture of', 'photo of', 'graphic of'];
    if (redundantPhrases.some(phrase => alt.toLowerCase().includes(phrase))) {
      newIssues.push('Alt text contains redundant phrases');
    }

    setIssues(newIssues);
  }, [alt, src]);

  return issues;
};