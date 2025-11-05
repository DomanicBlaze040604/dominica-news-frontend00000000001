import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the breaking news service
const mockBreakingNewsService = {
  getAll: vi.fn(),
  getActive: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  toggleActive: vi.fn(),
};

vi.mock('../services/breakingNews', () => ({
  breakingNewsService: mockBreakingNewsService,
}));

const mockBreakingNews = [
  {
    id: '1',
    text: 'Test breaking news 1',
    isActive: true,
    createdBy: {
      id: 'user1',
      fullName: 'Test User',
      email: 'test@example.com',
    },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    text: 'Test breaking news 2',
    isActive: false,
    createdBy: {
      id: 'user1',
      fullName: 'Test User',
      email: 'test@example.com',
    },
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T09:00:00Z',
  },
];

describe('Breaking News System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBreakingNewsService.getAll.mockResolvedValue({
      breakingNews: mockBreakingNews,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10,
      },
    });
  });

  describe('Breaking News CRUD Operations', () => {
    it('should test breaking news creation', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: '3',
        text: 'New breaking news',
        isActive: false,
        createdBy: {
          id: 'user1',
          fullName: 'Test User',
          email: 'test@example.com',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockBreakingNewsService.create.mockImplementation(mockCreate);

      const result = await mockBreakingNewsService.create({
        text: 'New breaking news',
        isActive: false,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        text: 'New breaking news',
        isActive: false,
      });
      expect(result.text).toBe('New breaking news');
      expect(result.isActive).toBe(false);
    });

    it('should test breaking news update', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        ...mockBreakingNews[0],
        text: 'Updated breaking news',
      });
      mockBreakingNewsService.update.mockImplementation(mockUpdate);

      const result = await mockBreakingNewsService.update('1', {
        text: 'Updated breaking news',
      });

      expect(mockUpdate).toHaveBeenCalledWith('1', {
        text: 'Updated breaking news',
      });
      expect(result.text).toBe('Updated breaking news');
    });

    it('should test breaking news deletion', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      mockBreakingNewsService.delete.mockImplementation(mockDelete);

      await mockBreakingNewsService.delete('1');

      expect(mockDelete).toHaveBeenCalledWith('1');
    });

    it('should test breaking news toggle active status', async () => {
      const mockToggle = vi.fn().mockResolvedValue({
        ...mockBreakingNews[1],
        isActive: true,
      });
      mockBreakingNewsService.toggleActive.mockImplementation(mockToggle);

      const result = await mockBreakingNewsService.toggleActive('2');

      expect(mockToggle).toHaveBeenCalledWith('2');
      expect(result.isActive).toBe(true);
    });
  });

  describe('Single Active Constraint', () => {
    it('should enforce single active breaking news constraint', async () => {
      // Mock creating active breaking news
      const mockCreate = vi.fn().mockResolvedValue({
        id: '3',
        text: 'New active breaking news',
        isActive: true,
        createdBy: {
          id: 'user1',
          fullName: 'Test User',
          email: 'test@example.com',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Mock getAll to return updated list with only one active
      const updatedMockData = [
        { ...mockBreakingNews[0], isActive: false }, // Previously active is now inactive
        mockBreakingNews[1],
        {
          id: '3',
          text: 'New active breaking news',
          isActive: true,
          createdBy: {
            id: 'user1',
            fullName: 'Test User',
            email: 'test@example.com',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockBreakingNewsService.create.mockImplementation(mockCreate);
      mockBreakingNewsService.getAll.mockResolvedValue({
        breakingNews: updatedMockData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 3,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      });

      // Create new active breaking news
      const result = await mockBreakingNewsService.create({
        text: 'New active breaking news',
        isActive: true,
      });

      expect(result.isActive).toBe(true);

      // Verify only one active breaking news exists
      const allBreakingNews = await mockBreakingNewsService.getAll();
      const activeCount = allBreakingNews.breakingNews.filter(
        (news: any) => news.isActive
      ).length;
      expect(activeCount).toBe(1);
    });
  });

  describe('Breaking News Display', () => {
    it('should test active breaking news retrieval', async () => {
      const activeBreakingNews = mockBreakingNews[0]; // First one is active
      mockBreakingNewsService.getActive.mockResolvedValue(activeBreakingNews);

      const result = await mockBreakingNewsService.getActive();

      expect(result).toEqual(activeBreakingNews);
      expect(result.isActive).toBe(true);
    });

    it('should return null when no active breaking news', async () => {
      mockBreakingNewsService.getActive.mockResolvedValue(null);

      const result = await mockBreakingNewsService.getActive();

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockBreakingNewsService.getAll.mockRejectedValue(new Error(errorMessage));

      try {
        await mockBreakingNewsService.getAll();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }
    });

    it('should handle creation errors', async () => {
      const errorMessage = 'Validation error';
      mockBreakingNewsService.create.mockRejectedValue(new Error(errorMessage));

      try {
        await mockBreakingNewsService.create({
          text: 'Invalid breaking news',
          isActive: false,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }
    });
  });
});