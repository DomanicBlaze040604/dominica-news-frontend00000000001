import { ApiResponse } from '../types/api';
import { api } from './api';

export interface SiteSetting {
  _id: string;
  key: string;
  value: string;
  description?: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface SiteSettingsResponse {
  settings: SiteSetting[];
}

export interface SocialMediaSettings {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
}

export interface SEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface GeneralSettings {
  siteName?: string;
  siteDescription?: string;
  maintenanceMode?: boolean;
}

class SiteSettingsService {
  async getSetting(key: string): Promise<ApiResponse<SiteSetting>> {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  }

  async getAllSettings(): Promise<ApiResponse<SiteSettingsResponse>> {
    const response = await api.get('/settings');
    return response.data;
  }

  async updateSetting(key: string, value: string, description?: string): Promise<ApiResponse<SiteSetting>> {
    const response = await api.put('/settings', { key, value, description });
    return response.data;
  }

  async deleteSetting(key: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/settings/${key}`);
    return response.data;
  }

  // Specialized methods for different setting types
  async updateSocialMediaSettings(settings: SocialMediaSettings): Promise<ApiResponse<SiteSetting[]>> {
    const response = await api.put('/settings/social-media', settings);
    return response.data;
  }

  async updateContactInfo(info: ContactInfo): Promise<ApiResponse<SiteSetting[]>> {
    const response = await api.put('/settings/contact', info);
    return response.data;
  }

  async updateSEOSettings(settings: SEOSettings): Promise<ApiResponse<SiteSetting[]>> {
    const response = await api.put('/settings/seo', settings);
    return response.data;
  }

  async updateGeneralSettings(settings: GeneralSettings): Promise<ApiResponse<SiteSetting[]>> {
    const response = await api.put('/settings/general', settings);
    return response.data;
  }

  async toggleMaintenanceMode(enabled: boolean): Promise<ApiResponse<SiteSetting>> {
    const response = await api.put('/settings/maintenance', { enabled });
    return response.data;
  }

  // Get public settings for website display
  async getPublicSettings(): Promise<ApiResponse<SiteSettingsResponse>> {
    const response = await api.get('/settings');
    return response.data;
  }

  async getPublicSocialMedia(): Promise<ApiResponse<SocialMediaSettings>> {
    const response = await api.get('/settings/social-media');
    return response.data;
  }

  async getPublicContactInfo(): Promise<ApiResponse<ContactInfo>> {
    const response = await api.get('/settings/contact');
    return response.data;
  }
}

export const siteSettingsService = new SiteSettingsService();