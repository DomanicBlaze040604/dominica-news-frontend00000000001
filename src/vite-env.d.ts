/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_RETRY_ATTEMPTS: string;
  readonly VITE_API_RETRY_DELAY: string;

  // Environment Configuration
  readonly VITE_ENVIRONMENT: string;
  readonly NODE_ENV: string;
  readonly MODE: string;

  // Feature Flags
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_ANALYTICS: string;
  readonly VITE_ERROR_REPORTING: string;
  readonly VITE_DEV_TOOLS: string;
  readonly VITE_PERFORMANCE_MONITORING: string;
  readonly VITE_CACHE_ENABLED: string;
  readonly VITE_SERVICE_WORKER: string;
  readonly VITE_PWA_ENABLED: string;
  readonly VITE_SOCIAL_SHARING: string;

  // Security Features
  readonly VITE_SECURE_COOKIES: string;
  readonly VITE_CSRF_PROTECTION: string;
  readonly VITE_CONTENT_SECURITY_POLICY: string;

  // Logging Configuration
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_CONSOLE_LOGS: string;
  readonly VITE_REMOTE_LOGS: string;
  readonly VITE_ERROR_TRACKING: string;
  readonly VITE_PERFORMANCE_LOGS: string;

  // SEO and Meta Configuration
  readonly VITE_SITE_URL: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_DEFAULT_META_DESCRIPTION: string;
  readonly VITE_DEFAULT_META_KEYWORDS: string;
  readonly VITE_FACEBOOK_APP_ID: string;
  readonly VITE_TWITTER_HANDLE: string;

  // Performance Configuration
  readonly VITE_IMAGE_OPTIMIZATION: string;
  readonly VITE_LAZY_LOADING: string;
  readonly VITE_COMPRESSION: string;
  readonly VITE_MINIFICATION: string;

  // Build Information
  readonly VITE_BUILD_VERSION: string;
  readonly VITE_BUILD_DATE: string;
  readonly VITE_BUILD_HASH: string;
  readonly VITE_DEPLOYMENT_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
