import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface MaintenanceStatus {
  maintenanceMode: boolean;
  message: string;
}

interface MaintenanceResponse {
  success: boolean;
  data: MaintenanceStatus;
}

/**
 * Hook to check if the site is in maintenance mode
 */
export const useMaintenanceMode = () => {
  return useQuery({
    queryKey: ['maintenance-status'],
    queryFn: async (): Promise<MaintenanceResponse> => {
      try {
        const response = await api.get('/settings/maintenance/status');
        return response.data;
      } catch (error: any) {
        // If we get a 503 response, the site is in maintenance mode
        if (error.response?.status === 503) {
          return {
            success: true,
            data: {
              maintenanceMode: true,
              message: error.response.data?.message || 'Site is under maintenance'
            }
          };
        }
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    retry: (failureCount, error: any) => {
      // Don't retry on maintenance mode (503)
      if (error?.response?.status === 503) {
        return false;
      }
      return failureCount < 3;
    },
  });
};