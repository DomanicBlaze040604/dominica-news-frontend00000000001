/**
 * SEO Optimization Tests - Simplified
 * Tests for schema markup, meta tags, and keyword optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaMarkupService } from '../services/schemaMarkup';
import { MetaTagsService } from '../services/metaTags';
import { KeywordOptimizationService } from '../services/keywordOptimization';
import { Article } from '../types/api';

// Mock environment variables
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_URL: 'https://dominicanews.com/api'
    }
  }
});

// Mock article data
const mockArticle: Article = {
  id: '1',
  title: 'Breaking News: Hurricane Season Update for Dominica',
  slug: 'hurricane-season-update-dominica',
  content: 'This is a comprehensive article about hurricane season preparations in Dominica.',
  excerpt: 'Latest hurricane season update for Dominica with safety preparations.',
  featuredImage: '/images/hurricane-dominica.jpg',
  featuredImageAlt: 'Hurricane approaching Dominica coastline',
  gallery: ['/images/hurricane-1.jpg'],
  author: {
    id: '1',
    name: 'Dominica News Weather Desk',
    slug: 'dominica-news-weather-desk',
    email: 'weather@dominicanews.com',
    role: 'Weather Desk',
    isActive: true,
    joinDate: '2023-01-01T00:00:00Z',
    articlesCount: 150,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  category: {
    id: '1',
    name: 'Weather',
    slug: 'weather',
    description: 'Weather news and updates',
    displayOrder: 1,
    createdAt: '2023-01-01T00:00:00Z'
  },
  status: 'published' as const,
  publishedAt: '2024-11-01T10:00:00Z',
  isPinned: false,
  isBreaking: false,
  tags: ['hurricane', 'weather', 'dominica'],
  location: 'Roseau, Dominica',
  language: 'en',
  readingTime: 5,
  seoTitle: 'Hurricane Season Update Dominica',
  seoDescription: 'Get the latest hurricane season update for Dominica.',
  createdAt: '2024-11-01T10:00:00Z',
  updatedAt: '2024-11-01T10:00:00Z'
};

describe('SEO Optimization Tests', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  describe('Schema Markup Generation', () => {
    it('should generate valid NewsArticle schema markup', () => {
      const schema = SchemaMarkupService.generateNewsArticleSchema(mockArticle);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('NewsArticle');
      expect(schema.headline).toBe(mockArticle.title);
      expect(schema.author.name).toBe(mockArticle.author.name);
      expect(schema.publisher.name).toBe('Dominica News');
      expect(schema.articleSection).toBe(mockArticle.category.name);
    });

    it('should include proper image URLs in schema', () => {
      const schema = SchemaMarkupService.generateNewsArticleSchema(mockArticle);

      expect(schema.image).toBeDefined();
      expect(Array.isArray(schema.image)).toBe(true);
      expect(schema.image.length).toBeGreaterThan(0);
    });

    it('should generate Organization schema markup', () => {
      const schema = SchemaMarkupService.generateOrganizationSchema();

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('NewsMediaOrganization');
      expect(schema.name).toBe('Dominica News');
    });

    it('should generate Website schema markup', () => {
      const schema = SchemaMarkupService.generateWebsiteSchema();

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Dominica News');
    });

    it('should generate Breadcrumb schema markup', () => {
      const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Weather', url: '/category/weather' }
      ];

      const schema = SchemaMarkupService.generateBreadcrumbSchema(breadcrumbItems);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
    });
  });

  describe('Meta Tags Generation', () => {
    it('should generate article meta tags with proper SEO optimization', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);

      expect(metaTags.title).toBeDefined();
      expect(metaTags.title.length).toBeLessThanOrEqual(60);
      expect(metaTags.description).toBeDefined();
      expect(metaTags.description.length).toBeLessThanOrEqual(160);
      expect(metaTags.keywords).toContain('Dominica News');
    });

    it('should generate Open Graph tags for social media', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);

      expect(metaTags.ogTitle).toBeDefined();
      expect(metaTags.ogDescription).toBeDefined();
      expect(metaTags.ogType).toBe('article');
      expect(metaTags.ogSiteName).toBe('Dominica News');
    });

    it('should generate homepage meta tags with Dominica-specific keywords', () => {
      const metaTags = MetaTagsService.generateHomepageMetaTags();

      expect(metaTags.title).toContain('Dominica News');
      expect(metaTags.keywords).toContain('Dominica News');
      expect(metaTags.keywords).toContain('Dominica Breaking News');
      expect(metaTags.keywords).toContain('Caribbean News');
    });
  });

  describe('Keyword Optimization', () => {
    it('should generate optimized content for articles', () => {
      const optimizedContent = KeywordOptimizationService.generateOptimizedContent(
        mockArticle,
        'weather'
      );

      expect(optimizedContent.title).toBeDefined();
      expect(optimizedContent.description).toBeDefined();
      expect(optimizedContent.keywords).toBeDefined();
      expect(optimizedContent.keywords.length).toBeGreaterThan(0);
    });

    it('should analyze keyword density', () => {
      const analysis = KeywordOptimizationService.analyzeKeywordDensity(
        mockArticle.content,
        ['dominica', 'hurricane', 'weather']
      );

      expect(Array.isArray(analysis)).toBe(true);
      expect(analysis.length).toBeGreaterThan(0);
      expect(analysis[0]).toHaveProperty('keyword');
      expect(analysis[0]).toHaveProperty('count');
      expect(analysis[0]).toHaveProperty('density');
    });

    it('should optimize titles for SEO', () => {
      const optimizedTitle = KeywordOptimizationService.optimizeTitle(
        'Hurricane Season Update',
        'Weather',
        false
      );

      expect(typeof optimizedTitle).toBe('string');
      expect(optimizedTitle.length).toBeLessThanOrEqual(60);
      expect(optimizedTitle).toContain('Hurricane Season Update');
    });

    it('should provide SEO recommendations', () => {
      const recommendations = KeywordOptimizationService.getSEORecommendations(
        mockArticle,
        'weather'
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.title).toBeDefined();
      expect(recommendations.description).toBeDefined();
      expect(recommendations.keywords).toBeDefined();
      expect(recommendations.content).toBeDefined();
    });
  });

  describe('SEO Validation', () => {
    it('should validate schema markup against Google guidelines', () => {
      const schema = SchemaMarkupService.generateNewsArticleSchema(mockArticle);
      
      // Required properties for NewsArticle
      expect(schema.headline).toBeDefined();
      expect(schema.image).toBeDefined();
      expect(schema.datePublished).toBeDefined();
      expect(schema.author).toBeDefined();
      expect(schema.publisher).toBeDefined();
      
      // Validate author structure
      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBeDefined();
      
      // Validate publisher structure
      expect(schema.publisher['@type']).toBe('Organization');
    });

    it('should ensure meta tags comply with length limits', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);
      
      expect(metaTags.title.length).toBeLessThanOrEqual(60);
      expect(metaTags.description.length).toBeLessThanOrEqual(160);
      expect(metaTags.ogTitle.length).toBeLessThanOrEqual(95);
      expect(metaTags.twitterTitle.length).toBeLessThanOrEqual(70);
    });

    it('should validate keyword targeting includes required Dominica terms', () => {
      const metaTags = MetaTagsService.generateHomepageMetaTags();
      
      const requiredKeywords = [
        'Dominica News',
        'Caribbean News',
        'Dominica Politics'
      ];
      
      requiredKeywords.forEach(keyword => {
        expect(metaTags.keywords).toContain(keyword);
      });
    });
  });
});