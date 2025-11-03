import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Music } from 'lucide-react';
import { useAllSiteSettings, useUpdateSiteSetting } from '../../hooks/useSiteSettings';

const socialMediaSchema = z.object({
  facebook: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  twitter: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  instagram: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  youtube: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  tiktok: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://www.facebook.com/dominicanewsofficial' },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: 'https://www.twitter.com/dominicanews_dm' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://www.instagram.com/dominicanews_official' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://www.youtube.com/c/DominicaNews' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://www.linkedin.com/company/dominica-news' },
  { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: 'https://www.tiktok.com/@dominicanews' },
];

export const SocialMediaSettings: React.FC = () => {
  const { data: settingsData, isLoading } = useAllSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      linkedin: '',
      tiktok: '',
    },
  });

  // Populate form with existing settings
  useEffect(() => {
    if (settingsData?.data?.settings) {
      const settings = settingsData.data.settings;
      const socialSettings: SocialMediaFormData = {};
      
      socialPlatforms.forEach(platform => {
        const setting = settings.find(s => s.key === `social_${platform.key}`);
        socialSettings[platform.key as keyof SocialMediaFormData] = setting?.value || '';
      });
      
      form.reset(socialSettings);
    }
  }, [settingsData, form]);

  const onSubmit = async (data: SocialMediaFormData) => {
    setIsSubmitting(true);
    
    try {
      // Update each social media setting
      const updatePromises = socialPlatforms.map(platform => {
        const value = data[platform.key as keyof SocialMediaFormData] || '';
        return updateSetting.mutateAsync({
          key: `social_${platform.key}`,
          value,
          description: `${platform.label} profile URL`,
        });
      });

      await Promise.all(updatePromises);
      toast.success('Social media settings updated successfully!');
    } catch (error) {
      console.error('Error updating social media settings:', error);
      toast.error('Failed to update social media settings');
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
          <Facebook className="h-5 w-5" />
          Social Media Links
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your social media profile URLs. These will be displayed in the website footer.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.key} className="space-y-2">
                <Label htmlFor={platform.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {platform.label}
                </Label>
                <Input
                  id={platform.key}
                  type="url"
                  placeholder={platform.placeholder}
                  {...form.register(platform.key as keyof SocialMediaFormData)}
                />
                {form.formState.errors[platform.key as keyof SocialMediaFormData] && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors[platform.key as keyof SocialMediaFormData]?.message}
                  </p>
                )}
              </div>
            );
          })}
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || updateSetting.isPending}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Updating...' : 'Update Social Media Links'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};