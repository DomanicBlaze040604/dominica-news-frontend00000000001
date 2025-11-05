import { api } from './api';
import { ApiResponse } from '../types/api';

export interface SlugValidationResponse {
  isValid: boolean;
  isUnique: boolean;
  suggestions?: string[];
}

export const slugService = {
  /**
   * Generate a slug from a title
   */
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove special characters except hyphens
      .replace(/[^\w\-]+/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Validate if a slug is unique for articles
   */
  validateArticleSlug: async (slug: string, excludeId?: string): Promise<ApiResponse<SlugValidationResponse>> => {
    const params = new URLSearchParams();
    params.append('slug', slug);
    params.append('type', 'article');
    if (excludeId) {
      params.append('excludeId', excludeId);
    }

    const response = await api.get<ApiResponse<SlugValidationResponse>>(
      `/admin/validate-slug?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Validate if a slug is unique for categories
   */
  validateCategorySlug: async (slug: string, excludeId?: string): Promise<ApiResponse<SlugValidationResponse>> => {
    const params = new URLSearchParams();
    params.append('slug', slug);
    params.append('type', 'category');
    if (excludeId) {
      params.append('excludeId', excludeId);
    }

    const response = await api.get<ApiResponse<SlugValidationResponse>>(
      `/admin/validate-slug?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Validate if a slug is unique for authors
   */
  validateAuthorSlug: async (slug: string, excludeId?: string): Promise<ApiResponse<SlugValidationResponse>> => {
    const params = new URLSearchParams();
    params.append('slug', slug);
    params.append('type', 'author');
    if (excludeId) {
      params.append('excludeId', excludeId);
    }

    const response = await api.get<ApiResponse<SlugValidationResponse>>(
      `/admin/validate-slug?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Validate if a slug is unique for static pages
   */
  validateStaticPageSlug: async (slug: string, excludeId?: string): Promise<ApiResponse<SlugValidationResponse>> => {
    const params = new URLSearchParams();
    params.append('slug', slug);
    params.append('type', 'static-page');
    if (excludeId) {
      params.append('excludeId', excludeId);
    }

    const response = await api.get<ApiResponse<SlugValidationResponse>>(
      `/admin/validate-slug?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Generate a unique slug by appending numbers if needed
   */
  generateUniqueSlug: async (
    title: string, 
    type: 'article' | 'category' | 'author' | 'static-page',
    excludeId?: string
  ): Promise<string> => {
    const baseSlug = slugService.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    // Keep trying until we find a unique slug
    while (true) {
      try {
        let validation: ApiResponse<SlugValidationResponse>;
        
        switch (type) {
          case 'article':
            validation = await slugService.validateArticleSlug(slug, excludeId);
            break;
          case 'category':
            validation = await slugService.validateCategorySlug(slug, excludeId);
            break;
          case 'author':
            validation = await slugService.validateAuthorSlug(slug, excludeId);
            break;
          case 'static-page':
            validation = await slugService.validateStaticPageSlug(slug, excludeId);
            break;
          default:
            throw new Error(`Unknown type: ${type}`);
        }

        if (validation.data.isUnique) {
          return slug;
        }

        // Try with a number suffix
        slug = `${baseSlug}-${counter}`;
        counter++;

        // Prevent infinite loops
        if (counter > 100) {
          return `${baseSlug}-${Date.now()}`;
        }
      } catch (error) {
        // If validation fails, return the generated slug
        console.warn('Slug validation failed, using generated slug:', error);
        return slug;
      }
    }
  },

  /**
   * Debounced slug validation for real-time feedback
   */
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  },
};