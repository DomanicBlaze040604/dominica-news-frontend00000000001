import { config } from '../config/environment';

export interface NetworkHealthStatus {
  isHealthy: boolean;
  latency: number;
  timestamp: Date;
  error?: string;
}

export interface EndpointHealth {
  endpoint: string;
  status: NetworkHealthStatus;
}

export class NetworkHealthChecker {
  private static instance: NetworkHealthChecker;
  private healthCache: Map<string, NetworkHealthStatus> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): NetworkHealthChecker {
    if (!NetworkHealthChecker.instance) {
      NetworkHealthChecker.instance = new NetworkHealthChecker();
    }
    return NetworkHealthChecker.instance;
  }

  async checkEndpointHealth(endpoint: string): Promise<NetworkHealthStatus> {
    const cacheKey = endpoint;
    const cached = this.healthCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
      return cached;
    }

    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
        method: 'HEAD', // Use HEAD to minimize data transfer
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      const status: NetworkHealthStatus = {
        isHealthy: response.status < 500,
        latency,
        timestamp: new Date(),
      };

      this.healthCache.set(cacheKey, status);
      return status;

    } catch (error: any) {
      const latency = Date.now() - startTime;
      const status: NetworkHealthStatus = {
        isHealthy: false,
        latency,
        timestamp: new Date(),
        error: error.message || 'Network request failed',
      };

      this.healthCache.set(cacheKey, status);
      return status;
    }
  }

  async checkMultipleEndpoints(endpoints: string[]): Promise<EndpointHealth[]> {
    const promises = endpoints.map(async (endpoint) => ({
      endpoint,
      status: await this.checkEndpointHealth(endpoint),
    }));

    return Promise.all(promises);
  }

  async getOverallHealth(): Promise<{
    isHealthy: boolean;
    averageLatency: number;
    healthyEndpoints: number;
    totalEndpoints: number;
    details: EndpointHealth[];
  }> {
    const criticalEndpoints = [
      '/articles',
      '/categories',
      '/authors',
      '/auth/me',
    ];

    const results = await this.checkMultipleEndpoints(criticalEndpoints);
    const healthyEndpoints = results.filter(r => r.status.isHealthy).length;
    const averageLatency = results.reduce((sum, r) => sum + r.status.latency, 0) / results.length;

    return {
      isHealthy: healthyEndpoints >= Math.ceil(results.length * 0.75), // 75% of endpoints must be healthy
      averageLatency,
      healthyEndpoints,
      totalEndpoints: results.length,
      details: results,
    };
  }

  clearCache(): void {
    this.healthCache.clear();
  }

  // Continuous monitoring
  startMonitoring(intervalMs: number = 60000, onStatusChange?: (health: any) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const health = await this.getOverallHealth();
        if (onStatusChange) {
          onStatusChange(health);
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

// Utility functions
export const checkApiHealth = async (): Promise<NetworkHealthStatus> => {
  const checker = NetworkHealthChecker.getInstance();
  return checker.checkEndpointHealth('/articles');
};

export const runConnectivityTest = async (): Promise<{
  success: boolean;
  results: EndpointHealth[];
  summary: string;
}> => {
  const checker = NetworkHealthChecker.getInstance();
  const testEndpoints = [
    '/articles',
    '/categories',
    '/authors',
    '/breaking-news',
  ];

  try {
    const results = await checker.checkMultipleEndpoints(testEndpoints);
    const healthyCount = results.filter(r => r.status.isHealthy).length;
    const success = healthyCount === results.length;

    const summary = success
      ? `All ${results.length} endpoints are healthy`
      : `${healthyCount}/${results.length} endpoints are healthy`;

    return {
      success,
      results,
      summary,
    };
  } catch (error: any) {
    return {
      success: false,
      results: [],
      summary: `Connectivity test failed: ${error.message}`,
    };
  }
};

// React hook for network health monitoring
export const useNetworkHealth = (autoStart: boolean = true) => {
  const [health, setHealth] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const checkHealth = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const checker = NetworkHealthChecker.getInstance();
      const result = await checker.getOverallHealth();
      setHealth(result);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (autoStart) {
      checkHealth();
    }
  }, [autoStart, checkHealth]);

  return {
    health,
    isLoading,
    checkHealth,
  };
};

// Add React import for the hook
import React from 'react';