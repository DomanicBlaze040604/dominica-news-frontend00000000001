import React, { useState, useEffect } from 'react';
import { LazyImage } from './LazyImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  variant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
  variant = 'medium',
  fallbackSrc,
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);

  // Check if browser supports WebP
  const supportsWebP = (() => {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();

  // Generate optimized image URLs
  const generateOptimizedUrls = (baseSrc: string) => {
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
      webp: `${baseUrl}/images/optimized/${filename}/${variant}`,
      jpeg: `${baseUrl}/images/optimized/${filename}/${variant}`,
      fallback: baseSrc
    };
  };

  const urls = generateOptimizedUrls(src);

  // Determine the best source to use
  const getBestSource = () => {
    if (hasError && fallbackSrc) {
      return fallbackSrc;
    }
    
    // Use WebP if supported, otherwise use JPEG
    return supportsWebP ? urls.webp : urls.jpeg;
  };

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      
      // Try fallback source if available
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Try original source as fallback
        setImageSrc(urls.fallback);
      }
    }
    
    onError?.();
  };

  const handleImageLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  // Update image source when src prop changes
  useEffect(() => {
    setImageSrc(getBestSource());
    setHasError(false);
  }, [src, variant]);

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (hasError || src.startsWith('http')) {
      return undefined;
    }

    const filename = src.split('/').pop() || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    const variants = [
      { name: 'small', width: 400 },
      { name: 'medium', width: 800 },
      { name: 'large', width: 1200 }
    ];

    return variants
      .map(v => `${baseUrl}/images/optimized/${filename}/${v.name} ${v.width}w`)
      .join(', ');
  };

  return (
    <LazyImage
      src={imageSrc}
      alt={alt}
      className={className}
      srcSet={generateSrcSet()}
      sizes={sizes}
      onLoad={handleImageLoad}
      onError={handleImageError}
      useIntersectionObserver={!priority}
      threshold={0.1}
      rootMargin="50px"
    />
  );
};

// Hook for preloading optimized images
export const useOptimizedImagePreload = (src: string, variant: string = 'medium') => {
  useEffect(() => {
    if (!src) return;

    const filename = src.split('/').pop() || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    // Preload WebP version
    const webpUrl = `${baseUrl}/images/optimized/${filename}/${variant}`;
    const webpLink = document.createElement('link');
    webpLink.rel = 'preload';
    webpLink.as = 'image';
    webpLink.href = webpUrl;
    webpLink.type = 'image/webp';
    
    // Preload JPEG fallback
    const jpegUrl = `${baseUrl}/images/optimized/${filename}/${variant}`;
    const jpegLink = document.createElement('link');
    jpegLink.rel = 'preload';
    jpegLink.as = 'image';
    jpegLink.href = jpegUrl;
    jpegLink.type = 'image/jpeg';
    
    document.head.appendChild(webpLink);
    document.head.appendChild(jpegLink);
    
    return () => {
      document.head.removeChild(webpLink);
      document.head.removeChild(jpegLink);
    };
  }, [src, variant]);
};

// Component for art-directed responsive images
interface ResponsiveImageProps extends OptimizedImageProps {
  breakpoints?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  breakpoints = {
    mobile: 'small',
    tablet: 'medium', 
    desktop: 'large'
  },
  ...props
}) => {
  const [currentVariant, setCurrentVariant] = useState<string>(breakpoints.desktop || 'large');

  useEffect(() => {
    const updateVariant = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setCurrentVariant(breakpoints.mobile || 'small');
      } else if (width < 1024) {
        setCurrentVariant(breakpoints.tablet || 'medium');
      } else {
        setCurrentVariant(breakpoints.desktop || 'large');
      }
    };

    updateVariant();
    window.addEventListener('resize', updateVariant);
    
    return () => window.removeEventListener('resize', updateVariant);
  }, [breakpoints]);

  return (
    <OptimizedImage
      {...props}
      variant={currentVariant as any}
    />
  );
};