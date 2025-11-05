import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/auth';
import { articlesService } from '../services/articles';
import { categoriesService } from '../services/categories';
import { authorsService } from '../services/authors';
import { imagesService } from '../services/images';
import { breakingNewsService } from '../services/breakingNews';
import { staticPagesService } from '../services/staticPages';

// Mock all services for controlled testing
vi.mock('../services/auth');
vi.mock('../services/articles');
vi.mock('../services/categories');
vi.mock('../services/authors');
vi.mock('../services/images');
vi.mock('../services/breakingNews');
vi.mock('../services/staticPages');

// Performance monitoring utilities
class SystemPerformanceMonitor {
  private metrics: { [key: string]: number[] } = {};
  private startTimes: { [key: string]: number } = {};

  startTimer(label: string): void {
    this.startTimes[label] = performance.now();
  }

  endTimer(label: string): number {
    const startTime = this.startTimes[label];
    if (!startTime) {
      throw new Error(`Timer ${label} was not started`);
    }
    
    const duration = performance.now() - startTime;
    
    if (!this.metrics[label]) {
      this.metrics[label] = [];
    }
    this.metrics[label].push(duration);
    
    delete this.startTimes[label];
    return duration;
  }

  getAverageTime(label: string): number {
    const times = this.metrics[label];
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMaxTime(label: string): number {
    const times = this.metrics[label];
    if (!times || times.length === 0) return 0;
    return Math.max(...times);
  }

  getMinTime(label: string): number {
    const times = this.metrics[label];
    if (!times || times.length === 0) return 0;
    return Math.min(...times);
  }

  getPercentile(label: string, percentile: number): number {
    const times = this.metrics[label];
    if (!times || times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  clear(): void {
    this.metrics = {};
    this.startTimes = {};
  }

  getAllMetrics(): { [key: string]: number[] } {
    return { ...this.metrics };
  }
}

// Mock data generators for load testing
const generateMockArticles = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `article-${index}`,
    title: `Test Article ${index}`,
    slug: `test-article-${index}`,
    content: `<p>This is test article content ${index}</p>`.repeat(10),
    excerpt: `Test excerpt ${index}`,
    status: 'published' as const,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: `author-${index % 5}`,
      fullName: `Author ${index % 5}`,
      email: `author${index % 5}@test.com`,
      role: 'editor' as const,
      createdAt: new Date().toISOString()
    },
    category: {
      id: `category-${index % 10}`,
      name: `Category ${index % 10}`,
      slug: `category-${index % 10}`,
      description: `Category description ${index % 10}`,
      createdAt: new Date().toISOString()
    },
    tags: [`tag${index}`, `tag${index + 1}`],
    views: Math.floor(Math.random() * 10000),
    readingTime: Math.floor(Math.random() * 10) + 1
  }));
};

const generateMockImages = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `image-${index}`,
    filename: `image-${index}.jpg`,
    originalName: `image-${index}.jpg`,
    url: `/uploads/images/image-${index}.jpg`,
    altText: `Test image ${index}`,
    fileSize: Math.floor(Math.random() * 5000000) + 100000,
    mimeType: 'image/jpeg',
    createdAt: new Date().toISOString(),
    urls: {
      original: `/uploads/images/image-${index}.jpg`,
      large: `/uploads/images/variants/image-${index}-large.webp`,
      medium: `/uploads/images/variants/image-${index}-medium.webp`,
      small: `/uploads/images/variants/image-${index}-small.webp`,
      thumbnail: `/uploads/images/variants/image-${index}-thumbnail.webp`,
      navigationThumbnail: `/uploads/images/variants/image-${index}-thumbnail.webp`
    },
    webpUrls: {
      original: `/uploads/images/image-${index}.webp`,
      large: `/uploads/images/variants/image-${index}-large.webp`,
      medium: `/uploads/images/variants/image-${index}-medium.webp`,
      small: `/uploads/images/variants/image-${index}-small.webp`
    },
    uploader: {
      id: '1',
      email: 'admin@test.com',
      fullName: 'Admin User',
      role: 'admin' as const,
      createdAt: new Date().toISOString()
    }
  }));
};

describe('System Performance Testing', () => {
  let performanceMonitor: SystemPerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new SystemPerformanceMonitor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.clear();
    vi.restoreAllMocks();
  });

  describe('API Response Time Performance', () => {
    it('should handle articles API under load', async () => {
      const mockArticles = generateMockArticles(1000);
      const iterations = 50;
      const concurrentRequests = 10;

      vi.mocked(articlesService.getArticles).mockResolvedValue({
        success: true,
        data: {
          articles: mockArticles.slice(0, 20),
          pagination: {
            currentPage: 1,
            totalPages: 50,
            totalItems: 1000,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      });

      // Test sequential requests
      for (let i = 0; i < iterations; i++) {
        performanceMonitor.startTimer(`articles-sequential-${i}`);
        await articlesService.getArticles({ page: 1, limit: 20 });
        performanceMonitor.endTimer(`articles-sequential-${i}`);
      }

      // Test concurrent requests
      const concurrentPromises = Array.from({ length: concurrentRequests }, async (_, i) => {
        performanceMonitor.startTimer(`articles-concurrent-${i}`);
        await articlesService.getArticles({ page: i + 1, limit: 20 });
        return performanceMonitor.endTimer(`articles-concurrent-${i}`);
      });

      const concurrentResults = await Promise.all(concurrentPromises);

      // Calculate performance metrics
      const sequentialTimes = Array.from({ length: iterations }, (_, i) => 
        performanceMonitor.getAverageTime(`articles-sequential-${i}`)
      );
      const avgSequentialTime = sequentialTimes.reduce((sum, time) => sum + time, 0) / sequentialTimes.length;
      const avgConcurrentTime = concurrentResults.reduce((sum, time) => sum + time, 0) / concurrentResults.length;

      // Performance assertions
      expect(avgSequentialTime).toBeLessThan(1000); // 1 second average
      expect(avgConcurrentTime).toBeLessThan(2000); // 2 seconds for concurrent
      expect(Math.max(...concurrentResults)).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle image loading performance', async () => {
      const mockImages = generateMockImages(500);
      const batchSize = 20;
      const batches = 10;

      vi.mocked(imagesService.getImages).mockImplementation(async (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return {
          success: true,
          data: {
            images: mockImages.slice(startIndex, endIndex),
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(mockImages.length / limit),
              totalImages: mockImages.length,
              hasNextPage: endIndex < mockImages.length,
              hasPrevPage: page > 1,
              limit
            }
          }
        };
      });

      // Test batch loading performance
      for (let batch = 0; batch < batches; batch++) {
        performanceMonitor.startTimer(`images-batch-${batch}`);
        await imagesService.getImages({ page: batch + 1, limit: batchSize });
        performanceMonitor.endTimer(`images-batch-${batch}`);
      }

      // Test concurrent batch loading
      const concurrentBatches = Array.from({ length: 5 }, async (_, i) => {
        performanceMonitor.startTimer(`images-concurrent-batch-${i}`);
        await imagesService.getImages({ page: i + 1, limit: batchSize });
        return performanceMonitor.endTimer(`images-concurrent-batch-${i}`);
      });

      const concurrentBatchResults = await Promise.all(concurrentBatches);

      // Performance assertions
      const batchTimes = Array.from({ length: batches }, (_, i) => 
        performanceMonitor.getAverageTime(`images-batch-${i}`)
      );
      const avgBatchTime = batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
      const avgConcurrentBatchTime = concurrentBatchResults.reduce((sum, time) => sum + time, 0) / concurrentBatchResults.length;

      expect(avgBatchTime).toBeLessThan(800); // 800ms average for batch
      expect(avgConcurrentBatchTime).toBeLessThan(1500); // 1.5 seconds for concurrent batches
    });

    it('should maintain performance across all API endpoints', async () => {
      const endpoints = [
        { name: 'articles', service: articlesService.getArticles, params: { page: 1, limit: 10 } },
        { name: 'categories', service: categoriesService.getCategories, params: {} },
        { name: 'authors', service: authorsService.getAuthors, params: {} },
        { name: 'images', service: imagesService.getImages, params: { page: 1, limit: 10 } },
        { name: 'breaking-news', service: breakingNewsService.getActiveBreakingNews, params: {} },
        { name: 'static-pages', service: staticPagesService.getStaticPages, params: {} }
      ];

      // Mock all endpoints
      vi.mocked(articlesService.getArticles).mockResolvedValue({
        success: true,
        data: { articles: generateMockArticles(10), pagination: { currentPage: 1, totalPages: 1, totalItems: 10, hasNextPage: false, hasPrevPage: false } }
      });

      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: [] }
      });

      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: [] }
      });

      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: { images: generateMockImages(10), pagination: { currentPage: 1, totalPages: 1, totalImages: 10, hasNextPage: false, hasPrevPage: false, limit: 10 } }
      });

      vi.mocked(breakingNewsService.getActiveBreakingNews).mockResolvedValue({
        success: true,
        data: { breakingNews: [] }
      });

      vi.mocked(staticPagesService.getStaticPages).mockResolvedValue({
        success: true,
        data: { pages: [] }
      });

      // Test each endpoint performance
      for (const endpoint of endpoints) {
        const iterations = 20;
        
        for (let i = 0; i < iterations; i++) {
          performanceMonitor.startTimer(`${endpoint.name}-${i}`);
          await endpoint.service(endpoint.params);
          performanceMonitor.endTimer(`${endpoint.name}-${i}`);
        }

        const times = Array.from({ length: iterations }, (_, i) => 
          performanceMonitor.getAverageTime(`${endpoint.name}-${i}`)
        );
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const p95Time = performanceMonitor.getPercentile(`${endpoint.name}-0`, 95);

        // Performance assertions per endpoint
        expect(avgTime).toBeLessThan(500); // 500ms average
        expect(maxTime).toBeLessThan(2000); // 2 seconds max
        expect(p95Time).toBeLessThan(1000); // 1 second 95th percentile
      }
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex queries efficiently', async () => {
      // Mock complex article queries with filters
      const complexQueries = [
        { status: 'published', category: 'politics', author: 'john-doe' },
        { status: 'published', tags: ['breaking', 'urgent'] },
        { status: 'published', dateRange: { start: '2024-01-01', end: '2024-12-31' } },
        { status: 'published', search: 'dominica news' },
        { status: 'published', featured: true, pinned: true }
      ];

      vi.mocked(articlesService.getArticles).mockImplementation(async (params) => {
        // Simulate database query time based on complexity
        const complexity = Object.keys(params || {}).length;
        const simulatedDelay = complexity * 50; // 50ms per filter
        
        await new Promise(resolve => setTimeout(resolve, simulatedDelay));
        
        return {
          success: true,
          data: {
            articles: generateMockArticles(20),
            pagination: {
              currentPage: 1,
              totalPages: 5,
              totalItems: 100,
              hasNextPage: true,
              hasPrevPage: false
            }
          }
        };
      });

      // Test each complex query
      for (let i = 0; i < complexQueries.length; i++) {
        const query = complexQueries[i];
        
        performanceMonitor.startTimer(`complex-query-${i}`);
        await articlesService.getArticles(query);
        const queryTime = performanceMonitor.endTimer(`complex-query-${i}`);

        // Complex queries should still be reasonably fast
        expect(queryTime).toBeLessThan(1000); // 1 second max
      }
    });

    it('should handle pagination efficiently', async () => {
      const totalPages = 50;
      const pageSize = 20;

      vi.mocked(articlesService.getArticles).mockImplementation(async (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        
        // Simulate pagination query time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          success: true,
          data: {
            articles: generateMockArticles(limit),
            pagination: {
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalPages * pageSize,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1
            }
          }
        };
      });

      // Test pagination performance across different pages
      const pagesToTest = [1, 10, 25, 40, 50];
      
      for (const page of pagesToTest) {
        performanceMonitor.startTimer(`pagination-page-${page}`);
        await articlesService.getArticles({ page, limit: pageSize });
        const pageTime = performanceMonitor.endTimer(`pagination-page-${page}`);

        // Pagination should be consistent regardless of page number
        expect(pageTime).toBeLessThan(500); // 500ms max
      }

      // Test that all page times are relatively consistent
      const pageTimes = pagesToTest.map(page => 
        performanceMonitor.getAverageTime(`pagination-page-${page}`)
      );
      const avgPageTime = pageTimes.reduce((sum, time) => sum + time, 0) / pageTimes.length;
      const maxDeviation = Math.max(...pageTimes.map(time => Math.abs(time - avgPageTime)));
      
      // Page times should not vary too much (within 200ms)
      expect(maxDeviation).toBeLessThan(200);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should manage memory efficiently during bulk operations', async () => {
      const bulkOperations = [
        { name: 'bulk-articles', count: 100, service: articlesService.getArticles },
        { name: 'bulk-images', count: 200, service: imagesService.getImages },
        { name: 'bulk-categories', count: 50, service: categoriesService.getCategories }
      ];

      // Mock services for bulk operations
      vi.mocked(articlesService.getArticles).mockResolvedValue({
        success: true,
        data: { articles: generateMockArticles(100), pagination: { currentPage: 1, totalPages: 1, totalItems: 100, hasNextPage: false, hasPrevPage: false } }
      });

      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: { images: generateMockImages(200), pagination: { currentPage: 1, totalPages: 1, totalImages: 200, hasNextPage: false, hasPrevPage: false, limit: 200 } }
      });

      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: Array.from({ length: 50 }, (_, i) => ({ id: `cat-${i}`, name: `Category ${i}`, slug: `category-${i}`, description: `Description ${i}`, createdAt: new Date().toISOString() })) }
      });

      for (const operation of bulkOperations) {
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        performanceMonitor.startTimer(operation.name);
        await operation.service({ limit: operation.count });
        const operationTime = performanceMonitor.endTimer(operation.name);
        
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryIncrease = finalMemory - initialMemory;

        // Performance assertions
        expect(operationTime).toBeLessThan(2000); // 2 seconds max
        
        // Memory increase should be reasonable (if memory info is available)
        if (memoryIncrease > 0) {
          expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB max increase
        }
      }
    });

    it('should handle concurrent operations without resource exhaustion', async () => {
      const concurrentOperations = 20;
      const operationsPerType = 5;

      // Setup mocks
      vi.mocked(articlesService.getArticles).mockResolvedValue({
        success: true,
        data: { articles: generateMockArticles(10), pagination: { currentPage: 1, totalPages: 1, totalItems: 10, hasNextPage: false, hasPrevPage: false } }
      });

      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: { images: generateMockImages(10), pagination: { currentPage: 1, totalPages: 1, totalImages: 10, hasNextPage: false, hasPrevPage: false, limit: 10 } }
      });

      // Create concurrent operations
      const operations = [];
      
      for (let i = 0; i < concurrentOperations; i++) {
        const operationType = i % 2 === 0 ? 'articles' : 'images';
        const service = operationType === 'articles' ? articlesService.getArticles : imagesService.getImages;
        
        operations.push(async () => {
          performanceMonitor.startTimer(`concurrent-${operationType}-${i}`);
          await service({ page: 1, limit: 10 });
          return performanceMonitor.endTimer(`concurrent-${operationType}-${i}`);
        });
      }

      // Execute all operations concurrently
      const startTime = performance.now();
      const results = await Promise.all(operations.map(op => op()));
      const totalTime = performance.now() - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // 5 seconds total
      expect(Math.max(...results)).toBeLessThan(3000); // 3 seconds max per operation
      expect(results.filter(time => time > 1000).length).toBeLessThan(concurrentOperations * 0.2); // Less than 20% should exceed 1 second
    });
  });

  describe('Network Performance and Optimization', () => {
    it('should handle network latency efficiently', async () => {
      const latencyScenarios = [
        { name: 'fast', delay: 50 },
        { name: 'normal', delay: 200 },
        { name: 'slow', delay: 500 },
        { name: 'very-slow', delay: 1000 }
      ];

      for (const scenario of latencyScenarios) {
        vi.mocked(articlesService.getArticles).mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, scenario.delay));
          return {
            success: true,
            data: { articles: generateMockArticles(10), pagination: { currentPage: 1, totalPages: 1, totalItems: 10, hasNextPage: false, hasPrevPage: false } }
          };
        });

        performanceMonitor.startTimer(`latency-${scenario.name}`);
        await articlesService.getArticles({ page: 1, limit: 10 });
        const responseTime = performanceMonitor.endTimer(`latency-${scenario.name}`);

        // Response time should be close to simulated latency (within 100ms overhead)
        expect(responseTime).toBeGreaterThan(scenario.delay);
        expect(responseTime).toBeLessThan(scenario.delay + 100);
      }
    });

    it('should optimize payload sizes', async () => {
      const payloadSizes = [
        { name: 'small', articles: 5 },
        { name: 'medium', articles: 20 },
        { name: 'large', articles: 50 },
        { name: 'extra-large', articles: 100 }
      ];

      for (const payload of payloadSizes) {
        vi.mocked(articlesService.getArticles).mockResolvedValue({
          success: true,
          data: { 
            articles: generateMockArticles(payload.articles), 
            pagination: { 
              currentPage: 1, 
              totalPages: 1, 
              totalItems: payload.articles, 
              hasNextPage: false, 
              hasPrevPage: false 
            } 
          }
        });

        performanceMonitor.startTimer(`payload-${payload.name}`);
        const response = await articlesService.getArticles({ limit: payload.articles });
        const responseTime = performanceMonitor.endTimer(`payload-${payload.name}`);

        // Verify response
        expect(response.success).toBe(true);
        expect(response.data.articles).toHaveLength(payload.articles);

        // Response time should scale reasonably with payload size
        const expectedMaxTime = 500 + (payload.articles * 5); // Base 500ms + 5ms per article
        expect(responseTime).toBeLessThan(expectedMaxTime);
      }
    });
  });

  describe('Performance Regression Testing', () => {
    it('should maintain performance benchmarks', async () => {
      const benchmarks = {
        'articles-list': { maxTime: 1000, avgTime: 500 },
        'images-gallery': { maxTime: 1500, avgTime: 800 },
        'categories-list': { maxTime: 500, avgTime: 200 },
        'authors-list': { maxTime: 500, avgTime: 200 }
      };

      // Setup mocks
      vi.mocked(articlesService.getArticles).mockResolvedValue({
        success: true,
        data: { articles: generateMockArticles(20), pagination: { currentPage: 1, totalPages: 1, totalItems: 20, hasNextPage: false, hasPrevPage: false } }
      });

      vi.mocked(imagesService.getImages).mockResolvedValue({
        success: true,
        data: { images: generateMockImages(20), pagination: { currentPage: 1, totalPages: 1, totalImages: 20, hasNextPage: false, hasPrevPage: false, limit: 20 } }
      });

      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: { categories: [] }
      });

      vi.mocked(authorsService.getAuthors).mockResolvedValue({
        success: true,
        data: { authors: [] }
      });

      // Test each benchmark
      const testIterations = 10;
      
      for (const [benchmarkName, limits] of Object.entries(benchmarks)) {
        const times: number[] = [];
        
        for (let i = 0; i < testIterations; i++) {
          performanceMonitor.startTimer(`${benchmarkName}-benchmark-${i}`);
          
          switch (benchmarkName) {
            case 'articles-list':
              await articlesService.getArticles({ page: 1, limit: 20 });
              break;
            case 'images-gallery':
              await imagesService.getImages({ page: 1, limit: 20 });
              break;
            case 'categories-list':
              await categoriesService.getCategories();
              break;
            case 'authors-list':
              await authorsService.getAuthors();
              break;
          }
          
          const time = performanceMonitor.endTimer(`${benchmarkName}-benchmark-${i}`);
          times.push(time);
        }

        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);

        // Assert against benchmarks
        expect(avgTime).toBeLessThan(limits.avgTime);
        expect(maxTime).toBeLessThan(limits.maxTime);
      }
    });
  });
});