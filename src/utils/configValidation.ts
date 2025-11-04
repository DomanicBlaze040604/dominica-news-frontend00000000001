/**
 * Configuration validation utilities
 * Provides runtime validation of configuration and environment setup
 */

import { config } from '../config/environment';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate API connectivity
 */
export async function validateApiConnectivity(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Test basic connectivity to the API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${config.apiBaseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      result.errors.push(`API health check failed with status: ${response.status}`);
      result.isValid = false;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.errors.push('API health check timed out');
      } else {
        result.errors.push(`API connectivity error: ${error.message}`);
      }
    } else {
      result.errors.push('Unknown API connectivity error');
    }
    result.isValid = false;
  }

  return result;
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check API base URL format
  try {
    new URL(config.apiBaseUrl);
  } catch {
    result.errors.push('Invalid API base URL format');
    result.isValid = false;
  }

  // Check timeout values
  if (config.apiTimeout < 1000) {
    result.warnings.push('API timeout is very low (< 1 second)');
  }

  if (config.apiTimeout > 60000) {
    result.warnings.push('API timeout is very high (> 60 seconds)');
  }

  // Production-specific validations
  if (config.isProduction) {
    if (config.apiBaseUrl.includes('localhost')) {
      result.errors.push('Production environment should not use localhost API URL');
      result.isValid = false;
    }

    if (config.features.debugMode) {
      result.warnings.push('Debug mode is enabled in production');
    }

    if (config.logging.level === 'debug') {
      result.warnings.push('Debug logging is enabled in production');
    }
  }

  // Development-specific validations
  if (config.isDevelopment) {
    if (!config.features.debugMode) {
      result.warnings.push('Debug mode is disabled in development');
    }
  }

  return result;
}

/**
 * Validate browser compatibility
 */
export function validateBrowserCompatibility(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check for required browser features
  if (typeof window === 'undefined') {
    return result; // Skip validation in SSR/Node environment
  }

  // Check for fetch API
  if (!window.fetch) {
    result.errors.push('Fetch API is not supported');
    result.isValid = false;
  }

  // Check for localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch {
    result.warnings.push('localStorage is not available');
  }

  // Check for modern JavaScript features
  if (!window.Promise) {
    result.errors.push('Promises are not supported');
    result.isValid = false;
  }

  // Check for ES6 features
  try {
    // Test arrow functions and const/let using Function constructor instead of eval
    new Function('const test = () => {}');
  } catch {
    result.warnings.push('ES6 features may not be fully supported');
  }

  return result;
}

/**
 * Run all validations
 */
export async function runAllValidations(): Promise<{
  environment: ValidationResult;
  browser: ValidationResult;
  api: ValidationResult;
  overall: ValidationResult;
}> {
  const environment = validateEnvironmentConfig();
  const browser = validateBrowserCompatibility();
  const api = await validateApiConnectivity();

  const overall: ValidationResult = {
    isValid: environment.isValid && browser.isValid && api.isValid,
    errors: [...environment.errors, ...browser.errors, ...api.errors],
    warnings: [...environment.warnings, ...browser.warnings, ...api.warnings],
  };

  return {
    environment,
    browser,
    api,
    overall,
  };
}

/**
 * Log validation results
 */
export function logValidationResults(results: ValidationResult, context: string): void {
  if (!config.logging.enableConsole) {
    return;
  }

  if (results.isValid) {
    console.log(`✅ ${context} validation passed`);
  } else {
    console.error(`❌ ${context} validation failed:`, results.errors);
  }

  if (results.warnings.length > 0) {
    console.warn(`⚠️ ${context} warnings:`, results.warnings);
  }
}