import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Mail, RefreshCw } from 'lucide-react';

interface MaintenancePageProps {
  title?: string;
  message?: string;
  estimatedTime?: string;
  contactEmail?: string;
  onRetry?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  title = 'Site Under Maintenance',
  message = 'We are currently performing scheduled maintenance to improve your experience.',
  estimatedTime = 'We expect to be back online shortly.',
  contactEmail = 'support@dominicanews.com',
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            {message}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{estimatedTime}</span>
          </div>

          <div className="space-y-4">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </Button>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Need immediate assistance?
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                asChild
              >
                <a href={`mailto:${contactEmail}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Thank you for your patience.</p>
            <p className="font-semibold">— Dominica News Team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;