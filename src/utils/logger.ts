/**
 * Environment-aware logging system
 * Provides structured logging with environment-specific configuration
 */

import { config, shouldLog } from '../config/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * Logger class with environment-aware configuration
 */
class Logger {
  private context: Record<string, any> = {};

  /**
   * Set context that will be included in all log entries
   */
  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear the current context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a log entry
   */
  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: config.environment,
      context: { ...this.context, ...context },
      error,
    };
  }

  /**
   * Log to console if enabled
   */
  private logToConsole(entry: LogEntry): void {
    if (!config.logging.enableConsole) return;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.environment}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context, entry.error);
        break;
      case 'info':
        console.info(message, entry.context);
        break;
      case 'warn':
        console.warn(message, entry.context, entry.error);
        break;
      case 'error':
        console.error(message, entry.context, entry.error);
        break;
    }
  }

  /**
   * Send log to remote service if enabled
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!config.logging.enableRemote) return;

    try {
      // In a real implementation, this would send to a logging service
      // For now, we'll just store it locally or send to a simple endpoint
      if (config.features.errorReporting && (entry.level === 'error' || entry.level === 'warn')) {
        // Send critical logs to error reporting service
        await this.sendToErrorReporting(entry);
      }
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote service:', error);
    }
  }

  /**
   * Send error to error reporting service
   */
  private async sendToErrorReporting(entry: LogEntry): Promise<void> {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just log to console in production
    if (config.isProduction) {
      console.error('Error Report:', entry);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, context);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    if (!shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, context);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (!shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context, error);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, context, error);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  /**
   * Log performance metrics if enabled
   */
  performance(metric: string, value: number, context?: Record<string, any>): void {
    if (!config.logging.performanceLogs || !config.features.performanceMonitoring) return;

    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit: 'ms',
      ...context,
    });
  }

  /**
   * Log API request/response if enabled
   */
  api(method: string, url: string, status: number, duration: number, context?: Record<string, any>): void {
    const level = status >= 400 ? 'warn' : 'debug';
    
    this[level](`API ${method} ${url}`, {
      method,
      url,
      status,
      duration,
      ...context,
    });
  }

  /**
   * Log user action for analytics
   */
  userAction(action: string, context?: Record<string, any>): void {
    if (!config.features.analytics) return;

    this.info(`User Action: ${action}`, {
      action,
      ...context,
    });
  }
}

// Create and export singleton logger instance
export const logger = new Logger();

// Set initial context with build information
logger.setContext({
  buildVersion: config.buildVersion,
  buildDate: config.buildDate,
  deploymentEnv: config.deploymentEnv,
});

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>, error?: Error) => logger.warn(message, context, error),
  error: (message: string, context?: Record<string, any>, error?: Error) => logger.error(message, context, error),
  performance: (metric: string, value: number, context?: Record<string, any>) => logger.performance(metric, value, context),
  api: (method: string, url: string, status: number, duration: number, context?: Record<string, any>) => 
    logger.api(method, url, status, duration, context),
  userAction: (action: string, context?: Record<string, any>) => logger.userAction(action, context),
};

// Log initialization
if (config.isDevelopment) {
  logger.info('Logger initialized', {
    logLevel: config.logging.level,
    consoleEnabled: config.logging.enableConsole,
    remoteEnabled: config.logging.enableRemote,
    errorTracking: config.logging.errorTracking,
    performanceLogs: config.logging.performanceLogs,
  });
}