import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useSiteSetting } from '../../hooks/useSiteSettings';

interface HeaderProps {
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ children }) => {
  // Get site settings
  const { data: siteNameData } = useSiteSetting('site_name');
  const { data: maintenanceModeData } = useSiteSetting('maintenance_mode');

  const siteName = siteNameData?.data?.value || 'Dominica News';
  const isMaintenanceMode = maintenanceModeData?.data?.value === 'true';

  return (
    <header>
      {/* Maintenance Mode Banner */}
      {isMaintenanceMode && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Maintenance Mode:</strong> The site is currently under maintenance. 
            Some features may be temporarily unavailable.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Header Content */}
      {children}
    </header>
  );
};