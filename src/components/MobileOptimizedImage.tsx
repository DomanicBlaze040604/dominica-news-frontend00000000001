import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AccessibleImage } from './AccessibleImage';
import { cn } from '@/lib/utils';

interface MobileOptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  // Mobile-specific props
  mobileVariant?: 'thumbnail' | 'small' | 'medium';
  tabletVariant?: 'small' | 'medium' | 'large';
  desktopVariant?: 'medium' | 'large' | 'original';
  // Performance props
  enableDataSaver?: boolean;
  enableProgressiveLoading?: boolean;
  // Touch and gesture props
  enablePinchZoom?: boolean;
  enableSwipeGestures?: boolean;
  // Caption and metadata
  caption?: string;
  showCaption?: boolean;
  showMetadata?: boolean;
  // Loading optimization
  preloadOnHover?: boolean;
  lazyLoadOffset?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  scale: number;
  translateX: number;
  translateY: number;
}

export const MobileOptimizedImage: React.FC<MobileOptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  mobileVariant = 'small',
  tabletVariant = 'medium',
  desktopVariant = 'large',
  enableDataSaver = true,
  enableProgressiveLoading = true,
  enablePinchZoom = false,
  enableSwipeGestures = false,
  caption,
  showCaption = false,
  showMetadata = false,
  preloadOnHover = false,
  lazyLoadOffset = 100,
}) => {
  const [isDataSaverMode, setIsDataSaverMode] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('4g');
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    startDistance: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [imageMetadata, setImageMetadata] = useState<{
    size: string;
    dimensions: string;
    format: string;
  } | null>(null);

  const imageRef = useRef<HTMLDivElement>(null);
  const isTouch = useRef(false);

  // Detect network conditions
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnection = () => {
        setConnectionType(connection.effectiveType || '4g');
        setIsDataSaverMode(connection.saveData || false);
      };

      updateConnection();
      connection.addEventListener('change', updateConnection);
      
      return () => connection.removeEventListener('change', updateConnection);
    }
  }, []);

  // Determine optimal variant based on device and network
  const getOptimalVariant = useCallback(() => {
    const width = window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Adjust for data saver mode
    if (enableDataSaver && (isDataSaverMode || connectionType === 'slow-2g' || connectionType === '2g')) {
      return width < 768 ? 'thumbnail' : 'small';
    }

    // Adjust for high DPI displays
    const effectiveWidth = width * pixelRatio;
    
    if (effectiveWidth < 768) {
      return mobileVariant;
    } else if (effectiveWidth < 1024) {
      return tabletVariant;
    } else {
      return desktopVariant;
    }
  }, [isDataSaverMode, connectionType, mobileVariant, tabletVariant, desktopVariant, enableDataSaver]);

  // Progressive loading for better perceived performance
  const getProgressiveVariants = useCallback(() => {
    if (!enableProgressiveLoading) {
      return [getOptimalVariant()];
    }

    const optimal = getOptimalVariant();
    const variants = ['thumbnail', 'small', 'medium', 'large', 'original'];
    const optimalIndex = variants.indexOf(optimal);
    
    // Load smaller variants first, then the optimal one
    return variants.slice(0, optimalIndex + 1);
  }, [enableProgressiveLoading, getOptimalVariant]);

  // Touch gesture handling for pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePinchZoom) return;
    
    isTouch.current = true;
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setTouchState(prev => ({
        ...prev,
        startDistance: distance,
        startX: (touch1.clientX + touch2.clientX) / 2,
        startY: (touch1.clientY + touch2.clientY) / 2,
      }));
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
      }));
    }
  }, [enablePinchZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enablePinchZoom || !isTouch.current) return;
    
    e.preventDefault();
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = Math.min(Math.max(distance / touchState.startDistance, 0.5), 3);
      
      setTouchState(prev => ({
        ...prev,
        scale,
      }));
      
      setIsZoomed(scale > 1);
    } else if (e.touches.length === 1 && touchState.scale > 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      
      setTouchState(prev => ({
        ...prev,
        translateX: deltaX,
        translateY: deltaY,
      }));
    }
  }, [enablePinchZoom, touchState]);

  const handleTouchEnd = useCallback(() => {
    isTouch.current = false;
    
    // Reset if scale is too small
    if (touchState.scale < 1.1) {
      setTouchState(prev => ({
        ...prev,
        scale: 1,
        translateX: 0,
        translateY: 0,
      }));
      setIsZoomed(false);
    }
  }, [touchState.scale]);

  // Swipe gesture handling
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!enableSwipeGestures) return;
    
    // Emit custom event for parent components to handle
    const swipeEvent = new CustomEvent('imageSwipe', {
      detail: { direction, src }
    });
    window.dispatchEvent(swipeEvent);
  }, [enableSwipeGestures, src]);

  // Extract image metadata
  const extractMetadata = useCallback((imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      // Estimate file size (rough approximation)
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const estimatedSize = Math.round(imageData.data.length / 1024); // KB
        
        setImageMetadata({
          size: estimatedSize > 1024 ? `${(estimatedSize / 1024).toFixed(1)} MB` : `${estimatedSize} KB`,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}`,
          format: imageSrc.includes('.webp') ? 'WebP' : imageSrc.includes('.png') ? 'PNG' : 'JPEG'
        });
      }
    };
    img.src = imageSrc;
  }, []);

  // Preload on hover for desktop
  const handleMouseEnter = useCallback(() => {
    if (preloadOnHover && !isTouch.current) {
      const optimalVariant = getOptimalVariant();
      const filename = src.split('/').pop() || '';
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const preloadUrl = `${baseUrl}/images/optimized/${filename}/${optimalVariant}`;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = preloadUrl;
      document.head.appendChild(link);
    }
  }, [preloadOnHover, getOptimalVariant, src]);

  // Generate responsive breakpoints
  const responsiveBreakpoints = {
    mobile: { width: 768, variant: mobileVariant },
    tablet: { width: 1024, variant: tabletVariant },
    desktop: { width: 1920, variant: desktopVariant }
  };

  // Transform style for zoom and pan
  const transformStyle = enablePinchZoom ? {
    transform: `scale(${touchState.scale}) translate(${touchState.translateX}px, ${touchState.translateY}px)`,
    transformOrigin: 'center center',
    transition: isTouch.current ? 'none' : 'transform 0.3s ease-out'
  } : {};

  return (
    <div 
      ref={imageRef}
      className={cn(
        'relative overflow-hidden',
        enablePinchZoom && 'touch-none select-none',
        isZoomed && 'cursor-move',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
    >
      {/* Data saver indicator */}
      {enableDataSaver && isDataSaverMode && (
        <div className="absolute top-2 left-2 z-10 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
          Data Saver
        </div>
      )}

      {/* Network indicator */}
      {connectionType && ['slow-2g', '2g', '3g'].includes(connectionType) && (
        <div className="absolute top-2 right-2 z-10 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
          {connectionType.toUpperCase()}
        </div>
      )}

      {/* Main image with accessibility features */}
      <div style={transformStyle}>
        <AccessibleImage
          src={src}
          alt={alt}
          className="w-full h-auto"
          priority={priority}
          variant={getOptimalVariant()}
          breakpoints={responsiveBreakpoints}
          caption={caption}
          showCaption={showCaption}
          showLoadingIndicator={true}
          loadingText="Loading optimized image..."
          errorText="Failed to load image"
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => extractMetadata(src)}
        />
      </div>

      {/* Zoom controls for touch devices */}
      {enablePinchZoom && isZoomed && (
        <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-75 text-white p-2 rounded-lg">
          <button
            onClick={() => {
              setTouchState(prev => ({
                ...prev,
                scale: 1,
                translateX: 0,
                translateY: 0,
              }));
              setIsZoomed(false);
            }}
            className="text-sm px-2 py-1 bg-white bg-opacity-20 rounded"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>
      )}

      {/* Image metadata overlay */}
      {showMetadata && imageMetadata && (
        <div className="absolute bottom-2 left-2 z-10 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>{imageMetadata.dimensions}</div>
          <div>{imageMetadata.size} • {imageMetadata.format}</div>
        </div>
      )}

      {/* Gesture hints for first-time users */}
      {enablePinchZoom && !isZoomed && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black bg-opacity-75 text-white text-sm p-2 rounded">
            Pinch to zoom
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for detecting mobile device capabilities
export const useMobileCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    isTouchDevice: false,
    supportsWebP: false,
    hasHighDPI: false,
    connectionType: '4g',
    isDataSaverMode: false,
    screenSize: 'desktop' as 'mobile' | 'tablet' | 'desktop',
  });

  useEffect(() => {
    const detectCapabilities = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasHighDPI = window.devicePixelRatio > 1;
      const width = window.innerWidth;
      
      let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) screenSize = 'mobile';
      else if (width < 1024) screenSize = 'tablet';

      // Check WebP support
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

      // Check network conditions
      let connectionType = '4g';
      let isDataSaverMode = false;
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection.effectiveType || '4g';
        isDataSaverMode = connection.saveData || false;
      }

      setCapabilities({
        isTouchDevice,
        supportsWebP,
        hasHighDPI,
        connectionType,
        isDataSaverMode,
        screenSize,
      });
    };

    detectCapabilities();
    window.addEventListener('resize', detectCapabilities);
    
    return () => window.removeEventListener('resize', detectCapabilities);
  }, []);

  return capabilities;
};

// Performance monitoring for mobile images
export const useMobileImagePerformance = () => {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
    totalDataUsed: 0,
  });

  const recordImageLoad = useCallback((loadTime: number, size: number) => {
    setMetrics(prev => ({
      totalImages: prev.totalImages + 1,
      loadedImages: prev.loadedImages + 1,
      failedImages: prev.failedImages,
      averageLoadTime: (prev.averageLoadTime * prev.loadedImages + loadTime) / (prev.loadedImages + 1),
      totalDataUsed: prev.totalDataUsed + size,
    }));
  }, []);

  const recordImageError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1,
      failedImages: prev.failedImages + 1,
    }));
  }, []);

  return { metrics, recordImageLoad, recordImageError };
};