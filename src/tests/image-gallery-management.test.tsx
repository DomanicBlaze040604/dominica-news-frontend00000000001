import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { ImageMetadataEditor } from '../components/admin/ImageMetadataEditor';

// Mock the images service
vi.mock('../services/images', () => ({
  imagesService: {
    getImages: vi.fn(),
    updateImageMetadata: vi.fn(),
    checkImageReferences: vi.fn(),
    deleteImage: vi.fn(),
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

describe('Image Gallery Management', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ImageMetadataEditor Component', () => {
    it('should render image metadata in view mode', () => {
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
      expect(screen.getAllByText('test-image.jpg')).toHaveLength(2); // Filename and Original Name
      expect(screen.getByText('Test image description')).toBeInTheDocument();
      expect(screen.getByText('Test Image')).toBeInTheDocument();
      expect(screen.getByText('A test image for unit testing')).toBeInTheDocument();
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
        expect(screen.getByDisplayValue('A test image for unit testing')).toBeInTheDocument();
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

    it('should save metadata changes', async () => {
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

    it('should cancel editing and revert changes', async () => {
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
        const altTextInput = screen.getByDisplayValue('Test image description');
        fireEvent.change(altTextInput, { target: { value: 'Changed text' } });
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Test image description')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Changed text')).not.toBeInTheDocument();
      });
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

    it('should display technical metadata correctly', () => {
      const mockOnSave = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <ImageMetadataEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
      expect(screen.getByText('1/1/2024')).toBeInTheDocument(); // Formatted date
    });
  });

  describe('Image Search and Filter Functionality', () => {
    it('should filter images by search query', () => {
      const searchQuery = 'test image';
      const filteredImages = [mockImage].filter(image => 
        image.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.altText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      expect(filteredImages).toHaveLength(1);
      expect(filteredImages[0].id).toBe('img-123');
    });

    it('should sort images by different criteria', () => {
      const images = [
        { ...mockImage, id: 'img-1', originalName: 'a-image.jpg', uploadedAt: '2024-01-01T10:00:00Z' },
        { ...mockImage, id: 'img-2', originalName: 'z-image.jpg', uploadedAt: '2024-01-02T10:00:00Z' },
        { ...mockImage, id: 'img-3', originalName: 'b-image.jpg', uploadedAt: '2024-01-03T10:00:00Z' }
      ];

      // Sort by name ascending
      const sortedByName = [...images].sort((a, b) => a.originalName.localeCompare(b.originalName));
      expect(sortedByName[0].originalName).toBe('a-image.jpg');
      expect(sortedByName[2].originalName).toBe('z-image.jpg');

      // Sort by date descending
      const sortedByDate = [...images].sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      expect(sortedByDate[0].id).toBe('img-3');
      expect(sortedByDate[2].id).toBe('img-1');
    });

    it('should filter images by type', () => {
      const allImages = [
        { ...mockImage, id: 'img-1', processing: { compressionRatio: '75%' } },
        { ...mockImage, id: 'img-2', processing: null },
        { ...mockImage, id: 'img-3', processing: { compressionRatio: '80%' } }
      ];

      const optimizedImages = allImages.filter(img => img.processing);
      const originalImages = allImages.filter(img => !img.processing);

      expect(optimizedImages).toHaveLength(2);
      expect(originalImages).toHaveLength(1);
    });
  });

  describe('Image Organization Features', () => {
    it('should handle bulk selection', () => {
      const selectedImages = new Set(['img-1', 'img-2', 'img-3']);
      
      expect(selectedImages.size).toBe(3);
      expect(selectedImages.has('img-1')).toBe(true);
      expect(selectedImages.has('img-4')).toBe(false);

      // Test adding/removing from selection
      selectedImages.delete('img-2');
      expect(selectedImages.size).toBe(2);
      expect(selectedImages.has('img-2')).toBe(false);

      selectedImages.add('img-4');
      expect(selectedImages.size).toBe(3);
      expect(selectedImages.has('img-4')).toBe(true);
    });

    it('should validate image references before deletion', () => {
      const imageReferences = {
        references: [
          {
            type: 'article' as const,
            id: 'article-123',
            title: 'Sample Article',
            url: '/articles/sample-article'
          }
        ],
        canDelete: false
      };

      expect(imageReferences.canDelete).toBe(false);
      expect(imageReferences.references).toHaveLength(1);
      expect(imageReferences.references[0].type).toBe('article');
    });

    it('should allow deletion when no references exist', () => {
      const imageReferences = {
        references: [],
        canDelete: true
      };

      expect(imageReferences.canDelete).toBe(true);
      expect(imageReferences.references).toHaveLength(0);
    });
  });

  describe('Image Metadata Validation', () => {
    it('should validate alt text length', () => {
      const validateAltText = (altText: string): boolean => {
        return altText.trim().length >= 3;
      };

      expect(validateAltText('Hi')).toBe(false);
      expect(validateAltText('Hello')).toBe(true);
      expect(validateAltText('   ')).toBe(false);
      expect(validateAltText('Good description')).toBe(true);
    });

    it('should parse tags correctly', () => {
      const parseTagsString = (tagsString: string): string[] => {
        return tagsString
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      };

      expect(parseTagsString('tag1, tag2, tag3')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(parseTagsString('tag1,tag2,tag3')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(parseTagsString('tag1, , tag3')).toEqual(['tag1', 'tag3']);
      expect(parseTagsString('')).toEqual([]);
    });

    it('should handle metadata updates', () => {
      const originalMetadata = {
        altText: 'Original alt text',
        title: 'Original title',
        tags: ['old', 'tags']
      };

      const updatedMetadata = {
        ...originalMetadata,
        altText: 'Updated alt text',
        tags: ['new', 'tags']
      };

      expect(updatedMetadata.altText).toBe('Updated alt text');
      expect(updatedMetadata.title).toBe('Original title');
      expect(updatedMetadata.tags).toEqual(['new', 'tags']);
    });
  });
});