import { vi, describe, it, expect, beforeEach } from 'vitest';
import { siteSettingsService } from '../services/siteSettings';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SiteSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should get individual setting by key', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            _id: '1',
            key: 'site_name',
            value: 'Test Site',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      };

      (api.get as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.getSetting('site_name');

      expect(api.get).toHaveBeenCalledWith('/settings/site_name');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAllSettings', () => {
    it('should get all settings', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            settings: [
              { _id: '1', key: 'site_name', value: 'Test Site' },
              { _id: '2', key: 'site_description', value: 'Test Description' },
            ],
          },
        },
      };

      (api.get as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.getAllSettings();

      expect(api.get).toHaveBeenCalledWith('/settings');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateSetting', () => {
    it('should update individual setting', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            _id: '1',
            key: 'site_name',
            value: 'Updated Site Name',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      };

      (api.put as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.updateSetting(
        'site_name',
        'Updated Site Name',
        'The name of the website'
      );

      expect(api.put).toHaveBeenCalledWith('/settings', {
        key: 'site_name',
        value: 'Updated Site Name',
        description: 'The name of the website',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteSetting', () => {
    it('should delete setting', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
        },
      };

      (api.delete as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.deleteSetting('test_setting');

      expect(api.delete).toHaveBeenCalledWith('/settings/test_setting');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateSocialMediaSettings', () => {
    it('should update social media settings', async () => {
      const socialMediaData = {
        facebook: 'https://facebook.com/test',
        twitter: 'https://twitter.com/test',
        instagram: 'https://instagram.com/test',
      };

      const mockResponse = {
        data: {
          success: true,
          data: [
            { key: 'social_facebook', value: socialMediaData.facebook },
            { key: 'social_twitter', value: socialMediaData.twitter },
            { key: 'social_instagram', value: socialMediaData.instagram },
          ],
        },
      };

      (api.put as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.updateSocialMediaSettings(socialMediaData);

      expect(api.put).toHaveBeenCalledWith('/settings/social-media', socialMediaData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateContactInfo', () => {
    it('should update contact information', async () => {
      const contactData = {
        email: 'contact@example.com',
        phone: '+1234567890',
        address: '123 Test Street',
        workingHours: '9 AM - 5 PM',
      };

      const mockResponse = {
        data: {
          success: true,
          data: [
            { key: 'contact_email', value: contactData.email },
            { key: 'contact_phone', value: contactData.phone },
            { key: 'contact_address', value: contactData.address },
            { key: 'contact_workingHours', value: contactData.workingHours },
          ],
        },
      };

      (api.put as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.updateContactInfo(contactData);

      expect(api.put).toHaveBeenCalledWith('/settings/contact', contactData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateSEOSettings', () => {
    it('should update SEO settings', async () => {
      const seoData = {
        metaTitle: 'Test Meta Title',
        metaDescription: 'Test Meta Description',
        keywords: ['test', 'keywords'],
        ogImage: 'https://example.com/image.jpg',
      };

      const mockResponse = {
        data: {
          success: true,
          data: [
            { key: 'seo_meta_title', value: seoData.metaTitle },
            { key: 'seo_meta_description', value: seoData.metaDescription },
            { key: 'seo_keywords', value: seoData.keywords.join(', ') },
            { key: 'seo_og_image', value: seoData.ogImage },
          ],
        },
      };

      (api.put as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.updateSEOSettings(seoData);

      expect(api.put).toHaveBeenCalledWith('/settings/seo', seoData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      const generalData = {
        siteName: 'Updated Site Name',
        siteDescription: 'Updated Description',
        maintenanceMode: true,
      };

      const mockResponse = {
        data: {
          success: true,
          data: [
            { key: 'site_name', value: generalData.siteName },
            { key: 'site_description', value: generalData.siteDescription },
            { key: 'maintenance_mode', value: generalData.maintenanceMode.toString() },
          ],
        },
      };

      (api.put as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.updateGeneralSettings(generalData);

      expect(api.put).toHaveBeenCalledWith('/settings/general', generalData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('toggleMaintenanceMode', () => {
    it('should toggle maintenance mode', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            key: 'maintenance_mode',
            value: 'true',
          },
        },
      };

      (api.put as any).mockResolvedValue(mockResponse);

      const result = await siteSettingsService.toggleMaintenanceMode(true);

      expect(api.put).toHaveBeenCalledWith('/settings/maintenance', { enabled: true });
      expect(result).toEqual(mockResponse.data);
    });
  });
});