# Environment Configuration Guide

This document describes the environment configuration system for the Dominica News application.

## Overview

The application uses a comprehensive environment configuration system that supports multiple deployment environments with appropriate settings for each.

## Environment Files

### `.env` (Production Default)
The main environment file that serves as the production fallback configuration.

### `.env.development`
Development-specific configuration with debugging enabled and analytics disabled.

### `.env.production`
Production-optimized configuration with security features enabled and debugging disabled.

### `.env.staging`
Staging environment configuration that mirrors production but with additional logging.

### `.env.local`
Local overrides (not committed to version control).

## Environment Variables

### API Configuration
- `VITE_API_URL`: Backend API base URL
- `VITE_API_TIMEOUT`: Request timeout in milliseconds
- `VITE_API_RETRY_ATTEMPTS`: Number of retry attempts for failed requests
- `VITE_API_RETRY_DELAY`: Delay between retry attempts in milliseconds

### Environment Detection
- `VITE_ENVIRONMENT`: Explicit environment setting (development/staging/production)
- `NODE_ENV`: Node.js environment variable

### Feature Flags
- `VITE_DEBUG_MODE`: Enable/disable debug mode
- `VITE_ANALYTICS`: Enable/disable analytics tracking
- `VITE_ERROR_REPORTING`: Enable/disable error reporting
- `VITE_DEV_TOOLS`: Enable/disable development tools
- `VITE_PERFORMANCE_MONITORING`: Enable/disable performance monitoring
- `VITE_CACHE_ENABLED`: Enable/disable caching
- `VITE_SERVICE_WORKER`: Enable/disable service worker
- `VITE_PWA_ENABLED`: Enable/disable PWA features
- `VITE_SOCIAL_SHARING`: Enable/disable social media sharing

### Security Configuration
- `VITE_SECURE_COOKIES`: Enable secure cookie settings
- `VITE_CSRF_PROTECTION`: Enable CSRF protection
- `VITE_CONTENT_SECURITY_POLICY`: Enable CSP headers

### Performance Configuration
- `VITE_IMAGE_OPTIMIZATION`: Enable image optimization
- `VITE_LAZY_LOADING`: Enable lazy loading
- `VITE_COMPRESSION`: Enable asset compression
- `VITE_MINIFICATION`: Enable code minification

### Logging Configuration
- `VITE_LOG_LEVEL`: Logging level (debug/info/warn/error)
- `VITE_CONSOLE_LOGS`: Enable console logging
- `VITE_REMOTE_LOGS`: Enable remote logging
- `VITE_ERROR_TRACKING`: Enable error tracking
- `VITE_PERFORMANCE_LOGS`: Enable performance logging

### SEO and Meta Configuration
- `VITE_SITE_URL`: Site base URL
- `VITE_SITE_NAME`: Site name for meta tags
- `VITE_DEFAULT_META_DESCRIPTION`: Default meta description
- `VITE_DEFAULT_META_KEYWORDS`: Default meta keywords
- `VITE_FACEBOOK_APP_ID`: Facebook app ID for social features
- `VITE_TWITTER_HANDLE`: Twitter handle for social features

### Build Information
- `VITE_BUILD_VERSION`: Application version
- `VITE_BUILD_DATE`: Build timestamp
- `VITE_BUILD_HASH`: Git commit hash
- `VITE_DEPLOYMENT_ENV`: Deployment environment identifier

## Environment-Specific Configurations

### Development Environment
```bash
# Optimized for development workflow
VITE_DEBUG_MODE=true
VITE_ANALYTICS=false
VITE_ERROR_REPORTING=false
VITE_DEV_TOOLS=true
VITE_LOG_LEVEL=debug
VITE_CONSOLE_LOGS=true
VITE_REMOTE_LOGS=false
```

### Production Environment
```bash
# Optimized for production performance and security
VITE_DEBUG_MODE=false
VITE_ANALYTICS=true
VITE_ERROR_REPORTING=true
VITE_DEV_TOOLS=false
VITE_LOG_LEVEL=warn
VITE_CONSOLE_LOGS=false
VITE_REMOTE_LOGS=true
VITE_SECURE_COOKIES=true
VITE_CSRF_PROTECTION=true
```

### Staging Environment
```bash
# Production-like with additional debugging
VITE_DEBUG_MODE=false
VITE_ANALYTICS=false
VITE_ERROR_REPORTING=true
VITE_DEV_TOOLS=false
VITE_LOG_LEVEL=info
VITE_CONSOLE_LOGS=false
VITE_REMOTE_LOGS=true
```

## Usage in Code

### Accessing Configuration
```typescript
import { config } from '@/config/environment';

// Environment detection
if (config.isProduction) {
  // Production-specific code
}

// Feature flags
if (config.features.analytics) {
  // Initialize analytics
}

// API configuration
const apiClient = new ApiClient({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
});
```

### Logging
```typescript
import { logger } from '@/utils/logger';

// Environment-aware logging
logger.info('User action', { action: 'login', userId: 123 });
logger.error('API error', { endpoint: '/api/users' }, error);
logger.performance('page-load', 1250);
```

### Feature Flags
```typescript
import { getFeatureFlag } from '@/config/environment';

if (getFeatureFlag('debugMode')) {
  console.log('Debug information');
}
```

## Validation

### Automatic Validation
The environment configuration is automatically validated on application startup. Validation includes:

- Required variables for each environment
- URL format validation
- Feature flag consistency
- Security setting verification

### Manual Validation
Run the validation script manually:

```bash
npm run validate:env
```

### Build-time Validation
Environment validation is included in the production build process:

```bash
npm run build:prod
```

## Best Practices

### Security
1. Never commit sensitive values to version control
2. Use `.env.local` for local overrides
3. Enable security features in production
4. Validate URLs and sensitive configurations

### Performance
1. Disable debugging features in production
2. Enable caching and optimization features
3. Use appropriate logging levels
4. Monitor performance metrics

### Development
1. Enable debugging and development tools
2. Use verbose logging for troubleshooting
3. Disable analytics and tracking
4. Use local API endpoints

### Deployment
1. Validate environment configuration before deployment
2. Use environment-specific builds
3. Monitor configuration in production
4. Document any custom configurations

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check that all required variables are set
   - Run `npm run validate:env` to identify missing variables

2. **Invalid URL Formats**
   - Ensure URLs include protocol (http:// or https://)
   - Validate URL format using the validation script

3. **Feature Flag Conflicts**
   - Review feature flag settings for environment consistency
   - Check for conflicting configurations

4. **Build Failures**
   - Verify TypeScript types are updated for new variables
   - Check that all environment files are properly formatted

### Debugging

1. **Enable Debug Mode**
   ```bash
   VITE_DEBUG_MODE=true
   VITE_LOG_LEVEL=debug
   VITE_CONSOLE_LOGS=true
   ```

2. **Check Configuration**
   ```typescript
   import { getEnvironmentSummary } from '@/utils/environmentValidation';
   console.log(getEnvironmentSummary());
   ```

3. **Validate Configuration**
   ```bash
   npm run validate:env
   ```

## Migration Guide

When adding new environment variables:

1. Add the variable to all environment files
2. Update the TypeScript interface in `src/vite-env.d.ts`
3. Update the configuration system in `src/config/environment.ts`
4. Add validation rules in `src/utils/environmentValidation.ts`
5. Update this documentation
6. Test in all environments