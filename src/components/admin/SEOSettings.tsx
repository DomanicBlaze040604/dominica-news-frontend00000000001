import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, FileText, Tag, Image } from 'lucide-react';
import { useAllSiteSettings, useUpdateSiteSetting } from '../../hooks/useSiteSettings';

const seoSchema = z.object({
  metaTitle: z.string().max(60, 'Meta title should not exceed 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should not exceed 160 characters').optional(),
  keywords: z.string().optional(),
  ogImage: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  canonicalUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type SEOFormData = z.infer<typeof seoSchema>;

export const SEOSettings: React.FC = () => {
  const { data: settingsData, isLoading } = useAllSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SEOFormData>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
  });

  // Watch form values for character counts
  const metaTitle = form.watch('metaTitle');
  const metaDescription = form.watch('metaDescription');

  // Populate form with existing settings
  useEffect(() => {
    if (settingsData?.data?.settings) {
      const settings = settingsData.data.settings;
      
      const seoSettings: SEOFormData = {
        metaTitle: settings.find(s => s.key === 'seo_meta_title')?.value || '',
        metaDescription: settings.find(s => s.key === 'seo_meta_description')?.value || '',
        keywords: settings.find(s => s.key === 'seo_keywords')?.value || '',
        ogImage: settings.find(s => s.key === 'seo_og_image')?.value || '',
        canonicalUrl: settings.find(s => s.key === 'seo_canonical_url')?.value || '',
      };
      
      form.reset(seoSettings);
    }
  }, [settingsData, form]);

  const onSubmit = async (data: SEOFormData) => {
    setIsSubmitting(true);
    
    try {
      const updatePromises = [
        updateSetting.mutateAsync({
          key: 'seo_meta_title',
          value: data.metaTitle || '',
          description: 'Default meta title for the website',
        }),
        updateSetting.mutateAsync({
          key: 'seo_meta_description',
          value: data.metaDescription || '',
          description: 'Default meta description for the website',
        }),
        updateSetting.mutateAsync({
          key: 'seo_keywords',
          value: data.keywords || '',
          description: 'Default keywords for the website (comma-separated)',
        }),
        updateSetting.mutateAsync({
          key: 'seo_og_image',
          value: data.ogImage || '',
          description: 'Default Open Graph image URL',
        }),
        updateSetting.mutateAsync({
          key: 'seo_canonical_url',
          value: data.canonicalUrl || '',
          description: 'Default canonical URL for the website',
        }),
      ];

      await Promise.all(updatePromises);
      toast.success('SEO settings updated successfully!');
    } catch (error) {
      console.error('Error updating SEO settings:', error);
      toast.error('Failed to update SEO settings');
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
          <Search className="h-5 w-5" />
          SEO Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure default SEO settings for your website. These will be used when specific pages don't have their own SEO data.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="metaTitle" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meta Title
            </Label>
            <Input
              id="metaTitle"
              placeholder="Dominica News - Latest Caribbean News & Updates"
              maxLength={60}
              {...form.register('metaTitle')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recommended: 50-60 characters</span>
              <span className={metaTitle?.length > 60 ? 'text-red-500' : ''}>
                {metaTitle?.length || 0}/60
              </span>
            </div>
            {form.formState.errors.metaTitle && (
              <p className="text-sm text-red-500">
                {form.formState.errors.metaTitle.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meta Description
            </Label>
            <Textarea
              id="metaDescription"
              placeholder="Stay informed with breaking news, politics, economy, and culture from the Commonwealth of Dominica and the Caribbean region."
              maxLength={160}
              rows={3}
              {...form.register('metaDescription')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recommended: 150-160 characters</span>
              <span className={metaDescription?.length > 160 ? 'text-red-500' : ''}>
                {metaDescription?.length || 0}/160
              </span>
            </div>
            {form.formState.errors.metaDescription && (
              <p className="text-sm text-red-500">
                {form.formState.errors.metaDescription.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Keywords
            </Label>
            <Input
              id="keywords"
              placeholder="dominica, caribbean news, nature island, politics, economy"
              {...form.register('keywords')}
            />
            <p className="text-xs text-muted-foreground">
              Enter keywords separated by commas. These help search engines understand your content.
            </p>
            {form.formState.errors.keywords && (
              <p className="text-sm text-red-500">
                {form.formState.errors.keywords.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Open Graph Image
            </Label>
            <Input
              id="ogImage"
              type="url"
              placeholder="https://dominicanews.com/images/og-image.jpg"
              {...form.register('ogImage')}
            />
            <p className="text-xs text-muted-foreground">
              Default image shown when your website is shared on social media. Recommended size: 1200x630px.
            </p>
            {form.formState.errors.ogImage && (
              <p className="text-sm text-red-500">
                {form.formState.errors.ogImage.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonicalUrl" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Canonical URL
            </Label>
            <Input
              id="canonicalUrl"
              type="url"
              placeholder="https://dominicanews.com"
              {...form.register('canonicalUrl')}
            />
            <p className="text-xs text-muted-foreground">
              The preferred URL for your website. This helps prevent duplicate content issues.
            </p>
            {form.formState.errors.canonicalUrl && (
              <p className="text-sm text-red-500">
                {form.formState.errors.canonicalUrl.message}
              </p>
            )}
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || updateSetting.isPending}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Updating...' : 'Update SEO Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};