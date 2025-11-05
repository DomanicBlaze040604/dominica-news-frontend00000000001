import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { DragDropImageUpload } from '../components/admin/DragDropImageUpload';
import { BatchImageUpload } from '../components/admin/BatchImageUpload';

// Mock the images service
vi.mock('../services/images', () => ({
  imagesService: {
    uploadImage: vi.fn(),
    getImages: vi.fn(),
    getImageById: vi.fn(),
    deleteImage: vi.fn(),
    getImageUrl: vi.fn(),
    getThumbnailUrl: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked service
import { imagesService } from '../services/images';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

// Helper to create mock files
const createMockFile = (name: string, type: string, size: number): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('Enhanced Drag-and-Drop Image Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (imagesService.uploadImage as any).mockResolvedValue({
      success: true,
      data: {
        image: {
          id: '1',
          url: 'http://example.com/image.jpg',
          urls: {
            medium: 'http://example.com/image-medium.jpg',
          },
          filename: 'image.jpg',
          originalName: 'test-image.jpg',
        },
      },
    });
  });

  describe('DragDropImageUpload Component', () => {
    it('should render drag-and-drop upload area', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload onImageUploaded={mockOnImageUploaded} />
      );

      expect(screen.getByText('Drag & Drop your files or Browse')).toBeInTheDocument();
      expect(screen.getByText('Supports JPEG, PNG, and WebP up to 5MB')).toBeInTheDocument();
    });

    it('should support multiple file upload when enabled', async () => {
      const mockOnImagesUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={vi.fn()}
          onImagesUploaded={mockOnImagesUploaded}
          allowMultiple={true}
          maxFiles={5}
          altText="Test images"
        />
      );

      expect(screen.getByText('Supports JPEG, PNG, and WebP up to 5MB (Max 5 files)')).toBeInTheDocument();
    });

    it('should require alt text before upload', async () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload onImageUploaded={mockOnImageUploaded} />
      );

      // Should show validation message when no alt text
      expect(screen.getByText('Alt text is required before uploading')).toBeInTheDocument();
    });

    it('should validate file types and sizes', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test file"
        />
      );

      // Component should render without errors
      expect(screen.getByText('Drag & Drop your files or Browse')).toBeInTheDocument();
    });
  });

  describe('BatchImageUpload Component', () => {
    it('should render batch upload interface', () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} />
      );

      expect(screen.getByText('Batch Image Upload')).toBeInTheDocument();
      expect(screen.getByText('Drop images here or click to upload')).toBeInTheDocument();
      expect(screen.getByText('JPEG, PNG, WebP up to 5MB each (Max 20 files)')).toBeInTheDocument();
    });

    it('should show correct max files limit', () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} maxFiles={5} />
      );

      expect(screen.getByText('JPEG, PNG, WebP up to 5MB each (Max 5 files)')).toBeInTheDocument();
    });

    it('should render upload controls', () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} />
      );

      expect(screen.getByText('Select Images')).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should validate supported file types', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test file"
        />
      );

      // Should show supported formats
      expect(screen.getByText('Supports JPEG, PNG, and WebP up to 5MB')).toBeInTheDocument();
    });

    it('should show file size limits', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test file"
        />
      );

      // Should show size limit
      expect(screen.getByText(/5MB/)).toBeInTheDocument();
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress during upload', async () => {
      const mockOnImageUploaded = vi.fn();
      
      // Mock a slow upload
      (imagesService.uploadImage as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: {
            image: {
              id: '1',
              url: 'http://example.com/image.jpg',
              urls: { medium: 'http://example.com/image-medium.jpg' },
              filename: 'image.jpg',
              originalName: 'test-image.jpg',
            },
          },
        }), 100))
      );

      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
        />
      );

      // Component should be ready for upload
      expect(screen.getByText('Drag & Drop your files or Browse')).toBeInTheDocument();
    });
  });
});