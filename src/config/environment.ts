/**
 * Centralized environment configuration system
 * Provides type-safe access to environment variables with validation and fallbacks
 */

export interface EnvironmentConfig {
  // Environment detection
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;
  apiRetryAttempts: number;
  apiRetryDelay: number;
  
  // Feature flags
  features: {
    debugMode: boolean;
    analytics: boolean;
    errorReporting: boolean;
    devTools: boolean;
    performanceMonitoring: boolean;
    cacheEnabled: boolean;
    serviceWorker: boolean;
    pwaEnabled: boolean;
    socialSharing: boolean;
  };
  
  // Security configuration
  security: {
    secureCookies: boolean;
    csrfProtection: boolean;
    contentSecurityPolicy: boolean;
  };
  
  // Performance configuration
  performance: {
    imageOptimization: boolean;
    lazyLoading: boolean;
    compression: boolean;
    minification: boolean;
  };
  
  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
    errorTracking: boolean;
    performanceLogs: boolean;
  };
  
  // SEO and Meta configuration
  seo: {
    siteUrl: string;
    siteName: string;
    defaultDescription: string;
    defaultKeywords: string;
    facebookAppId?: string;
    twitterHandle?: string;
  };
  
  // Build information
  buildVersion: string;
  buildDate: string;
  buildHash?: string;
  deploymentEnv: string;
}

/**
 * Detect the current environment based on various indicators
 */
function detectEnvironment(): 'development' | 'staging' | 'production' {
  // Check explicit environment variable first
  const nodeEnv = import.meta.env.NODE_ENV;
  const viteMode = import.meta.env.MODE;
  const customEnv = import.meta.env.VITE_ENVIRONMENT;
  
  // Priority: VITE_ENVIRONMENT > NODE_ENV > MODE > hostname detection
  if (customEnv) {
    return customEnv as 'development' | 'staging' | 'production';
  }
  
  if (nodeEnv === 'production') {
    // Check if it's staging based on URL or other indicators
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
      }
    }
    return 'production';
  }
  
  if (nodeEnv === 'development' || viteMode === 'development') {
    return 'development';
  }
  
  // Default fallback
  return 'development';
}

/**
 * Get API base URL with environment-specific logic
 */
function getApiBaseUrl(): string {
  const environment = detectEnvironment();
  const customApiUrl = import.meta.env.VITE_API_URL;
  
  // If custom API URL is provided, use it
  if (customApiUrl) {
    return customApiUrl;
  }
  
  // Environment-specific defaults
  switch (environment) {
    case 'production':
      return 'https://web-production-af44.up.railway.app/api';
    case 'staging':
      return 'https://staging-api.dominica-news.com/api';
    case 'development':
    default:
      return 'http://localhost:8080/api';
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const requiredVars = [];
  const missingVars = [];
  
  // Check for required variables based on environment
  const environment = detectEnvironment();
  
  if (environment === 'production') {
    requiredVars.push('VITE_API_URL');
  }
  
  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    if (environment === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
}

/**
 * Get boolean value from environment variable with fallback
 */
function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true';
}

/**
 * Get string value from environment variable with fallback
 */
function getStringEnv(key: string, defaultValue: string): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * Get number value from environment variable with fallback
 */
function getNumberEnv(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Create the environment configuration object
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment();
  
  return {
    // Environment detection
    environment,
    isDevelopment: environment === 'development',
    isProduction: environment === 'production',
    isStaging: environment === 'staging',
    
    // API Configuration
    apiBaseUrl: getApiBaseUrl(),
    apiTimeout: getNumberEnv('VITE_API_TIMEOUT', 15000),
    apiRetryAttempts: getNumberEnv('VITE_API_RETRY_ATTEMPTS', environment === 'production' ? 3 : 1),
    apiRetryDelay: getNumberEnv('VITE_API_RETRY_DELAY', environment === 'production' ? 1000 : 500),
    
    // Feature flags
    features: {
      debugMode: getBooleanEnv('VITE_DEBUG_MODE', environment === 'development'),
      analytics: getBooleanEnv('VITE_ANALYTICS', environment === 'production'),
      errorReporting: getBooleanEnv('VITE_ERROR_REPORTING', environment !== 'development'),
      devTools: getBooleanEnv('VITE_DEV_TOOLS', environment === 'development'),
      performanceMonitoring: getBooleanEnv('VITE_PERFORMANCE_MONITORING', environment !== 'development'),
      cacheEnabled: getBooleanEnv('VITE_CACHE_ENABLED', environment !== 'development'),
      serviceWorker: getBooleanEnv('VITE_SERVICE_WORKER', environment === 'production'),
      pwaEnabled: getBooleanEnv('VITE_PWA_ENABLED', environment === 'production'),
      socialSharing: getBooleanEnv('VITE_SOCIAL_SHARING', environment !== 'development'),
    },
    
    // Security configuration
    security: {
      secureCookies: getBooleanEnv('VITE_SECURE_COOKIES', environment !== 'development'),
      csrfProtection: getBooleanEnv('VITE_CSRF_PROTECTION', environment !== 'development'),
      contentSecurityPolicy: getBooleanEnv('VITE_CONTENT_SECURITY_POLICY', environment !== 'development'),
    },
    
    // Performance configuration
    performance: {
      imageOptimization: getBooleanEnv('VITE_IMAGE_OPTIMIZATION', environment !== 'development'),
      lazyLoading: getBooleanEnv('VITE_LAZY_LOADING', environment !== 'development'),
      compression: getBooleanEnv('VITE_COMPRESSION', environment !== 'development'),
      minification: getBooleanEnv('VITE_MINIFICATION', environment !== 'development'),
    },
    
    // Logging configuration
    logging: {
      level: (getStringEnv('VITE_LOG_LEVEL', environment === 'development' ? 'debug' : 'info') as 'debug' | 'info' | 'warn' | 'error'),
      enableConsole: getBooleanEnv('VITE_CONSOLE_LOGS', environment === 'development'),
      enableRemote: getBooleanEnv('VITE_REMOTE_LOGS', environment !== 'development'),
      errorTracking: getBooleanEnv('VITE_ERROR_TRACKING', environment !== 'development'),
      performanceLogs: getBooleanEnv('VITE_PERFORMANCE_LOGS', environment !== 'development'),
    },
    
    // SEO and Meta configuration
    seo: {
      siteUrl: getStringEnv('VITE_SITE_URL', environment === 'development' ? 'http://localhost:5173' : 'https://dominica-news.com'),
      siteName: getStringEnv('VITE_SITE_NAME', environment === 'development' ? 'Dominica News (Dev)' : 'Dominica News'),
      defaultDescription: getStringEnv('VITE_DEFAULT_META_DESCRIPTION', 'Latest news and updates from Dominica'),
      defaultKeywords: getStringEnv('VITE_DEFAULT_META_KEYWORDS', 'dominica,news,caribbean,politics,sports,weather'),
      facebookAppId: getStringEnv('VITE_FACEBOOK_APP_ID', ''),
      twitterHandle: getStringEnv('VITE_TWITTER_HANDLE', '@DominicaNews'),
    },
    
    // Build information
    buildVersion: getStringEnv('VITE_BUILD_VERSION', environment === 'development' ? 'dev' : '1.0.0'),
    buildDate: getStringEnv('VITE_BUILD_DATE', new Date().toISOString()),
    buildHash: getStringEnv('VITE_BUILD_HASH', ''),
    deploymentEnv: getStringEnv('VITE_DEPLOYMENT_ENV', environment),
  };
}

// Validate environment on module load
validateEnvironment();

// Export the configuration
export const config: EnvironmentConfig = createEnvironmentConfig();

// Export utility functions
export const isProduction = config.isProduction;
export const isDevelopment = config.isDevelopment;
export const isStaging = config.isStaging;

// Export environment-specific helpers
export const shouldLog = (level: 'debug' | 'info' | 'warn' | 'error'): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(config.logging.level);
  const requestedLevelIndex = levels.indexOf(level);
  return requestedLevelIndex >= currentLevelIndex;
};

export const getFeatureFlag = (flag: keyof EnvironmentConfig['features']): boolean => {
  return config.features[flag];
};

export const getSecuritySetting = (setting: keyof EnvironmentConfig['security']): boolean => {
  return config.security[setting];
};

export const getPerformanceSetting = (setting: keyof EnvironmentConfig['performance']): boolean => {
  return config.performance[setting];
};

export const getSeoConfig = (): EnvironmentConfig['seo'] => {
  return config.seo;
};

// Development helpers
if (config.isDevelopment && config.logging.enableConsole) {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl,
    features: config.features,
    security: config.security,
    performance: config.performance,
    logging: config.logging,
    seo: config.seo,
  });
}