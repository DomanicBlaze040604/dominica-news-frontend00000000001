import React from 'react';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';
import { MaintenancePage } from './MaintenancePage';
import { useAuth } from '../hooks/useAuth';

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that checks for maintenance mode and shows maintenance page
 * Allows admin users to bypass maintenance mode
 */
export const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({ children }) => {
  const { data: maintenanceData, isLoading, refetch } = useMaintenanceMode();
  const { user } = useAuth();

  // Show loading state while checking maintenance mode
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if site is in maintenance mode
  const isMaintenanceMode = maintenanceData?.data?.maintenanceMode;
  const isAdmin = user?.role === 'admin';

  // Show maintenance page if in maintenance mode and user is not admin
  if (isMaintenanceMode && !isAdmin) {
    return (
      <MaintenancePage
        title="Site Under Maintenance"
        message="We are currently performing scheduled maintenance to improve your experience. Please check back soon."
        estimatedTime="We expect to be back online shortly."
        contactEmail="support@dominicanews.com"
        onRetry={() => refetch()}
      />
    );
  }

  // Render normal app
  return <>{children}</>;
};

export default MaintenanceWrapper;