import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSetting } from '../hooks/useSiteSettings';

interface SocialMediaLinksProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showLabels?: boolean;
}

const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'tiktok', label: 'TikTok', icon: Music },
];

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  className = '',
  size = 'md',
  variant = 'ghost',
  showLabels = false,
}) => {
  // Get social media settings using hooks at the top level
  const { data: facebookData } = useSiteSetting('social_facebook');
  const { data: twitterData } = useSiteSetting('social_twitter');
  const { data: instagramData } = useSiteSetting('social_instagram');
  const { data: youtubeData } = useSiteSetting('social_youtube');
  const { data: linkedinData } = useSiteSetting('social_linkedin');
  const { data: tiktokData } = useSiteSetting('social_tiktok');

  // Map the data to social links
  const socialLinks = socialPlatforms.map(platform => {
    let settingData;
    switch (platform.key) {
      case 'facebook':
        settingData = facebookData;
        break;
      case 'twitter':
        settingData = twitterData;
        break;
      case 'instagram':
        settingData = instagramData;
        break;
      case 'youtube':
        settingData = youtubeData;
        break;
      case 'linkedin':
        settingData = linkedinData;
        break;
      case 'tiktok':
        settingData = tiktokData;
        break;
      default:
        settingData = null;
    }
    
    return {
      ...platform,
      url: settingData?.value || '',
    };
  }).filter(link => link.url); // Only show platforms with URLs

  if (socialLinks.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizes = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
  } as const;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {socialLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Button
            key={link.key}
            variant={variant}
            size={buttonSizes[size]}
            asChild
            className="hover:scale-110 transition-transform"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow us on ${link.label}`}
              title={`Follow us on ${link.label}`}
            >
              <Icon className={sizeClasses[size]} />
              {showLabels && <span className="ml-2">{link.label}</span>}
            </a>
          </Button>
        );
      })}
    </div>
  );
};