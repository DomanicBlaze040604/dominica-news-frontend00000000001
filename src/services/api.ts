import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';
import { config, shouldLog } from '../config/environment';

// Retry configuration
let retryCount = 0;
const maxRetries = 3;

// Create axios instance with environment-aware configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and metadata
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    (config as AxiosRequestConfig & { metadata?: { startTime: Date } }).metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and retries
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests based on configuration
    if (config.logging.enableConsole && shouldLog('debug')) {
      const requestConfig = response.config as AxiosRequestConfig & { metadata?: { startTime: Date } };
      const duration = new Date().getTime() - (requestConfig.metadata?.startTime?.getTime() || 0);
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }
    
    // Reset retry count on success
    retryCount = 0;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Log errors based on configuration
    if (config.logging.enableConsole && shouldLog('error')) {
      console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status || 'Network Error'}`);
    }

    // Handle 401 errors by clearing token and redirecting to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      toast.error('Session expired. Please log in again.');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1500);
      
      return Promise.reject(error);
    }

    // Handle network errors with retry logic
    if (!error.response && !originalRequest._retry && retryCount < maxRetries) {
      originalRequest._retry = true;
      retryCount++;
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      console.log(`Retrying request (${retryCount}/${maxRetries}) after ${delay}ms...`);
      toast.info(`Connection failed. Retrying... (${retryCount}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(originalRequest);
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      
      toast.error(`Too many requests. Retrying in ${delay / 1000} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // Handle server errors (5xx) with retry
    if (error.response?.status && error.response.status >= 500 && !originalRequest._retry && retryCount < maxRetries) {
      originalRequest._retry = true;
      retryCount++;
      
      const delay = Math.pow(2, retryCount) * 1000;
      
      console.log(`Server error, retrying (${retryCount}/${maxRetries}) after ${delay}ms...`);
      toast.error(`Server error. Retrying... (${retryCount}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // Reset retry count for non-retryable errors
    retryCount = 0;
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),
  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),
  
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),
  
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),
  
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),
};

export default apiClient;