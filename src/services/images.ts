import { api } from './api';
import { ApiResponse, Image, ImagesResponse } from '../types/api';
import { withFallback, fallbackService } from './fallbackData';

export const imagesService = {
  // Admin endpoints
  uploadImage: async (file: File | FormData): Promise<ApiResponse<{ image: Image }>> => {
    let formData: FormData;
    
    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append('image', file);
    }
    
    const response = await api.post<ApiResponse<{ image: Image }>>(
      '/images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getImages: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    filter?: string;
  }): Promise<ApiResponse<ImagesResponse>> => {
    return withFallback(
      async () => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
        if (params?.filter) searchParams.append('filter', params.filter);

        const response = await api.get<ApiResponse<ImagesResponse>>(
          `/images?${searchParams.toString()}`
        );
        return response.data;
      },
      () => fallbackService.getImages(params)
    );
  },

  getImageById: async (id: string): Promise<ApiResponse<{ image: Image }>> => {
    const response = await api.get<ApiResponse<{ image: Image }>>(`/images/${id}`);
    return response.data;
  },

  deleteImage: async (id: string): Promise<ApiResponse<{}>> => {
    const response = await api.delete<ApiResponse<{}>>(`/images/${id}`);
    return response.data;
  },

  updateImageMetadata: async (id: string, metadata: {
    altText: string;
    title?: string;
    description?: string;
    caption?: string;
    credit?: string;
    copyright?: string;
    tags?: string[];
  }): Promise<ApiResponse<{ image: Image }>> => {
    const response = await api.put<ApiResponse<{ image: Image }>>(
      `/images/${id}/metadata`,
      metadata
    );
    return response.data;
  },

  checkImageReferences: async (id: string): Promise<ApiResponse<{
    references: Array<{
      type: 'article' | 'author' | 'category' | 'static-page';
      id: string;
      title: string;
      url?: string;
    }>;
    canDelete: boolean;
  }>> => {
    const response = await api.get<ApiResponse<any>>(`/images/${id}/references`);
    return response.data;
  },

  // Utility functions
  getImageUrl: (filename: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/images/${filename}`;
  },

  getThumbnailUrl: (filename: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/images/thumbnails/thumb-${filename}`;
  },
};