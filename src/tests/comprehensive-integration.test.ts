import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { authService } from '../services/auth';
import { categoriesService } from '../services/categories';
import { articlesService } from '../services/articles';
import { authorsService } from '../services/authors';
import { staticPagesService } from '../services/staticPages';
import { breakingNewsService } from '../services/breakingNews';
import { api } from '../services/api';

describe('Comprehensive Integration Testing', () => {
  let authToken: string | null = null;
  let testData: {
    categoryId?: string;
    authorId?: string;
    articleId?: string;
    staticPageId?: string;
    breakingNewsId?: string;
  } = {};

  beforeAll(async () => {
    // Test authentication
    try {
      const response = await authService.login({
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      });
      authToken = response.data.token;
      localStorage.setItem('auth_token', authToken);
    } catch (error) {
      console.warn('Authentication failed for integration tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up all test data
    if (authToken) {
      try {
        if (testData.breakingNewsId) {
          await breakingNewsService.deleteBreakingNews(testData.breakingNewsId);
        }
        if (testData.articleId) {
          await articlesService.deleteArticle(testData.articleId);
        }
        if (testData.staticPageId) {
          await staticPagesService.deleteStaticPage(testData.staticPageId);
        }
        if (testData.authorId) {
          await authorsService.deleteAuthor(testData.authorId);
        }
        if (testData.categoryId) {
          await categoriesService.deleteCategory(testData.categoryId);
        }
      } catch (error) {
        console.warn('Failed to clean up test data:', error);
      }
      localStorage.removeItem('auth_token');
    }
  });

  describe('Authentication and Authorization Workflows', () => {
    it('should authenticate admin user successfully', async () => {
      const response = await authService.login({
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      });

      expect(response.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      try {
        await authService.login({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should validate JWT token', async () => {
      if (!authToken) return;

      const response = await authService.getCurrentUser();
      expect(response.success).toBe(true);
      expect(response.data.user).toBeDefined();
    });

    it('should handle token expiration', async () => {
      // Set an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('auth_token', expiredToken);

      try {
        await authService.getCurrentUser();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      } finally {
        // Restore valid token
        if (authToken) {
          localStorage.setItem('auth_token', authToken);
        }
      }
    });
  });

  describe('Frontend-Backend Communication', () => {
    it('should handle API request/response cycle for all endpoints', async () => {
      if (!authToken) return;

      // Test Categories API
      const categoriesResponse = await categoriesService.getCategories();
      expect(categoriesResponse.success).toBe(true);
      expect(Array.isArray(categoriesResponse.data)).toBe(true);

      // Test Articles API
      const articlesResponse = await articlesService.getArticles({ page: 1, limit: 10 });
      expect(articlesResponse.success).toBe(true);
      expect(articlesResponse.data).toHaveProperty('articles');

      // Test Authors API
      const authorsResponse = await authorsService.getAuthors();
      expect(authorsResponse.success).toBe(true);
      expect(Array.isArray(authorsResponse.data)).toBe(true);

      // Test Static Pages API
      const staticPagesResponse = await staticPagesService.getStaticPages();
      expect(staticPagesResponse.success).toBe(true);
      expect(Array.isArray(staticPagesResponse.data)).toBe(true);

      // Test Breaking News API
      const breakingNewsResponse = await breakingNewsService.getActiveBreakingNews();
      expect(breakingNewsResponse.success).toBe(true);
    });

    it('should handle CORS properly', async () => {
      // Test that cross-origin requests work
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
      expect(response.ok).toBe(true);
      
      // Check CORS headers
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).toBeDefined();
    });

    it('should handle request timeouts', async () => {
      // Mock a slow endpoint
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100); // Very short timeout

      try {
        await fetch(`${import.meta.env.VITE_API_URL}/articles`, {
          signal: controller.signal
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
      }
    });
  });

  describe('Real-time Data Synchronization', () => {
    it('should sync category data across operations', async () => {
      if (!authToken) return;

      // Create category
      const createResponse = await categoriesService.createCategory({
        name: 'Integration Test Category',
        slug: 'integration-test-category',
        description: 'Test category for integration'
      });
      expect(createResponse.success).toBe(true);
      testData.categoryId = createResponse.data.category.id;

      // Verify it appears in list immediately
      const listResponse = await categoriesService.getAdminCategories();
      const createdCategory = listResponse.data.find(cat => cat.id === testData.categoryId);
      expect(createdCategory).toBeDefined();
      expect(createdCategory?.name).toBe('Integration Test Category');

      // Update category
      const updateResponse = await categoriesService.updateCategory(testData.categoryId, {
        name: 'Updated Integration Category',
        description: 'Updated description'
      });
      expect(updateResponse.success).toBe(true);

      // Verify update is reflected immediately
      const updatedListResponse = await categoriesService.getAdminCategories();
      const updatedCategory = updatedListResponse.data.find(cat => cat.id === testData.categoryId);
      expect(updatedCategory?.name).toBe('Updated Integration Category');
    });

    it('should sync author data across operations', async () => {
      if (!authToken) return;

      // Create author
      const createResponse = await authorsService.createAuthor({
        name: 'Integration Test Author',
        email: 'integration@test.com',
        bio: 'Test author for integration testing'
      });
      expect(createResponse.success).toBe(true);
      testData.authorId = createResponse.data.author.id;

      // Verify sync
      const listResponse = await authorsService.getAdminAuthors();
      const createdAuthor = listResponse.data.find(author => author.id === testData.authorId);
      expect(createdAuthor).toBeDefined();
      expect(createdAuthor?.name).toBe('Integration Test Author');
    });

    it('should sync article data with relationships', async () => {
      if (!authToken || !testData.categoryId || !testData.authorId) return;

      // Create article with relationships
      const createResponse = await articlesService.createArticle({
        title: 'Integration Test Article',
        content: '<p>Test article content for integration testing</p>',
        excerpt: 'Test excerpt',
        categoryId: testData.categoryId,
        authorId: testData.authorId,
        status: 'published'
      });
      expect(createResponse.success).toBe(true);
      testData.articleId = createResponse.data.article.id;

      // Verify relationships are maintained
      const articleResponse = await articlesService.getArticle(testData.articleId);
      expect(articleResponse.success).toBe(true);
      expect(articleResponse.data.category.id).toBe(testData.categoryId);
      expect(articleResponse.data.author.id).toBe(testData.authorId);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache after CRUD operations', async () => {
      if (!authToken) return;

      // Get initial data
      const initialResponse = await categoriesService.getCategories();
      const initialCount = initialResponse.data.length;

      // Create new category
      const createResponse = await categoriesService.createCategory({
        name: 'Cache Test Category',
        slug: 'cache-test-category',
        description: 'Test cache invalidation'
      });
      const categoryId = createResponse.data.category.id;

      // Verify cache is invalidated and new data is fetched
      const updatedResponse = await categoriesService.getCategories();
      expect(updatedResponse.data.length).toBe(initialCount + 1);

      // Clean up
      await categoriesService.deleteCategory(categoryId);
      
      // Verify cache invalidation after delete
      const finalResponse = await categoriesService.getCategories();
      expect(finalResponse.data.length).toBe(initialCount);
    });

    it('should handle concurrent operations without data corruption', async () => {
      if (!authToken) return;

      // Create multiple categories concurrently
      const promises = Array.from({ length: 3 }, (_, i) =>
        categoriesService.createCategory({
          name: `Concurrent Test Category ${i + 1}`,
          slug: `concurrent-test-category-${i + 1}`,
          description: `Test concurrent operations ${i + 1}`
        })
      );

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Clean up
      const cleanupPromises = results.map(result => 
        categoriesService.deleteCategory(result.data.category.id)
      );
      await Promise.all(cleanupPromises);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network interruptions', async () => {
      // Simulate network error by using invalid URL temporarily
      const originalBaseURL = api.defaults.baseURL;
      api.defaults.baseURL = 'http://invalid-url:9999/api';

      try {
        await categoriesService.getCategories();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe('ECONNREFUSED');
      } finally {
        // Restore original URL
        api.defaults.baseURL = originalBaseURL;
      }

      // Verify recovery
      const response = await categoriesService.getCategories();
      expect(response.success).toBe(true);
    });

    it('should handle server errors gracefully', async () => {
      if (!authToken) return;

      // Try to create category with invalid data to trigger server error
      try {
        await categoriesService.createCategory({
          name: '', // Invalid empty name
          slug: '',
          description: ''
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        expect(error.response?.data?.message).toBeDefined();
      }
    });

    it('should maintain data integrity during failures', async () => {
      if (!authToken) return;

      // Get initial state
      const initialResponse = await categoriesService.getAdminCategories();
      const initialCount = initialResponse.data.length;

      // Try to create invalid category
      try {
        await categoriesService.createCategory({
          name: '', // Invalid
          slug: '',
          description: ''
        });
      } catch (error) {
        // Expected to fail
      }

      // Verify no data corruption occurred
      const finalResponse = await categoriesService.getAdminCategories();
      expect(finalResponse.data.length).toBe(initialCount);
    });
  });

  describe('Performance and Load Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = [
        categoriesService.getCategories(),
        articlesService.getArticles({ page: 1, limit: 10 }),
        authorsService.getAuthors(),
        staticPagesService.getStaticPages(),
        breakingNewsService.getActiveBreakingNews()
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (10 seconds)
      expect(duration).toBeLessThan(10000);
    });

    it('should handle pagination correctly', async () => {
      const page1Response = await articlesService.getArticles({ page: 1, limit: 5 });
      expect(page1Response.success).toBe(true);
      expect(page1Response.data.pagination.page).toBe(1);
      expect(page1Response.data.pagination.limit).toBe(5);

      if (page1Response.data.pagination.totalPages > 1) {
        const page2Response = await articlesService.getArticles({ page: 2, limit: 5 });
        expect(page2Response.success).toBe(true);
        expect(page2Response.data.pagination.page).toBe(2);
      }
    });
  });
});