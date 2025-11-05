import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const newStatus: NetworkStatus = {
        isOnline: navigator.onLine,
        isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
        connectionType: connection ? connection.type || 'unknown' : 'unknown',
        effectiveType: connection ? connection.effectiveType || 'unknown' : 'unknown',
      };

      setNetworkStatus(newStatus);

      // Show notifications for connection changes
      if (!wasOffline && !newStatus.isOnline) {
        setWasOffline(true);
        toast.error('Connection lost', {
          description: 'You are now offline. Some features may not work.',
          duration: 5000,
        });
      } else if (wasOffline && newStatus.isOnline) {
        setWasOffline(false);
        toast.success('Connection restored', {
          description: 'You are back online!',
          duration: 3000,
        });
      }

      // Warn about slow connections
      if (newStatus.isOnline && newStatus.isSlowConnection) {
        toast.warning('Slow connection detected', {
          description: 'You may experience slower loading times.',
          duration: 4000,
        });
      }
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();
    const handleConnectionChange = () => updateNetworkStatus();

    // Initial status
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if supported
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [wasOffline]);

  return networkStatus;
};

// Hook for retrying failed requests when connection is restored
export const useRetryOnReconnect = (retryFn: () => void, dependencies: any[] = []) => {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setWasOffline(false);
      // Retry the function when connection is restored
      retryFn();
    }
  }, [isOnline, wasOffline, retryFn, ...dependencies]);

  return { isOnline, wasOffline };
};