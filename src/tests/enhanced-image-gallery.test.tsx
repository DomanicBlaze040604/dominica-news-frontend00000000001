import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminImages } from '../pages/admin/AdminImages';
import { imagesService } from '../services/images';

// Mock the services
vi.mock('../services/images');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock LazyImage component
vi.mock('../components/LazyImage', () => ({
  LazyImage: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

// Mock other components
vi.mock('../components/admin/BatchImageUpload', () => ({
  BatchImageUpload: ({ onUploadComplete }: any) => (
    <div data-testid="batch-upload">
      <button onClick={() => onUploadComplete()}>Upload Complete</button>
    </div>
  ),
}));

vi.mock('../components/admin/ImageOptimizationInfo', () => ({
  ImageOptimizationInfo: ({ imageData }: any) => (
    <div data-testid="optimization-info">
      Optimization info for {imageData.filename}
    </div>
  ),
}));

vi.mock('../components/admin/ImageMetadataEditor', () => ({
  ImageMetadataEditor: ({ image, onSave, onCancel }: any) => (
    <div data-testid="metadata-editor">
      <input 
        data-testid="alt-text-input"
        defaultValue={image.altText}
        onChange={(e) => {}}
      />
      <button onClick={() => onSave({ altText: 'Updated alt text' })}>
        Save
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockImages = [
  {
    id: 'img1',
    filename: 'test-image-1.jpg',
    originalName: 'test-image-1.jpg',
    filePath: '/uploads/images/test-image-1.jpg',
    url: '/uploads/images/test-image-1.jpg',
    thumbnailUrl: '/uploads/images/variants/test-image-1-thumbnail.webp',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    altText: 'Test image 1',
    createdAt: '2024-01-01T00:00:00Z',
    urls: {
      original: '/uploads/images/test-image-1.jpg',
      large: '/uploads/images/variants/test-image-1-large.webp',
      medium: '/uploads/images/variants/test-image-1-medium.webp',
      small: '/uploads/images/variants/test-image-1-small.webp',
      thumbnail: '/uploads/images/variants/test-image-1-thumbnail.webp',
      navigationThumbnail: '/uploads/images/variants/test-image-1-thumbnail.webp'
    },
    webpUrls: {
      original: '/uploads/images/test-image-1.webp',
      large: '/uploads/images/variants/test-image-1-large.webp',
      medium: '/uploads/images/variants/test-image-1-medium.webp',
      small: '/uploads/images/variants/test-image-1-small.webp'
    },
    uploader: {
      id: 'user1',
      email: 'admin@test.com',
      fullName: 'Admin User',
      role: 'admin' as const,
      createdAt: '2024-01-01T00:00:00Z'
    },
    processing: {
      compressionRatio: '25%',
      variantsCreated: 8,
      totalSize: 768000,
      originalSize: 1024000
    },
    variants: {
      thumbnail: {
        webp: { size: 15000, url: '/uploads/images/variants/test-image-1-thumbnail.webp' },
        jpeg: { size: 20000, url: '/uploads/images/variants/test-image-1-thumbnail.jpg' }
      },
      medium: {
        webp: { size: 150000, url: '/uploads/images/variants/test-image-1-medium.webp' },
        jpeg: { size: 200000, url: '/uploads/images/variants/test-image-1-medium.jpg' }
      }
    },
    metadata: {
      width: 1920,
      height: 1080,
      format: 'jpeg',
      colorSpace: 'srgb',
      hasAlpha: false,
      density: 72
    }
  },
  {
    id: 'img2',
    filename: 'test-image-2.png',
    originalName: 'test-image-2.png',
    filePath: '/uploads/images/test-image-2.png',
    url: '/uploads/images/test-image-2.png',
    thumbnailUrl: '/uploads/images/test-image-2.png',
    fileSize: 512000,
    mimeType: 'image/png',
    width: 800,
    height: 600,
    altText: 'Test image 2',
    createdAt: '2024-01-02T00:00:00Z',
    urls: {
      original: '/uploads/images/test-image-2.png',
      large: '/uploads/images/test-image-2.png',
      medium: '/uploads/images/test-image-2.png',
      small: '/uploads/images/test-image-2.png',
      thumbnail: '/uploads/images/test-image-2.png',
      navigationThumbnail: '/uploads/images/test-image-2.png'
    },
    webpUrls: {
      original: '/uploads/images/test-image-2.webp',
      large: '/uploads/images/test-image-2.webp',
      medium: '/uploads/images/test-image-2.webp',
      small: '/uploads/images/test-image-2.webp'
    },
    uploader: {
      id: 'user1',
      email: 'admin@test.com',
      fullName: 'Admin User',
      role: 'admin' as const,
      createdAt: '2024-01-01T00:00:00Z'
    }
  }
];

const mockImagesResponse = {
  success: true,
  data: {
    images: mockImages,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalImages: 2,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 20
    }
  }
};

describe('Enhanced Image Gallery Management', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminImages />
      </QueryClientProvider>
    );
  };

  describe('Image Gallery Display', () => {
    it('should display images with enhanced metadata', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
        expect(screen.getByText('test-image-2.png')).toBeInTheDocument();
      });

      // Check that optimization badges are shown for processed images
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should handle search functionality', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search images...');
      fireEvent.change(searchInput, { target: { value: 'test-image-1' } });

      await waitFor(() => {
        expect(imagesService.getImages).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test-image-1'
          })
        );
      });
    });

    it('should handle sorting and filtering', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      renderComponent();

      // Test sorting
      const sortSelect = screen.getByDisplayValue('Upload Date');
      fireEvent.click(sortSelect);
      
      await waitFor(() => {
        const nameOption = screen.getByText('File Name');
        fireEvent.click(nameOption);
      });

      await waitFor(() => {
        expect(imagesService.getImages).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'name'
          })
        );
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk selection', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Select images using checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Check that bulk actions are shown
      await waitFor(() => {
        expect(screen.getByText(/image\(s\) selected/)).toBeInTheDocument();
        expect(screen.getByText('Delete Selected')).toBeInTheDocument();
      });
    });

    it('should handle bulk delete with confirmation', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);
      vi.mocked(imagesService.deleteImage).mockResolvedValue({ success: true, data: {} });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Select an image
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Click bulk delete
      const deleteButton = screen.getByText('Delete Selected');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(imagesService.deleteImage).toHaveBeenCalledWith('img1');
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Image Metadata Management', () => {
    it('should open metadata editor in dialog', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Click on an image to open dialog
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        expect(screen.getByText('Metadata')).toBeInTheDocument();
      });

      // Click on metadata tab
      const metadataTab = screen.getByText('Metadata');
      fireEvent.click(metadataTab);

      await waitFor(() => {
        expect(screen.getByTestId('metadata-editor')).toBeInTheDocument();
      });
    });

    it('should save metadata changes', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);
      vi.mocked(imagesService.updateImageMetadata).mockResolvedValue({
        success: true,
        data: { image: mockImages[0] }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Open image dialog and metadata tab
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        const metadataTab = screen.getByText('Metadata');
        fireEvent.click(metadataTab);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(imagesService.updateImageMetadata).toHaveBeenCalledWith(
          'img1',
          { altText: 'Updated alt text' }
        );
      });
    });
  });

  describe('Image Reference Checking', () => {
    it('should check references before deletion', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);
      vi.mocked(imagesService.checkImageReferences).mockResolvedValue({
        success: true,
        data: {
          references: [],
          canDelete: true
        }
      });
      vi.mocked(imagesService.deleteImage).mockResolvedValue({ success: true, data: {} });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Open image dialog
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Confirm deletion in dialog
      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Image');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(imagesService.checkImageReferences).toHaveBeenCalledWith('img1');
        expect(imagesService.deleteImage).toHaveBeenCalledWith('img1');
      });
    });

    it('should prevent deletion when references exist', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);
      vi.mocked(imagesService.checkImageReferences).mockResolvedValue({
        success: true,
        data: {
          references: [
            {
              type: 'article',
              id: 'article-1',
              title: 'Test Article',
              url: '/articles/test-article'
            }
          ],
          canDelete: false
        }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Open image dialog and try to delete
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Confirm deletion in dialog
      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Image');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(imagesService.checkImageReferences).toHaveBeenCalledWith('img1');
        expect(imagesService.deleteImage).not.toHaveBeenCalled();
      });
    });
  });

  describe('Image Optimization Display', () => {
    it('should show optimization info for processed images', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Open image dialog
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        const optimizationTab = screen.getByText('Optimization');
        fireEvent.click(optimizationTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId('optimization-info')).toBeInTheDocument();
      });
    });

    it('should show no optimization message for unprocessed images', async () => {
      const unprocessedResponse = {
        ...mockImagesResponse,
        data: {
          ...mockImagesResponse.data,
          images: [mockImages[1]] // Image without processing data
        }
      };

      vi.mocked(imagesService.getImages).mockResolvedValue(unprocessedResponse);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-2.png')).toBeInTheDocument();
      });

      // Open image dialog
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        const optimizationTab = screen.getByText('Optimization');
        fireEvent.click(optimizationTab);
      });

      await waitFor(() => {
        expect(screen.getByText('No optimization data available')).toBeInTheDocument();
      });
    });
  });

  describe('URL Management', () => {
    it('should copy image URLs to clipboard', async () => {
      vi.mocked(imagesService.getImages).mockResolvedValue(mockImagesResponse);

      // Mock clipboard API
      const writeTextSpy = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextSpy,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
      });

      // Open image dialog
      const imageElement = screen.getAllByRole('img')[0];
      fireEvent.click(imageElement);

      await waitFor(() => {
        const copyButton = screen.getByText('Copy URL');
        fireEvent.click(copyButton);
      });

      expect(writeTextSpy).toHaveBeenCalledWith('/uploads/images/variants/test-image-1-medium.webp');
    });
  });
});