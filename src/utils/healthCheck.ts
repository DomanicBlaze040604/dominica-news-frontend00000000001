/**
 * Health check and runtime environment validation utilities
 */

import { config } from '../config/environment';
import { validateApiConnectivity, validateEnvironmentConfig, validateBrowserCompatibility } from './configValidation';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    environment: {
      status: 'pass' | 'warn' | 'fail';
      message: string;
      details?: unknown;
    };
    api: {
      status: 'pass' | 'warn' | 'fail';
      message: string;
      details?: unknown;
    };
    browser: {
      status: 'pass' | 'warn' | 'fail';
      message: string;
      details?: unknown;
    };
  };
  timestamp: string;
  environment: string;
  version: string;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  
  // Environment validation
  const envValidation = validateEnvironmentConfig();
  const envCheck = {
    status: envValidation.isValid ? 'pass' : (envValidation.warnings.length > 0 ? 'warn' : 'fail'),
    message: envValidation.isValid 
      ? 'Environment configuration is valid'
      : `Environment issues: ${envValidation.errors.join(', ')}`,
    details: envValidation
  } as const;

  // Browser compatibility
  const browserValidation = validateBrowserCompatibility();
  const browserCheck = {
    status: browserValidation.isValid ? 'pass' : (browserValidation.warnings.length > 0 ? 'warn' : 'fail'),
    message: browserValidation.isValid
      ? 'Browser compatibility check passed'
      : `Browser issues: ${browserValidation.errors.join(', ')}`,
    details: browserValidation
  } as const;

  // API connectivity
  let apiCheck;
  try {
    const apiValidation = await validateApiConnectivity();
    apiCheck = {
      status: apiValidation.isValid ? 'pass' : 'fail',
      message: apiValidation.isValid
        ? 'API connectivity check passed'
        : `API issues: ${apiValidation.errors.join(', ')}`,
      details: apiValidation
    } as const;
  } catch (error) {
    apiCheck = {
      status: 'fail',
      message: `API connectivity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    } as const;
  }

  // Determine overall status
  const checks = { environment: envCheck, api: apiCheck, browser: browserCheck };
  const hasFailures = Object.values(checks).some(check => check.status === 'fail');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
  
  const status = hasFailures ? 'unhealthy' : (hasWarnings ? 'degraded' : 'healthy');

  return {
    status,
    checks,
    timestamp,
    environment: config.environment,
    version: config.buildVersion
  };
}

/**
 * Initialize application health monitoring
 */
export function initializeHealthMonitoring(): void {
  // Perform initial health check
  performHealthCheck().then(result => {
    if (config.logging.enableConsole) {
      console.log('🏥 Initial Health Check:', result);
      
      if (result.status === 'unhealthy') {
        console.error('❌ Application health check failed');
      } else if (result.status === 'degraded') {
        console.warn('⚠️ Application health check has warnings');
      } else {
        console.log('✅ Application health check passed');
      }
    }
  }).catch(error => {
    if (config.logging.enableConsole) {
      console.error('❌ Health check initialization failed:', error);
    }
  });

  // Set up periodic health checks in production
  if (config.isProduction) {
    setInterval(async () => {
      try {
        const result = await performHealthCheck();
        if (result.status === 'unhealthy') {
          console.error('🚨 Health check failed:', result);
        }
      } catch (error) {
        console.error('❌ Periodic health check error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

/**
 * Create health check endpoint data
 */
export async function getHealthCheckEndpoint(): Promise<{
  status: number;
  body: HealthCheckResult;
}> {
  const result = await performHealthCheck();
  
  const statusCode = result.status === 'healthy' ? 200 : 
                    result.status === 'degraded' ? 200 : 503;
  
  return {
    status: statusCode,
    body: result
  };
}

/**
 * Runtime environment detection
 */
export function detectRuntimeEnvironment(): {
  isClient: boolean;
  isServer: boolean;
  userAgent?: string;
  platform?: string;
  language?: string;
  timezone?: string;
  screen?: {
    width: number;
    height: number;
  };
} {
  const isClient = typeof window !== 'undefined';
  const isServer = !isClient;

  if (isServer) {
    return { isClient, isServer };
  }

  return {
    isClient,
    isServer,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: {
      width: window.screen.width,
      height: window.screen.height
    }
  };
}

/**
 * Performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !config.features.analytics) {
    return;
  }

  // Monitor page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation && config.logging.enableConsole) {
        const metrics = {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          firstPaint: 0,
          firstContentfulPaint: 0
        };

        // Get paint metrics if available
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = Math.round(entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = Math.round(entry.startTime);
          }
        });

        console.log('📊 Performance Metrics:', metrics);
      }
    }, 1000);
  });

  // Monitor resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      if (config.logging.enableConsole) {
        console.error('📦 Resource loading error:', {
          type: target.tagName,
          src: (target as any).src || (target as any).href,
          message: event.message
        });
      }
    }
  }, true);
}