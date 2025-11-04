import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ConnectionStatus {
  status: 'loading' | 'success' | 'error';
  message: string;
  data?: any;
}

export const TestConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'loading',
    message: 'Testing connection...'
  });

  const testConnection = async () => {
    setConnectionStatus({ status: 'loading', message: 'Testing backend connection...' });
    
    try {
      // Test articles endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://web-production-af44.up.railway.app/api'}/articles`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setConnectionStatus({
        status: 'success',
        message: `✅ Backend connected! Found ${data.data?.length || 0} articles`,
        data: data.data?.slice(0, 3) // Show first 3 articles
      });
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: `❌ Backend connection failed: ${error.message}`
      });
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getAlertVariant = () => {
    switch (connectionStatus.status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Backend Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={getAlertVariant()}>
          <AlertDescription>
            {connectionStatus.message}
          </AlertDescription>
        </Alert>

        {connectionStatus.data && (
          <div className="space-y-2">
            <h4 className="font-semibold">Sample Articles:</h4>
            <ul className="space-y-1 text-sm">
              {connectionStatus.data.map((article: any, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  {article.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={connectionStatus.status === 'loading'}>
            {connectionStatus.status === 'loading' ? 'Testing...' : 'Test Again'}
          </Button>
          
          {connectionStatus.status === 'success' && (
            <Button variant="outline" asChild>
              <a href="/admin" target="_blank">
                Open Admin Panel
              </a>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Backend URL:</strong> {import.meta.env.VITE_API_URL || 'https://web-production-af44.up.railway.app/api'}</p>
          <p><strong>Test Endpoint:</strong> /articles</p>
          <p><strong>Admin Login:</strong> admin@dominicanews.com / Pass@12345</p>
        </div>
      </CardContent>
    </Card>
  );
};