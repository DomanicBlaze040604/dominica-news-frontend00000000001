/**
 * Environment validation utilities
 * Validates environment configuration and provides helpful error messages
 */

import { config } from '../config/environment';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required environment variables for production
 */
export function validateProductionEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required production variables
  const requiredVars = [
    'VITE_API_URL',
    'VITE_SITE_URL',
    'VITE_SITE_NAME',
  ];

  // Check for missing required variables
  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate API URL format
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !isValidUrl(apiUrl)) {
    errors.push(`Invalid API URL format: ${apiUrl}`);
  }

  // Validate site URL format
  const siteUrl = import.meta.env.VITE_SITE_URL;
  if (siteUrl && !isValidUrl(siteUrl)) {
    errors.push(`Invalid site URL format: ${siteUrl}`);
  }

  // Check for HTTPS in production
  if (config.isProduction) {
    if (apiUrl && !apiUrl.startsWith('https://')) {
      warnings.push('API URL should use HTTPS in production');
    }
    if (siteUrl && !siteUrl.startsWith('https://')) {
      warnings.push('Site URL should use HTTPS in production');
    }
  }

  // Validate timeout values
  const apiTimeout = config.apiTimeout;
  if (apiTimeout < 1000 || apiTimeout > 60000) {
    warnings.push(`API timeout (${apiTimeout}ms) should be between 1000ms and 60000ms`);
  }

  // Validate retry configuration
  if (config.apiRetryAttempts < 0 || config.apiRetryAttempts > 5) {
    warnings.push(`API retry attempts (${config.apiRetryAttempts}) should be between 0 and 5`);
  }

  // Validate logging level
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push(`Invalid log level: ${config.logging.level}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  // Production-specific validations
  if (config.isProduction) {
    // Analytics should be enabled in production
    if (!config.features.analytics) {
      warnings.push('Analytics should be enabled in production');
    }

    // Error reporting should be enabled in production
    if (!config.features.errorReporting) {
      warnings.push('Error reporting should be enabled in production');
    }

    // Debug mode should be disabled in production
    if (config.features.debugMode) {
      warnings.push('Debug mode should be disabled in production');
    }

    // Dev tools should be disabled in production
    if (config.features.devTools) {
      warnings.push('Dev tools should be disabled in production');
    }

    // Console logs should be disabled in production
    if (config.logging.enableConsole) {
      warnings.push('Console logs should be disabled in production');
    }

    // Security features should be enabled in production
    if (!config.security.secureCookies) {
      warnings.push('Secure cookies should be enabled in production');
    }
    if (!config.security.csrfProtection) {
      warnings.push('CSRF protection should be enabled in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate development environment configuration
 */
export function validateDevelopmentEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Development-specific validations
  if (config.isDevelopment) {
    // Debug mode should be enabled in development
    if (!config.features.debugMode) {
      warnings.push('Debug mode should be enabled in development');
    }

    // Console logs should be enabled in development
    if (!config.logging.enableConsole) {
      warnings.push('Console logs should be enabled in development');
    }

    // Analytics should typically be disabled in development
    if (config.features.analytics) {
      warnings.push('Analytics should typically be disabled in development');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate current environment configuration
 */
export function validateCurrentEnvironment(): ValidationResult {
  if (config.isProduction) {
    return validateProductionEnvironment();
  } else if (config.isDevelopment) {
    return validateDevelopmentEnvironment();
  } else {
    // Staging environment - use production validation with relaxed warnings
    const result = validateProductionEnvironment();
    // Convert some errors to warnings for staging
    return result;
  }
}

/**
 * Log validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('❌ Environment Configuration Errors:');
    result.errors.forEach(error => console.error(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment configuration is valid');
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment configuration summary for debugging
 */
export function getEnvironmentSummary(): Record<string, any> {
  return {
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl,
    features: config.features,
    security: config.security,
    performance: config.performance,
    logging: config.logging,
    seo: config.seo,
    buildInfo: {
      version: config.buildVersion,
      date: config.buildDate,
      hash: config.buildHash,
      deploymentEnv: config.deploymentEnv,
    },
  };
}

// Auto-validate environment on module load in development
if (config.isDevelopment && config.logging.enableConsole) {
  const result = validateCurrentEnvironment();
  logValidationResults(result);
  
  if (config.features.debugMode) {
    console.log('🔧 Environment Summary:', getEnvironmentSummary());
  }
}