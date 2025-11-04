/**
 * Application initialization utilities for production deployment
 */

import { config } from '../config/environment';
import { setupGlobalErrorHandling } from './errorHandling';
import { initializeHealthMonitoring, initializePerformanceMonitoring } from './healthCheck';

/**
 * Initialize all production-ready features
 */
export function initializeApp(): void {
  // Log initialization start
  if (config.logging.enableConsole) {
    console.log('🚀 Initializing Dominica News Application...');
    console.log('🔧 Environment:', config.environment);
    console.log('🌐 API Base URL:', config.apiBaseUrl);
    console.log('📦 Build Version:', config.buildVersion);
  }

  // Set up global error handling
  setupGlobalErrorHandling();

  // Initialize health monitoring
  initializeHealthMonitoring();

  // Initialize performance monitoring
  initializePerformanceMonitoring();

  // Set up environment-specific features
  if (config.isProduction) {
    initializeProductionFeatures();
  } else if (config.isDevelopment) {
    initializeDevelopmentFeatures();
  }

  // Log initialization complete
  if (config.logging.enableConsole) {
    console.log('✅ Application initialization complete');
  }
}

/**
 * Initialize production-specific features
 */
function initializeProductionFeatures(): void {
  // Disable console logs in production (except errors)
  if (!config.logging.enableConsole) {
    const originalConsole = { ...console };
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }

  // Set up service worker for caching (if available)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          if (config.logging.enableConsole) {
            console.log('📱 Service Worker registered:', registration);
          }
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }

  // Preload critical resources
  preloadCriticalResources();

  // Set up analytics (if enabled)
  if (config.features.analytics) {
    initializeAnalytics();
  }
}

/**
 * Initialize development-specific features
 */
function initializeDevelopmentFeatures(): void {
  // Enable React DevTools
  if (typeof window !== 'undefined') {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
  }

  // Log additional debug information
  console.log('🔧 Development mode features enabled');
  console.log('📊 Config:', config);

  // Enable hot module replacement notifications
  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      console.log('🔄 Hot module replacement update incoming...');
    });
  }
}

/**
 * Preload critical resources for better performance
 */
function preloadCriticalResources(): void {
  const criticalResources = [
    // Add critical API endpoints that should be preloaded
    `${config.apiBaseUrl}/categories`,
    `${config.apiBaseUrl}/breaking-news`
  ];

  criticalResources.forEach(url => {
    // Use link preload for critical resources
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize analytics (placeholder for future implementation)
 */
function initializeAnalytics(): void {
  // Placeholder for analytics initialization
  // In a real application, you would integrate with services like:
  // - Google Analytics
  // - Mixpanel
  // - Amplitude
  // - Custom analytics solution
  
  if (config.logging.enableConsole) {
    console.log('📈 Analytics initialized (placeholder)');
  }
}

/**
 * Get application metadata for debugging
 */
export function getAppMetadata(): {
  version: string;
  environment: string;
  buildDate: string;
  apiUrl: string;
  features: Record<string, boolean>;
} {
  return {
    version: config.buildVersion,
    environment: config.environment,
    buildDate: config.buildDate,
    apiUrl: config.apiBaseUrl,
    features: config.features
  };
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const cleanup = () => {
    if (config.logging.enableConsole) {
      console.log('🛑 Application shutting down...');
    }
    
    // Cleanup any ongoing operations
    // Cancel pending requests, clear intervals, etc.
  };

  // Handle page unload
  window.addEventListener('beforeunload', cleanup);
  
  // Handle visibility change (tab switching, minimizing)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Pause non-critical operations when tab is hidden
      if (config.logging.enableConsole) {
        console.log('⏸️ Application paused (tab hidden)');
      }
    } else {
      // Resume operations when tab becomes visible
      if (config.logging.enableConsole) {
        console.log('▶️ Application resumed (tab visible)');
      }
    }
  });
}

/**
 * Check if the application is ready for production
 */
export function validateProductionReadiness(): {
  isReady: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check environment configuration
  if (!config.apiBaseUrl) {
    issues.push('API base URL is not configured');
  }

  if (config.isProduction && config.apiBaseUrl.includes('localhost')) {
    issues.push('Production environment is using localhost API URL');
  }

  if (config.isProduction && config.features.debugMode) {
    warnings.push('Debug mode is enabled in production');
  }

  if (config.isProduction && config.logging.level === 'debug') {
    warnings.push('Debug logging is enabled in production');
  }

  // Check required browser features
  if (typeof window !== 'undefined') {
    if (!window.fetch) {
      issues.push('Fetch API is not supported');
    }

    if (!window.localStorage) {
      warnings.push('localStorage is not available');
    }
  }

  return {
    isReady: issues.length === 0,
    issues,
    warnings
  };
}