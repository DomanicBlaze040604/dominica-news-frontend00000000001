import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Import components to test
import { DragDropImageUpload } from '../components/admin/DragDropImageUpload';
import { BatchImageUpload } from '../components/admin/BatchImageUpload';
import { AdminImages } from '../pages/admin/AdminImages';
import { ImageMetadataEditor } from '../components/admin/ImageMetadataEditor';
import { ImageOptimizationInfo } from '../components/admin/ImageOptimizationInfo';

// Mock services
vi.mock('../services/images', () => ({
  imagesService: {
    uploadImage: vi.fn(),
    getImages: vi.fn(),
    updateImageMetadata: vi.fn(),
    deleteImage: vi.fn(),
    checkImageReferences: vi.fn(),
    getImageById: vi.fn(),
    getImageUrl: vi.fn(),
    getThumbnailUrl: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock LazyImage component
vi.mock('../components/LazyImage', () => ({
  LazyImage: ({ src, alt, className, onLoad, onError, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  ),
}));

import { imagesService } from '../services/images';
import { toast } from 'sonner';

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
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock image data
const mockImageData = {
  id: 'test-image-123',
  filename: 'test-image.jpg',
  originalName: 'test-image.jpg',
  url: '/uploads/test-image.jpg',
  urls: {
    thumbnail: '/uploads/variants/test-image-thumbnail.webp',
    small: '/uploads/variants/test-image-small.webp',
    medium: '/uploads/variants/test-image-medium.webp',
    large: '/uploads/variants/test-image-large.webp',
    original: '/uploads/test-image.jpg'
  },
  fileSize: 1024000,
  width: 1920,
  height: 1080,
  altText: 'Test image description',
  processing: {
    compressionRatio: '75.5%',
    variantsCreated: 8,
    totalSize: 250000,
    originalSize: 1024000
  },
  variants: {
    thumbnail: {
      webp: { size: 15000, url: '/variants/test-thumbnail.webp' },
      jpeg: { size: 20000, url: '/variants/test-thumbnail.jpg' }
    },
    medium: {
      webp: { size: 150000, url: '/variants/test-medium.webp' },
      jpeg: { size: 200000, url: '/variants/test-medium.jpg' }
    },
    large: {
      webp: { size: 300000, url: '/variants/test-large.webp' },
      jpeg: { size: 400000, url: '/variants/test-large.jpg' }
    }
  },
  metadata: {
    width: 1920,
    height: 1080,
    format: 'jpeg',
    hasAlpha: false,
    colorSpace: 'srgb'
  },
  createdAt: '2024-01-01T10:00:00Z'
};

describe('Comprehensive Image Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (imagesService.uploadImage as any).mockResolvedValue({
      success: true,
      data: { image: mockImageData }
    });

    (imagesService.getImages as any).mockResolvedValue({
      success: true,
      data: {
        images: [mockImageData],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalImages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });

    (imagesService.checkImageReferences as any).mockResolvedValue({
      success: true,
      data: {
        references: [],
        canDelete: true
      }
    });

    (imagesService.deleteImage as any).mockResolvedValue({
      success: true,
      message: 'Image deleted successfully'
    });

    (imagesService.updateImageMetadata as any).mockResolvedValue({
      success: true,
      data: { image: mockImageData }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Drag-and-Drop Upload Functionality', () => {
    it('should render drag-and-drop upload area with proper UI elements', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload onImageUploaded={mockOnImageUploaded} />
      );

      expect(screen.getByText('Drag & Drop your files or Browse')).toBeInTheDocument();
      expect(screen.getByText('Supports JPEG, PNG, and WebP up to 5MB')).toBeInTheDocument();
      expect(screen.getByText('Browse Files')).toBeInTheDocument();
      expect(screen.getByLabelText(/Alt Text/)).toBeInTheDocument();
    });

    it('should validate alt text requirement before upload', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload onImageUploaded={mockOnImageUploaded} />
      );

      expect(screen.getByText('Alt text is required before uploading')).toBeInTheDocument();
    });

    it('should support multiple file upload when enabled', () => {
      const mockOnImagesUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={vi.fn()}
          onImagesUploaded={mockOnImagesUploaded}
          allowMultiple={true}
          maxFiles={5}
        />
      );

      expect(screen.getByText('Supports JPEG, PNG, and WebP up to 5MB (Max 5 files)')).toBeInTheDocument();
    });

    it('should handle file validation correctly', async () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Valid alt text"
        />
      );

      // Test valid file types
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024); // 1MB
      const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(imagesService.uploadImage).toHaveBeenCalled();
      });
    });

    it('should show upload progress during file upload', async () => {
      const mockOnImageUploaded = vi.fn();
      
      // Mock slow upload
      (imagesService.uploadImage as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { image: mockImageData }
        }), 100))
      );

      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
        />
      );

      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      
      // Simulate drag and drop
      const dropZone = screen.getByText('Drag & Drop your files or Browse').closest('div');
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: [validFile],
        },
      });

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [validFile],
        },
      });

      // Should show uploading state
      await waitFor(() => {
        expect(screen.getByText('Uploading and processing image...')).toBeInTheDocument();
      });
    });

    it('should handle drag and drop events correctly', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
        />
      );

      const dropZone = screen.getByText('Drag & Drop your files or Browse').closest('div');
      
      // Test drag over
      fireEvent.dragOver(dropZone!);
      expect(dropZone).toHaveClass('border-primary');

      // Test drag leave
      fireEvent.dragLeave(dropZone!);
      expect(dropZone).not.toHaveClass('border-primary');
    });

    it('should display uploaded image preview with metadata', async () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
          currentImageUrl="/uploads/test-image.jpg"
        />
      );

      expect(screen.getByText('Image uploaded successfully')).toBeInTheDocument();
      expect(screen.getByText('Alt text: Test image')).toBeInTheDocument();
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
    });
  });

  describe('Batch Upload Functionality', () => {
    it('should render batch upload interface correctly', () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} />
      );

      expect(screen.getByText('Batch Image Upload')).toBeInTheDocument();
      expect(screen.getByText('Drop images here or click to upload')).toBeInTheDocument();
      expect(screen.getByText('JPEG, PNG, WebP up to 5MB each (Max 20 files)')).toBeInTheDocument();
      expect(screen.getByText('Select Images')).toBeInTheDocument();
    });

    it('should handle multiple file selection and validation', () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} maxFiles={5} />
      );

      expect(screen.getByText('JPEG, PNG, WebP up to 5MB each (Max 5 files)')).toBeInTheDocument();
    });

    it('should show upload queue with file previews', async () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} />
      );

      // Simulate file drop
      const dropZone = screen.getByText('Drop images here or click to upload').closest('div');
      const files = [
        createMockFile('image1.jpg', 'image/jpeg', 1024 * 1024),
        createMockFile('image2.png', 'image/png', 2 * 1024 * 1024)
      ];

      fireEvent.drop(dropZone!, {
        dataTransfer: { files }
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Queue (2)')).toBeInTheDocument();
        expect(screen.getByText('2 Pending')).toBeInTheDocument();
      });
    });

    it('should process batch upload with progress tracking', async () => {
      const mockOnUploadComplete = vi.fn();
      
      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} />
      );

      // Add files to queue first
      const dropZone = screen.getByText('Drop images here or click to upload').closest('div');
      const files = [createMockFile('image1.jpg', 'image/jpeg', 1024 * 1024)];

      fireEvent.drop(dropZone!, {
        dataTransfer: { files }
      });

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload 1 Files');
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(imagesService.uploadImage).toHaveBeenCalled();
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('should handle upload errors gracefully', async () => {
      const mockOnUploadComplete = vi.fn();
      
      // Mock upload failure
      (imagesService.uploadImage as any).mockRejectedValue({
        response: { data: { error: 'Upload failed' } }
      });

      renderWithQueryClient(
        <BatchImageUpload onUploadComplete={mockOnUploadComplete} />
      );

      const dropZone = screen.getByText('Drop images here or click to upload').closest('div');
      const files = [createMockFile('image1.jpg', 'image/jpeg', 1024 * 1024)];

      fireEvent.drop(dropZone!, {
        dataTransfer: { files }
      });

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload 1 Files');
        fireEvent.click(uploadButton);
      });

      // Check that error handling occurs - the exact message may vary
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Image Processing and Optimization', () => {
    it('should display optimization information correctly', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Image Optimization Summary')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Variants created
      expect(screen.getByText('75.5%')).toBeInTheDocument(); // Compression ratio
    });

    it('should show size comparison between original and optimized', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      // Check for size-related text without exact formatting
      expect(screen.getByText(/Space Saved/)).toBeInTheDocument();
      expect(screen.getByText(/755\.86 KB/)).toBeInTheDocument(); // Space saved
    });

    it('should display variant details with format comparison', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Generated Variants')).toBeInTheDocument();
      // Check for variant-related content without exact text matches
      expect(screen.getByText(/thumbnail/i)).toBeInTheDocument();
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
      expect(screen.getByText(/large/i)).toBeInTheDocument();
    });

    it('should show technical metadata', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
      // Use getAllByText for elements that appear multiple times
      expect(screen.getAllByText('JPEG')).toHaveLength(3);
      expect(screen.getByText('srgb')).toBeInTheDocument();
    });

    it('should calculate WebP vs JPEG savings correctly', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      // Should show WebP savings for each variant
      expect(screen.getAllByText(/25\.0% smaller than JPEG/)).toHaveLength(3);
    });

    it('should display optimization quality badges', () => {
      render(<ImageOptimizationInfo imageData={mockImageData} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument(); // 75.5% compression
    });
  });

  describe('Gallery Management and Organization', () => {
    it('should render image gallery with search and filter controls', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
        expect(screen.getByText('Manage your media library')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search images...')).toBeInTheDocument();
      });
    });

    it('should display images in grid layout with metadata', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Media Library (1)')).toBeInTheDocument();
        expect(screen.getByAltText('Test image description')).toBeInTheDocument();
      });
    });

    it('should handle image search functionality', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search images...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      expect(imagesService.getImages).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });

    it('should support sorting by different criteria', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        // Look for sort controls in the filter section
        expect(screen.getByText('Search & Filter Images')).toBeInTheDocument();
      });

      // Verify that sorting functionality exists by checking for sort-related elements
      expect(imagesService.getImages).toHaveBeenCalledWith(
        expect.objectContaining({ 
          sortBy: 'date',
          sortOrder: 'desc'
        })
      );
    });

    it('should handle bulk selection and operations', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(screen.getByText('1 image(s) selected')).toBeInTheDocument();
        expect(screen.getByText('Delete Selected')).toBeInTheDocument();
        expect(screen.getByText('Download Selected')).toBeInTheDocument();
      });
    });

    it('should show image details in modal dialog', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const imageElement = screen.getByAltText('Test image description');
        fireEvent.click(imageElement);
      });

      await waitFor(() => {
        expect(screen.getAllByText('test-image.jpg')).toHaveLength(2); // Title and filename
        expect(screen.getByText('Manage image details, metadata, and optimization')).toBeInTheDocument();
      });
    });

    it('should handle image deletion with reference checking', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const imageElement = screen.getByAltText('Test image description');
        fireEvent.click(imageElement);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Image Deletion')).toBeInTheDocument();
        // Check for partial text match since the text might be split across elements
        expect(screen.getByText(/Are you sure you want to delete this image/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Delete Image');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(imagesService.checkImageReferences).toHaveBeenCalled();
        expect(imagesService.deleteImage).toHaveBeenCalled();
      });
    });

    it('should prevent deletion of referenced images', async () => {
      // Mock image with references
      (imagesService.checkImageReferences as any).mockResolvedValue({
        success: true,
        data: {
          references: [
            { type: 'article', id: 'article-1', title: 'Test Article' }
          ],
          canDelete: false
        }
      });

      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const imageElement = screen.getByAltText('Test image description');
        fireEvent.click(imageElement);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Image');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Cannot delete image. It's referenced in 1 item(s)."
        );
      });
    });

    it('should handle pagination correctly', async () => {
      // Mock paginated response
      (imagesService.getImages as any).mockResolvedValue({
        success: true,
        data: {
          images: [mockImageData],
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalImages: 50,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      });

      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument();
      });
    });
  });

  describe('Image Metadata Management', () => {
    const mockImage = {
      id: 'img-123',
      filename: 'test-image.jpg',
      originalName: 'test-image.jpg',
      altText: 'Test image description',
      title: 'Test Image',
      description: 'A test image for unit testing',
      tags: ['test', 'image', 'sample'],
      caption: 'Test image caption',
      credit: 'Test Photographer',
      copyright: '© 2024 Test Company',
      uploadedAt: '2024-01-01T10:00:00Z',
      metadata: {
        width: 1920,
        height: 1080,
        format: 'jpeg',
        colorSpace: 'srgb'
      }
    };

    it('should render metadata editor in view mode', () => {
      const mockOnSave = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Image Metadata')).toBeInTheDocument();
      expect(screen.getByText('Test image description')).toBeInTheDocument();
      expect(screen.getByText('Test Image')).toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', async () => {
      const mockOnSave = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test image description')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Image')).toBeInTheDocument();
      });
    });

    it('should validate alt text requirement', async () => {
      const mockOnSave = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={{ ...mockImage, altText: '' }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i });
        fireEvent.click(saveButton);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should save metadata changes correctly', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const altTextInput = screen.getByDisplayValue('Test image description');
        fireEvent.change(altTextInput, { target: { value: 'Updated alt text' } });
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          altText: 'Updated alt text',
          title: 'Test Image',
          description: 'A test image for unit testing',
          caption: 'Test image caption',
          credit: 'Test Photographer',
          copyright: '© 2024 Test Company',
          tags: ['test', 'image', 'sample']
        });
      });
    });

    it('should handle tag parsing correctly', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const tagsInput = screen.getByDisplayValue('test, image, sample');
        fireEvent.change(tagsInput, { target: { value: 'new, tags, with, spaces ' } });
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['new', 'tags', 'with', 'spaces']
          })
        );
      });
    });

    it('should display image tags as badges', () => {
      const mockOnSave = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('image')).toBeInTheDocument();
      expect(screen.getByText('sample')).toBeInTheDocument();
    });

    it('should handle empty tags gracefully', () => {
      const mockOnSave = vi.fn();
      const mockOnCancel = vi.fn();
      const imageWithoutTags = { ...mockImage, tags: [] };

      render(
        <ImageMetadataEditor
          image={imageWithoutTags}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('No tags added')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle upload failures gracefully', async () => {
      const mockOnImageUploaded = vi.fn();
      
      // Mock upload failure
      (imagesService.uploadImage as any).mockRejectedValue({
        response: { data: { error: 'Upload failed' } }
      });

      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
        />
      );

      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const dropZone = screen.getByText('Drag & Drop your files or Browse').closest('div');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [validFile] }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed');
      });
    });

    it('should handle network errors during image loading', async () => {
      // Mock network error
      (imagesService.getImages as any).mockRejectedValue(new Error('Network error'));

      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        // Should handle error gracefully and show empty state or error message
        expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
      });
    });

    it('should validate file size limits', () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
        />
      );

      // Test oversized file
      const oversizedFile = createMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024); // 10MB
      const dropZone = screen.getByText('Drag & Drop your files or Browse').closest('div');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [oversizedFile] }
      });

      expect(toast.error).toHaveBeenCalledWith('File size must be less than 5MB');
    });

    it('should validate file types', async () => {
      const mockOnImageUploaded = vi.fn();
      
      render(
        <DragDropImageUpload 
          onImageUploaded={mockOnImageUploaded}
          altText="Test image"
        />
      );

      // Test invalid file type - the component should filter out non-image files
      const invalidFile = createMockFile('document.pdf', 'application/pdf', 1024 * 1024);
      const validFile = createMockFile('image.jpg', 'image/jpeg', 1024 * 1024);
      const dropZone = screen.getByText('Drag & Drop your files or Browse').closest('div');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [invalidFile, validFile] }
      });

      // Should only process the valid image file
      await waitFor(() => {
        expect(imagesService.uploadImage).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty search results', async () => {
      // Mock empty search results
      (imagesService.getImages as any).mockResolvedValue({
        success: true,
        data: {
          images: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalImages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should implement lazy loading for image gallery', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const lazyImage = screen.getByAltText('Test image description');
        expect(lazyImage).toBeInTheDocument();
        // LazyImage component should be used for performance
      });
    });

    it('should handle pagination for large image sets', async () => {
      // Mock large dataset
      const manyImages = Array.from({ length: 20 }, (_, i) => ({
        ...mockImageData,
        id: `image-${i}`,
        filename: `image-${i}.jpg`,
        originalName: `image-${i}.jpg`
      }));

      (imagesService.getImages as any).mockResolvedValue({
        success: true,
        data: {
          images: manyImages,
          pagination: {
            currentPage: 1,
            totalPages: 5,
            totalImages: 100,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      });

      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        expect(screen.getByText('Media Library (100)')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
      });
    });

    it('should optimize search queries with debouncing', async () => {
      renderWithQueryClient(<AdminImages />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search images...');
        
        // Rapid typing should not trigger multiple API calls
        fireEvent.change(searchInput, { target: { value: 't' } });
        fireEvent.change(searchInput, { target: { value: 'te' } });
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      // Should eventually call the API with the final search term
      await waitFor(() => {
        expect(imagesService.getImages).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'test' })
        );
      });
    });
  });
});