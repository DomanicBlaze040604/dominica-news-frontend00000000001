import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GeneralSettings } from '../components/admin/GeneralSettings';
import { SocialMediaSettings } from '../components/admin/SocialMediaSettings';
import { ContactSettings } from '../components/admin/ContactSettings';
import { SEOSettings } from '../components/admin/SEOSettings';
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Settings Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GeneralSettings', () => {
    const mockSettingsData = {
      success: true,
      data: {
        settings: [
          { key: 'site_name', value: 'Test Site', _id: '1' },
          { key: 'site_description', value: 'Test Description', _id: '2' },
          { key: 'copyright_text', value: '© 2024 Test Site', _id: '3' },
          { key: 'maintenance_mode', value: 'false', _id: '4' },
          { key: 'logo', value: '/test-logo.png', _id: '5' },
        ],
      },
    };

    beforeEach(() => {
      (api.get as any).mockResolvedValue({ data: mockSettingsData });
      (api.put as any).mockResolvedValue({ data: { success: true } });
    });

    it('should render general settings form', async () => {
      renderWithQueryClient(<GeneralSettings />);

      await waitFor(() => {
        expect(screen.getByText('General Settings')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/site name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/site description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/copyright text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maintenance mode/i)).toBeInTheDocument();
    });

    it('should populate form with existing settings', async () => {
      renderWithQueryClient(<GeneralSettings />);

      await waitFor(() => {
        const siteNameInput = screen.getByDisplayValue('Test Site');
        expect(siteNameInput).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('© 2024 Test Site')).toBeInTheDocument();
    });

    it('should submit general settings form', async () => {
      renderWithQueryClient(<GeneralSettings />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
      });

      const siteNameInput = screen.getByDisplayValue('Test Site');
      fireEvent.change(siteNameInput, { target: { value: 'Updated Site Name' } });

      const submitButton = screen.getByText('Update General Settings');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/settings', {
          key: 'site_name',
          value: 'Updated Site Name',
          description: 'The name of the website',
        });
      });
    });

    it('should toggle maintenance mode', async () => {
      renderWithQueryClient(<GeneralSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/maintenance mode/i)).toBeInTheDocument();
      });

      const maintenanceToggle = screen.getByRole('switch');
      fireEvent.click(maintenanceToggle);

      const submitButton = screen.getByText('Update General Settings');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/settings', {
          key: 'maintenance_mode',
          value: 'true',
          description: 'Whether the site is in maintenance mode',
        });
      });
    });

    it('should validate required fields', async () => {
      renderWithQueryClient(<GeneralSettings />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
      });

      const siteNameInput = screen.getByDisplayValue('Test Site');
      fireEvent.change(siteNameInput, { target: { value: '' } });

      const submitButton = screen.getByText('Update General Settings');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Site name is required')).toBeInTheDocument();
      });
    });
  });

  describe('SocialMediaSettings', () => {
    const mockSocialSettings = {
      success: true,
      data: {
        settings: [
          { key: 'social_facebook', value: 'https://facebook.com/test', _id: '1' },
          { key: 'social_twitter', value: 'https://twitter.com/test', _id: '2' },
          { key: 'social_instagram', value: 'https://instagram.com/test', _id: '3' },
        ],
      },
    };

    beforeEach(() => {
      (api.get as any).mockResolvedValue({ data: mockSocialSettings });
      (api.put as any).mockResolvedValue({ data: { success: true } });
    });

    it('should render social media settings form', async () => {
      renderWithQueryClient(<SocialMediaSettings />);

      await waitFor(() => {
        expect(screen.getByText('Social Media Links')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/facebook/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/instagram/i)).toBeInTheDocument();
    });

    it('should validate social media URLs', async () => {
      renderWithQueryClient(<SocialMediaSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/facebook/i)).toBeInTheDocument();
      });

      const facebookInput = screen.getByLabelText(/facebook/i);
      fireEvent.change(facebookInput, { target: { value: 'invalid-url' } });

      const submitButton = screen.getByText('Update Social Media Links');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });
  });

  describe('ContactSettings', () => {
    const mockContactSettings = {
      success: true,
      data: {
        settings: [
          { key: 'contact_email', value: 'test@example.com', _id: '1' },
          { key: 'contact_phone', value: '+1234567890', _id: '2' },
          { key: 'contact_address', value: '123 Test St', _id: '3' },
        ],
      },
    };

    beforeEach(() => {
      (api.get as any).mockResolvedValue({ data: mockContactSettings });
      (api.put as any).mockResolvedValue({ data: { success: true } });
    });

    it('should render contact settings form', async () => {
      renderWithQueryClient(<ContactSettings />);

      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      renderWithQueryClient(<ContactSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/contact email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByText('Update Contact Information');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });
  });

  describe('SEOSettings', () => {
    const mockSEOSettings = {
      success: true,
      data: {
        settings: [
          { key: 'seo_meta_title', value: 'Test Meta Title', _id: '1' },
          { key: 'seo_meta_description', value: 'Test Meta Description', _id: '2' },
          { key: 'seo_keywords', value: 'test, keywords', _id: '3' },
        ],
      },
    };

    beforeEach(() => {
      (api.get as any).mockResolvedValue({ data: mockSEOSettings });
      (api.put as any).mockResolvedValue({ data: { success: true } });
    });

    it('should render SEO settings form', async () => {
      renderWithQueryClient(<SEOSettings />);

      await waitFor(() => {
        expect(screen.getByText('SEO Settings')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument();
    });

    it('should validate meta title length', async () => {
      renderWithQueryClient(<SEOSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument();
      });

      const metaTitleInput = screen.getByLabelText(/meta title/i);
      fireEvent.change(metaTitleInput, { target: { value: 'a'.repeat(61) } });

      const submitButton = screen.getByText('Update SEO Settings');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Meta title should not exceed 60 characters')).toBeInTheDocument();
      });
    });

    it('should validate meta description length', async () => {
      renderWithQueryClient(<SEOSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument();
      });

      const metaDescInput = screen.getByLabelText(/meta description/i);
      fireEvent.change(metaDescInput, { target: { value: 'a'.repeat(161) } });

      const submitButton = screen.getByText('Update SEO Settings');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Meta description should not exceed 160 characters')).toBeInTheDocument();
      });
    });
  });
});