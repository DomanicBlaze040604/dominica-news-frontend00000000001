import { ApiResponse } from '../types/api';

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
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  async getSetting(key: string): Promise<ApiResponse<SiteSetting>> {
    const response = await fetch(`${this.baseUrl}/settings/${key}`);
    return response.json();
  }

  async getAllSettings(): Promise<ApiResponse<SiteSettingsResponse>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  async updateSetting(key: string, value: string, description?: string): Promise<ApiResponse<SiteSetting>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, description }),
    });
    return response.json();
  }

  async deleteSetting(key: string): Promise<ApiResponse<null>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/${key}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  // Specialized methods for different setting types
  async updateSocialMediaSettings(settings: SocialMediaSettings): Promise<ApiResponse<SiteSetting[]>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/social-media`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return response.json();
  }

  async updateContactInfo(info: ContactInfo): Promise<ApiResponse<SiteSetting[]>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/contact`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(info),
    });
    return response.json();
  }

  async updateSEOSettings(settings: SEOSettings): Promise<ApiResponse<SiteSetting[]>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/seo`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return response.json();
  }

  async updateGeneralSettings(settings: GeneralSettings): Promise<ApiResponse<SiteSetting[]>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/general`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return response.json();
  }

  async toggleMaintenanceMode(enabled: boolean): Promise<ApiResponse<SiteSetting>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/admin/settings/maintenance`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });
    return response.json();
  }
}

export const siteSettingsService = new SiteSettingsService();