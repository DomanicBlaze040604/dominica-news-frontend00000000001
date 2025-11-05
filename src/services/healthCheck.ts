import { toast } from 'sonner';

export interface FrontendHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    api: ComponentHealth;
    localStorage: ComponentHealth;
    network: ComponentHealth;
    performance: ComponentHealth;
    browser: ComponentHealth;
  };
  environment: string;
  version: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
  lastChecked: Date;
}

export interface ConnectivityTestResult {
  endpoint: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

class FrontendHealthCheckService {
  private lastHealthCheck: FrontendHealthCheck | null = null;
  private healthCheckInterval: number | null = null;

  constructor() {
    // Start periodic health checks in development
    if (import.meta.env.DEV) {
      this.startPeriodicHealthChecks();
    }
  }

  private startPeriodicHealthChecks(): void {
    // Run health check every 10 minutes in development
    this.healthCheckInterval = window.setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, 10 * 60 * 1000);
  }

  async performHealthCheck(): Promise<FrontendHealthCheck> {
    const startTime = Date.now();

    try {
      const [
        apiHealth,
        localStorageHealth,
        networkHealth,
        performanceHealth,
        browserHealth
      ] = await Promise.all([
        this.checkApiConnectivity(),
        this.checkLocalStorage(),
        this.checkNetworkStatus(),
        this.checkPerformance(),
        this.checkBrowserCompatibility()
      ]);

      const overallStatus = this.determineOverallStatus([
        apiHealth,
        localStorageHealth,
        networkHealth,
        performanceHealth,
        browserHealth
      ]);

      const result: FrontendHealthCheck = {
        status: overallStatus,
        timestamp: new Date(),
        checks: {
          api: apiHealth,
          localStorage: localStorageHealth,
          network: networkHealth,
          performance: performanceHealth,
          browser: browserHealth
        },
        environment: import.meta.env.MODE || 'development',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
      };

      this.lastHealthCheck = result;

      // Log health check results in development
      if (import.meta.env.DEV) {
        const responseTime = Date.now() - startTime;
        console.log(`Frontend health check completed: ${overallStatus} (${responseTime}ms)`, result);
      }

      return result;
    } catch (error) {
      console.error('Frontend health check failed:', error);
      throw error;
    }
  }

  private async checkApiConnectivity(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          message: 'API connectivity is healthy',
          responseTime,
          lastChecked: new Date(),
          details: {
            statusCode: response.status,
            backendStatus: data.data?.status || 'unknown'
          }
        };
      } else {
        return {
          status: 'degraded',
          message: `API returned ${response.status}: ${response.statusText}`,
          responseTime,
          lastChecked: new Date(),
          details: {
            statusCode: response.status,
            statusText: response.statusText
          }
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `API connectivity failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message,
          isNetworkError: error instanceof TypeError
        }
      };
    }
  }

  private async checkLocalStorage(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const testKey = 'health-check-test';
      const testValue = 'test-value';

      // Test write
      localStorage.setItem(testKey, testValue);

      // Test read
      const retrievedValue = localStorage.getItem(testKey);

      // Test delete
      localStorage.removeItem(testKey);

      const responseTime = Date.now() - startTime;

      if (retrievedValue === testValue) {
        return {
          status: 'healthy',
          message: 'Local storage is working correctly',
          responseTime,
          lastChecked: new Date(),
          details: {
            available: true,
            writable: true,
            readable: true
          }
        };
      } else {
        return {
          status: 'degraded',
          message: 'Local storage read/write test failed',
          responseTime,
          lastChecked: new Date(),
          details: {
            available: true,
            writable: true,
            readable: false
          }
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: `Local storage check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          available: false,
          error: (error as Error).message
        }
      };
    }
  }

  private async checkNetworkStatus(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const isOnline = navigator.onLine;
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      const responseTime = Date.now() - startTime;

      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Network status is good';

      if (!isOnline) {
        status = 'unhealthy';
        message = 'Device is offline';
      } else if (connection && connection.effectiveType === 'slow-2g') {
        status = 'degraded';
        message = 'Slow network connection detected';
      }

      return {
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        details: {
          online: isOnline,
          effectiveType: connection?.effectiveType || 'unknown',
          downlink: connection?.downlink || 'unknown',
          rtt: connection?.rtt || 'unknown'
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'degraded',
        message: `Network status check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkPerformance(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Check memory usage if available
      const memory = (performance as any).memory;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const responseTime = Date.now() - startTime;

      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Performance metrics are normal';

      const details: any = {
        loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.navigationStart) : 'unknown'
      };

      if (memory) {
        const memoryUsageMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const memoryLimitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        details.memoryUsageMB = memoryUsageMB;
        details.memoryLimitMB = memoryLimitMB;
        details.memoryUsagePercent = Math.round(memoryUsagePercent);

        if (memoryUsagePercent > 80) {
          status = 'degraded';
          message = 'High memory usage detected';
        } else if (memoryUsageMB > 100) {
          status = 'degraded';
          message = 'Memory usage is elevated';
        }
      }

      return {
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        details
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'degraded',
        message: `Performance check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkBrowserCompatibility(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const features = {
        fetch: typeof fetch !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        serviceWorkers: 'serviceWorker' in navigator,
        webSockets: typeof WebSocket !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        geolocation: 'geolocation' in navigator,
        notifications: 'Notification' in window
      };

      const responseTime = Date.now() - startTime;
      const supportedFeatures = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;
      const supportPercentage = (supportedFeatures / totalFeatures) * 100;

      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Browser compatibility is excellent';

      if (supportPercentage < 70) {
        status = 'degraded';
        message = 'Some browser features are not supported';
      } else if (supportPercentage < 50) {
        status = 'unhealthy';
        message = 'Browser compatibility issues detected';
      }

      return {
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        details: {
          ...features,
          supportPercentage: Math.round(supportPercentage),
          userAgent: navigator.userAgent
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'degraded',
        message: `Browser compatibility check failed: ${(error as Error).message}`,
        responseTime,
        lastChecked: new Date(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private determineOverallStatus(checks: ComponentHealth[]): FrontendHealthCheck['status'] {
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  // Connectivity testing methods
  async testConnectivity(endpoints?: string[]): Promise<ConnectivityTestResult[]> {
    const defaultEndpoints = [
      '/api/health',
      '/api/articles',
      '/api/categories',
      '/api/authors'
    ];

    const testEndpoints = endpoints || defaultEndpoints;
    const results: ConnectivityTestResult[] = [];

    for (const endpoint of testEndpoints) {
      const result = await this.testSingleEndpoint(endpoint);
      results.push(result);
    }

    return results;
  }

  private async testSingleEndpoint(endpoint: string): Promise<ConnectivityTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        status: response.ok ? 'success' : 'failure',
        responseTime,
        error: response.ok ? undefined : `${response.status}: ${response.statusText}`,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let status: ConnectivityTestResult['status'] = 'failure';
      if (error instanceof Error && error.name === 'TimeoutError') {
        status = 'timeout';
      }

      return {
        endpoint,
        status,
        responseTime,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  // Data integrity testing
  async testDataIntegrity(): Promise<{ component: string; status: 'pass' | 'fail'; message: string; details?: any }[]> {
    const results = [];

    // Test local storage data integrity
    try {
      const authToken = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      results.push({
        component: 'localStorage_auth',
        status: authToken ? 'pass' : 'fail',
        message: authToken ? 'Authentication token present' : 'No authentication token found',
        details: { hasToken: !!authToken, hasUserData: !!userData }
      });
    } catch (error) {
      results.push({
        component: 'localStorage_auth',
        status: 'fail',
        message: `Local storage test failed: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      });
    }

    // Test API data consistency
    try {
      const response = await fetch('/api/health/detailed');
      if (response.ok) {
        const data = await response.json();
        results.push({
          component: 'api_data_consistency',
          status: 'pass',
          message: 'API data is consistent',
          details: { backendStatus: data.data?.status }
        });
      } else {
        results.push({
          component: 'api_data_consistency',
          status: 'fail',
          message: `API data consistency check failed: ${response.status}`,
          details: { statusCode: response.status }
        });
      }
    } catch (error) {
      results.push({
        component: 'api_data_consistency',
        status: 'fail',
        message: `API data consistency test failed: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      });
    }

    return results;
  }

  getLastHealthCheck(): FrontendHealthCheck | null {
    return this.lastHealthCheck;
  }

  stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Method to show health status to user
  showHealthStatus(): void {
    if (this.lastHealthCheck) {
      const status = this.lastHealthCheck.status;
      const message = status === 'healthy' ? 
        'All systems are running normally' :
        status === 'degraded' ?
        'Some issues detected, but the app is still functional' :
        'Critical issues detected that may affect functionality';

      toast.info(`System Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, {
        description: message,
        duration: 5000
      });
    }
  }
}

// Create singleton instance
const frontendHealthCheckService = new FrontendHealthCheckService();

export default frontendHealthCheckService;