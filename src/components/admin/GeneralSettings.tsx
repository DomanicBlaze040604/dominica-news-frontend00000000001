import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Globe, AlertTriangle, Settings } from 'lucide-react';
import { useAllSiteSettings, useUpdateSiteSetting } from '../../hooks/useSiteSettings';

const generalSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100, 'Site name is too long'),
  siteDescription: z.string().max(500, 'Description is too long').optional(),
  maintenanceMode: z.boolean(),
});

type GeneralFormData = z.infer<typeof generalSchema>;

export const GeneralSettings: React.FC = () => {
  const { data: settingsData, isLoading } = useAllSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      siteName: '',
      siteDescription: '',
      maintenanceMode: false,
    },
  });

  const maintenanceMode = form.watch('maintenanceMode');

  // Populate form with existing settings
  useEffect(() => {
    if (settingsData?.data?.settings) {
      const settings = settingsData.data.settings;
      
      const generalSettings: GeneralFormData = {
        siteName: settings.find(s => s.key === 'site_name')?.value || 'Dominica News',
        siteDescription: settings.find(s => s.key === 'site_description')?.value || '',
        maintenanceMode: settings.find(s => s.key === 'maintenance_mode')?.value === 'true',
      };
      
      form.reset(generalSettings);
    }
  }, [settingsData, form]);

  const onSubmit = async (data: GeneralFormData) => {
    setIsSubmitting(true);
    
    try {
      const updatePromises = [
        updateSetting.mutateAsync({
          key: 'site_name',
          value: data.siteName,
          description: 'The name of the website',
        }),
        updateSetting.mutateAsync({
          key: 'site_description',
          value: data.siteDescription || '',
          description: 'A brief description of the website',
        }),
        updateSetting.mutateAsync({
          key: 'maintenance_mode',
          value: data.maintenanceMode.toString(),
          description: 'Whether the site is in maintenance mode',
        }),
      ];

      await Promise.all(updatePromises);
      toast.success('General settings updated successfully!');
      
      if (data.maintenanceMode) {
        toast.info('Maintenance mode is now enabled. Visitors will see a maintenance page.');
      }
    } catch (error) {
      console.error('Error updating general settings:', error);
      toast.error('Failed to update general settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          General Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure basic website information and site-wide settings.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site Name
            </Label>
            <Input
              id="siteName"
              placeholder="Dominica News - Nature Island Updates"
              {...form.register('siteName')}
            />
            <p className="text-xs text-muted-foreground">
              This will appear in the browser title and throughout the site.
            </p>
            {form.formState.errors.siteName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.siteName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              placeholder="Your premier source for news and updates from the Commonwealth of Dominica and the Caribbean region."
              rows={3}
              {...form.register('siteDescription')}
            />
            <p className="text-xs text-muted-foreground">
              A brief description of your website. This may be used in search results and social media.
            </p>
            {form.formState.errors.siteDescription && (
              <p className="text-sm text-red-500">
                {form.formState.errors.siteDescription.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Maintenance Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable maintenance mode to show a maintenance page to visitors
                </p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={(checked) => form.setValue('maintenanceMode', checked)}
              />
            </div>

            {maintenanceMode && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Maintenance mode is enabled. Regular visitors will see a maintenance page. 
                  Only administrators will be able to access the full site.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || updateSetting.isPending}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Updating...' : 'Update General Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};