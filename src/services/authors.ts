import { api } from './api';
import { ApiResponse, Author } from '../types/api';
import { withFallback, fallbackService } from './fallbackData';

export interface AuthorsResponse {
  authors: Author[];
  count: number;
}

export interface AuthorFormData {
  name: string;
  slug?: string;
  role: string;
  biography?: string;
  profileImage?: string;
  email: string;
  title?: string;
  professionalBackground?: string;
  expertise?: string[];
  specialization?: string[];
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  location?: string;
  phone?: string;
  website?: string;
  isActive?: boolean;
}

export const authorsService = {
  // Get all active authors (public)
  getAuthors: async (): Promise<ApiResponse<AuthorsResponse>> => {
    const response = await api.get('/authors');
    return response.data;
  },

  // Get all authors (admin)
  getAdminAuthors: async (): Promise<ApiResponse<AuthorsResponse>> => {
    return withFallback(
      async () => {
        const response = await api.get('/authors');
        return response.data;
      },
      () => fallbackService.getAdminAuthors()
    );
  },

  // Get author by ID
  getAuthorById: async (id: string): Promise<ApiResponse<{ author: Author }>> => {
    const response = await api.get(`/authors/${id}`);
    return response.data;
  },

  // Get author by slug
  getAuthorBySlug: async (slug: string): Promise<ApiResponse<{ author: Author; articles: any[]; pagination: any }>> => {
    const response = await api.get(`/authors/slug/${slug}`);
    return response.data;
  },

  // Get author statistics
  getAuthorStats: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/authors/${id}/stats`);
    return response.data;
  },

  // Toggle author status
  toggleAuthorStatus: async (id: string): Promise<ApiResponse<{ author: Author }>> => {
    const response = await api.patch(`/authors/${id}/toggle-status`);
    return response.data;
  },

  // Create new author
  createAuthor: async (data: AuthorFormData): Promise<ApiResponse<{ author: Author }>> => {
    const response = await api.post('/authors', data);
    return response.data;
  },

  // Update author
  updateAuthor: async (id: string, data: Partial<AuthorFormData>): Promise<ApiResponse<{ author: Author }>> => {
    const response = await api.put(`/authors/${id}`, data);
    return response.data;
  },

  // Delete author
  deleteAuthor: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/authors/${id}`);
    return response.data;
  },
};