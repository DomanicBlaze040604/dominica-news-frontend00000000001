import { describe, it, expect, beforeEach, vi } from 'vitest';
import { slugService } from '../services/slug';
import { api } from '../services/api';

// Mock the API service
vi.mock('../services/api');

const mockApi = api as any;

describe('Slug Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('converts title to lowercase slug', () => {
      const result = slugService.generateSlug('Test Article Title');
      expect(result).toBe('test-article-title');
    });

    it('replaces spaces with hyphens', () => {
      const result = slugService.generateSlug('Multiple   Spaces    Here');
      expect(result).toBe('multiple-spaces-here');
    });

    it('removes special characters', () => {
      const result = slugService.generateSlug('Title with @#$% special chars!');
      expect(result).toBe('title-with-special-chars');
    });

    it('handles underscores', () => {
      const result = slugService.generateSlug('Title_with_underscores');
      expect(result).toBe('title-with-underscores');
    });

    it('removes leading and trailing hyphens', () => {
      const result = slugService.generateSlug('  -Title with spaces-  ');
      expect(result).toBe('title-with-spaces');
    });

    it('handles empty string', () => {
      const result = slugService.generateSlug('');
      expect(result).toBe('');
    });

    it('handles only special characters', () => {
      const result = slugService.generateSlug('@#$%^&*()');
      expect(result).toBe('');
    });

    it('removes multiple consecutive hyphens', () => {
      const result = slugService.generateSlug('Title---with---multiple---hyphens');
      expect(result).toBe('title-with-multiple-hyphens');
    });

    it('handles unicode characters', () => {
      const result = slugService.generateSlug('Café & Résumé');
      expect(result).toBe('caf-rsum');
    });
  });

  describe('validateArticleSlug', () => {
    it('validates unique slug successfully', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            isValid: true,
            isUnique: true,
          },
        },
      });

      const result = await slugService.validateArticleSlug('test-slug');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/validate-slug?slug=test-slug&type=article');
      expect(result.data.isUnique).toBe(true);
    });

    it('validates non-unique slug with suggestions', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            isValid: true,
            isUnique: false,
            suggestions: ['test-slug-1', 'test-slug-2'],
          },
        },
      });

      const result = await slugService.validateArticleSlug('test-slug');

      expect(result.data.isUnique).toBe(false);
      expect(result.data.suggestions).toEqual(['test-slug-1', 'test-slug-2']);
    });

    it('includes excludeId when provided', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: true },
        },
      });

      await slugService.validateArticleSlug('test-slug', 'article-id-123');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/validate-slug?slug=test-slug&type=article&excludeId=article-id-123');
    });
  });

  describe('validateCategorySlug', () => {
    it('validates category slug', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: true },
        },
      });

      const result = await slugService.validateCategorySlug('category-slug');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/validate-slug?slug=category-slug&type=category');
      expect(result.data.isUnique).toBe(true);
    });
  });

  describe('validateAuthorSlug', () => {
    it('validates author slug', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: true },
        },
      });

      const result = await slugService.validateAuthorSlug('author-slug');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/validate-slug?slug=author-slug&type=author');
      expect(result.data.isUnique).toBe(true);
    });
  });

  describe('validateStaticPageSlug', () => {
    it('validates static page slug', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: true },
        },
      });

      const result = await slugService.validateStaticPageSlug('page-slug');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/validate-slug?slug=page-slug&type=static-page');
      expect(result.data.isUnique).toBe(true);
    });
  });

  describe('generateUniqueSlug', () => {
    it('returns original slug if unique', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: true },
        },
      });

      const result = await slugService.generateUniqueSlug('Test Title', 'article');

      expect(result).toBe('test-title');
    });

    it('generates numbered slug if original is not unique', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { isValid: true, isUnique: false },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { isValid: true, isUnique: true },
          },
        });

      const result = await slugService.generateUniqueSlug('Test Title', 'article');

      expect(result).toBe('test-title-1');
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });

    it('keeps trying until unique slug is found', async () => {
      mockApi.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { isValid: true, isUnique: false },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { isValid: true, isUnique: false },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { isValid: true, isUnique: true },
          },
        });

      const result = await slugService.generateUniqueSlug('Test Title', 'article');

      expect(result).toBe('test-title-2');
      expect(mockApi.get).toHaveBeenCalledTimes(3);
    });

    it('falls back to timestamp if too many attempts', async () => {
      // Mock Date.now to return a predictable value
      const mockNow = 1234567890;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      // Mock API to always return non-unique
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: false },
        },
      });

      const result = await slugService.generateUniqueSlug('Test Title', 'article');

      expect(result).toBe(`test-title-${mockNow}`);
      expect(mockApi.get).toHaveBeenCalledTimes(100); // Should stop after 100 attempts
    });

    it('handles API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      const result = await slugService.generateUniqueSlug('Test Title', 'article');

      expect(result).toBe('test-title');
    });

    it('includes excludeId when provided', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { isValid: true, isUnique: true },
        },
      });

      await slugService.generateUniqueSlug('Test Title', 'article', 'exclude-id-123');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/validate-slug?slug=test-title&type=article&excludeId=exclude-id-123');
    });
  });

  describe('debounce', () => {
    it('debounces function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = slugService.debounce(mockFn, 100);

      // Call multiple times quickly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have been called once with the last argument
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('resets debounce timer on subsequent calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = slugService.debounce(mockFn, 100);

      debouncedFn('arg1');
      
      // Wait half the debounce time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Call again, should reset the timer
      debouncedFn('arg2');
      
      // Wait another half debounce time (total 100ms from first call, 50ms from second)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();
      
      // Wait for the remaining time
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should have been called once with the last argument
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });
});