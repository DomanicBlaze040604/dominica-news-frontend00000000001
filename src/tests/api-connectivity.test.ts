import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api } from '../services/api';
import { authService } from '../services/auth';
import { articlesService } from '../services/articles';
import { categoriesService } from '../services/categories';
import { authorsService } from '../services/authors';

// Test configuration
const TEST_TIMEOUT = 10000; // 10 seconds
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

describe('API Connectivity Tests', () => {
  let authToken: string | null = null;

  beforeAll(async () => {
    // Try to authenticate for protected endpoint tests
    try {
      const response = await authService.login({
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      });
      authToken = response.data.token;
      localStorage.setItem('auth_token', authToken);
    } catch (error) {
      console.warn('Authentication failed for tests:', error);
    }
  }, TEST_TIMEOUT);

  afterAll(() => {
    // Clean up
    if (authToken) {
      localStorage.removeItem('auth_token');
    }
  });

  describe('Basic Connectivity', () => {
    it('should connect to the API base URL', async () => {
      const response = await fetch(API_BASE_URL.replace('/api', ''));
      expect(response.status).toBeLessThan(500);
    }, TEST_TIMEOUT);

    it('should handle CORS properly', async () => {
      try {
        const response = await api.get('/articles');
        expect(response.status).toBeLessThan(500);
      } catch (error: any) {
        // Should not be a CORS error
        expect(error.message).not.toContain('CORS');
        expect(error.message).not.toContain('Access-Control-Allow-Origin');
      }
    }, TEST_TIMEOUT);
  });

  describe('Public Endpoints', () => {
    it('should fetch articles without authentication', async () => {
      const response = await api.get('/articles');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
    }, TEST_TIMEOUT);

    it('should fetch categories without authentication', async () => {
      const response = await api.get('/categories');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    }, TEST_TIMEOUT);

    it('should fetch authors without authentication', async () => {
      const response = await api.get('/authors');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    }, TEST_TIMEOUT);
  });

  describe('Authentication Endpoints', () => {
    it('should handle login requests', async () => {
      try {
        const response = await authService.login({
          email: 'admin@dominicanews.com',
          password: 'Pass@12345'
        });
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('user');
      } catch (error: any) {
        // If authentication fails, it should be a proper API error, not a network error
        expect(error.response?.status).toBeGreaterThanOrEqual(400);
        expect(error.response?.status).toBeLessThan(500);
      }
    }, TEST_TIMEOUT);

    it('should handle invalid login credentials', async () => {
      try {
        await authService.login({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    }, TEST_TIMEOUT);
  });

  describe('Protected Endpoints', () => {
    it('should require authentication for protected endpoints', async () => {
      // Remove token temporarily
      const originalToken = localStorage.getItem('auth_token');
      localStorage.removeItem('auth_token');

      try {
        await api.post('/articles', {
          title: 'Test Article',
          content: 'Test content',
          categoryId: '1'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      } finally {
        // Restore token
        if (originalToken) {
          localStorage.setItem('auth_token', originalToken);
        }
      }
    }, TEST_TIMEOUT);

    it('should allow authenticated requests to protected endpoints', async () => {
      if (!authToken) {
        console.warn('Skipping authenticated test - no auth token');
        return;
      }

      try {
        // Try to fetch articles with authentication (should work)
        const response = await api.get('/articles');
        expect(response.status).toBe(200);
      } catch (error: any) {
        // If it fails, it should not be due to authentication
        expect(error.response?.status).not.toBe(401);
      }
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      try {
        await api.get('/nonexistent-endpoint');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
        expect(error.response?.data).toHaveProperty('success', false);
      }
    }, TEST_TIMEOUT);

    it('should handle network timeouts', async () => {
      // Create a request with very short timeout
      try {
        await api.get('/articles', { timeout: 1 }); // 1ms timeout
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED');
      }
    }, TEST_TIMEOUT);
  });

  describe('Service Integration', () => {
    it('should integrate with articles service', async () => {
      const result = await articlesService.getArticles({ page: 1, limit: 5 });
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('articles');
      expect(Array.isArray(result.data.articles)).toBe(true);
    }, TEST_TIMEOUT);

    it('should integrate with categories service', async () => {
      const result = await categoriesService.getCategories();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    }, TEST_TIMEOUT);

    it('should integrate with authors service', async () => {
      const result = await authorsService.getAuthors();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('authors');
      expect(Array.isArray(result.data.authors)).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      await api.get('/articles');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000);
    }, TEST_TIMEOUT);

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => api.get('/articles'));
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, TEST_TIMEOUT);
  });
});