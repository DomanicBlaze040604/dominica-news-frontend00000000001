import React, { useState, useEffect, useRef } from 'react';
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
import { Globe, AlertTriangle, Settings, Upload, X, Image } from 'lucide-react';
import { useAllSiteSettings, useUpdateSiteSetting } from '../../hooks/useSiteSettings';
import { api } from '../../services/api';

const generalSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100, 'Site name is too long'),
  siteDescription: z.string().max(500, 'Description is too long').optional(),
  copyrightText: z.string().max(200, 'Copyright text is too long').optional(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(500, 'Maintenance message is too long').optional(),
});

type GeneralFormData = z.infer<typeof generalSchema>;

export const GeneralSettings: React.FC = () => {
  const { data: settingsData, isLoading, refetch } = useAllSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      siteName: '',
      siteDescription: '',
      copyrightText: '',
      maintenanceMode: false,
      maintenanceMessage: '',
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
        copyrightText: settings.find(s => s.key === 'copyright_text')?.value || '',
        maintenanceMode: settings.find(s => s.key === 'maintenance_mode')?.value === 'true',
        maintenanceMessage: settings.find(s => s.key === 'maintenance_message')?.value || '',
      };
      
      // Set logo URL
      const logoSetting = settings.find(s => s.key === 'logo');
      setLogoUrl(logoSetting?.value || '');
      
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
          key: 'copyright_text',
          value: data.copyrightText || '',
          description: 'Copyright text displayed in footer',
        }),
        updateSetting.mutateAsync({
          key: 'maintenance_mode',
          value: data.maintenanceMode.toString(),
          description: 'Whether the site is in maintenance mode',
        }),
        updateSetting.mutateAsync({
          key: 'maintenance_message',
          value: data.maintenanceMessage || '',
          description: 'Custom maintenance mode message',
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/admin/settings/logo/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setLogoUrl(response.data.data.logoUrl);
        toast.success('Logo uploaded successfully!');
        refetch(); // Refresh settings data
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoDelete = async () => {
    try {
      const response = await api.delete('/admin/settings/logo');
      
      if (response.data.success) {
        setLogoUrl('');
        toast.success('Logo deleted successfully!');
        refetch(); // Refresh settings data
      }
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error(error.response?.data?.message || 'Failed to delete logo');
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

          {/* Logo Upload Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Website Logo
            </Label>
            
            {logoUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <img 
                    src={logoUrl.startsWith('http') ? logoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${logoUrl}`}
                    alt="Website Logo" 
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-logo.png';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-xs text-muted-foreground">
                      {logoUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLogoDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-muted-foreground mb-2">No logo uploaded</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a logo for your website. Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
            </p>
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

          <div className="space-y-2">
            <Label htmlFor="copyrightText">Copyright Text</Label>
            <Input
              id="copyrightText"
              placeholder="© 2024 Dominica News. All rights reserved."
              {...form.register('copyrightText')}
            />
            <p className="text-xs text-muted-foreground">
              Copyright text displayed in the website footer.
            </p>
            {form.formState.errors.copyrightText && (
              <p className="text-sm text-red-500">
                {form.formState.errors.copyrightText.message}
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
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Maintenance mode is enabled. Regular visitors will see a maintenance page. 
                    Only administrators will be able to access the full site.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    placeholder="We are currently performing scheduled maintenance to improve your experience. Please check back soon."
                    rows={3}
                    {...form.register('maintenanceMessage')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom message to display to visitors during maintenance mode.
                  </p>
                  {form.formState.errors.maintenanceMessage && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.maintenanceMessage.message}
                    </p>
                  )}
                </div>
              </div>
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