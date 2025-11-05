/**
 * SEO Optimization Tests
 * Tests for schema markup, meta tags, and keyword optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SchemaMarkupService } from '../services/schemaMarkup';
import { MetaTagsService } from '../services/metaTags';
import { KeywordOptimizationService } from '../services/keywordOptimization';
import { EnhancedSEO } from '../components/EnhancedSEO';
import { StructuredData } from '../components/StructuredData';
import { Article } from '../types/api';

// Mock article data
const mockArticle: Article = {
  id: '1',
  title: 'Breaking News: Hurricane Season Update for Dominica',
  slug: 'hurricane-season-update-dominica',
  content: 'This is a comprehensive article about hurricane season preparations in Dominica. The article covers weather patterns, safety measures, and government preparations for the upcoming hurricane season.',
  excerpt: 'Latest hurricane season update for Dominica with safety preparations and weather forecasts.',
  featuredImage: '/images/hurricane-dominica.jpg',
  featuredImageAlt: 'Hurricane approaching Dominica coastline',
  gallery: ['/images/hurricane-1.jpg', '/images/hurricane-2.jpg'],
  author: {
    id: '1',
    name: 'Dominica News Weather Desk',
    slug: 'dominica-news-weather-desk',
    email: 'weather@dominicanews.com',
    biography: 'Professional weather reporting team',
    profileImage: '/images/weather-desk.jpg',
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
    articleCount: 100,
    createdAt: '2023-01-01T00:00:00Z'
  },
  status: 'published' as const,
  publishedAt: '2024-11-01T10:00:00Z',
  isPinned: false,
  isBreaking: false,
  isFeatured: true,
  tags: ['hurricane', 'weather', 'dominica', 'safety'],
  location: 'Roseau, Dominica',
  language: 'en',
  readingTime: 5,
  seoTitle: 'Hurricane Season Update Dominica - Weather Safety News',
  seoDescription: 'Get the latest hurricane season update for Dominica. Weather forecasts, safety preparations, and government response plans.',
  seo: {
    metaTitle: 'Hurricane Season Update Dominica - Weather Safety News',
    metaDescription: 'Get the latest hurricane season update for Dominica. Weather forecasts, safety preparations, and government response plans.',
    keywords: ['hurricane', 'dominica', 'weather', 'safety'],
    canonicalUrl: 'https://dominicanews.com/articles/hurricane-season-update-dominica'
  },
  createdAt: '2024-11-01T10:00:00Z',
  updatedAt: '2024-11-01T10:00:00Z'
};

// Mock environment variables
vi.stubGlobal('process', {
  env: {
    REACT_APP_BASE_URL: 'https://dominicanews.com'
  }
});

describe('SEO Optimization Tests', () => {
  beforeEach(() => {
    // Clear document head before each test
    document.head.innerHTML = '';
    document.title = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.head.innerHTML = '';
    vi.clearAllMocks();
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
      expect(schema.inLanguage).toBe('en');
    });

    it('should include proper image URLs in schema', () => {
      const schema = SchemaMarkupService.generateNewsArticleSchema(mockArticle);

      expect(schema.image).toBeDefined();
      expect(schema.image.length).toBeGreaterThan(0);
      expect(schema.image[0]).toBe('https://dominicanews.com/images/hurricane-dominica.jpg');
    });

    it('should generate Organization schema markup', () => {
      const schema = SchemaMarkupService.generateOrganizationSchema(
        'contact@dominicanews.com',
        '+1-767-123-4567',
        'Roseau, Dominica'
      );

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('NewsMediaOrganization');
      expect(schema.name).toBe('Dominica News');
      expect(schema.contactPoint?.email).toBe('contact@dominicanews.com');
      expect(schema.contactPoint?.telephone).toBe('+1-767-123-4567');
      expect(schema.address?.addressCountry).toBe('DM');
    });

    it('should generate Website schema markup', () => {
      const schema = SchemaMarkupService.generateWebsiteSchema();

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Dominica News');
      expect(schema.url).toBe('https://dominicanews.com');
      expect(schema.potentialAction['@type']).toBe('SearchAction');
    });

    it('should generate Breadcrumb schema markup', () => {
      const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Weather', url: '/category/weather' },
        { name: 'Hurricane Update', url: '/articles/hurricane-season-update-dominica' }
      ];

      const schema = SchemaMarkupService.generateBreadcrumbSchema(breadcrumbItems);

      expect(schema).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
    });

    it('should generate breaking news schema with special properties', () => {
      const breakingArticle = { ...mockArticle, isBreaking: true };
      const schema = SchemaMarkupService.generateBreakingNewsSchema(breakingArticle);

      expect(schema).toBeDefined();
      expect(schema.keywords).toContain('Breaking News');
      expect(schema.keywords).toContain('Urgent');
      expect(schema.keywords).toContain('Alert');
      expect(schema.description).toMatch(/^BREAKING:/);
    });

    it('should inject and remove schema markup from document head', () => {
      const testSchema = { '@context': 'https://schema.org', '@type': 'Test' };
      const schemaId = 'test-schema';

      // Inject schema
      SchemaMarkupService.injectSchemaMarkup(testSchema, schemaId);
      
      const injectedScript = document.querySelector(`script[data-schema-id="${schemaId}"]`);
      expect(injectedScript).toBeTruthy();
      expect(injectedScript?.textContent).toContain('"@type": "Test"');

      // Remove schema
      SchemaMarkupService.removeSchemaMarkup(schemaId);
      
      const removedScript = document.querySelector(`script[data-schema-id="${schemaId}"]`);
      expect(removedScript).toBeFalsy();
    });

    it('should generate comprehensive article page schema', () => {
      const schemas = SchemaMarkupService.generateArticlePageSchema(mockArticle);

      expect(schemas.newsArticle).toBeDefined();
      expect(schemas.breadcrumb).toBeDefined();
      expect(schemas.organization).toBeDefined();
      
      expect(schemas.breadcrumb.itemListElement).toHaveLength(3);
      expect(schemas.breadcrumb.itemListElement[1].name).toBe('Weather');
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
      expect(metaTags.keywords).toContain('Breaking News');
      expect(metaTags.keywords).toContain('Weather');
    });

    it('should generate Open Graph tags for social media', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);

      expect(metaTags.ogTitle).toBeDefined();
      expect(metaTags.ogDescription).toBeDefined();
      expect(metaTags.ogType).toBe('article');
      expect(metaTags.ogUrl).toBe('https://dominicanews.com/articles/hurricane-season-update-dominica');
      expect(metaTags.ogImage).toBe('https://dominicanews.com/images/hurricane-dominica.jpg');
      expect(metaTags.ogSiteName).toBe('Dominica News');
    });

    it('should generate Twitter Card tags', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);

      expect(metaTags.twitterCard).toBe('summary_large_image');
      expect(metaTags.twitterSite).toBe('@DominicaNews');
      expect(metaTags.twitterTitle).toBeDefined();
      expect(metaTags.twitterDescription).toBeDefined();
      expect(metaTags.twitterImage).toBe('https://dominicanews.com/images/hurricane-dominica.jpg');
    });

    it('should generate category page meta tags', () => {
      const metaTags = MetaTagsService.generateCategoryMetaTags('Weather', 'weather');

      expect(metaTags.title).toContain('Weather News');
      expect(metaTags.description).toContain('weather news from Dominica');
      expect(metaTags.canonical).toBe('https://dominicanews.com/category/weather');
      expect(metaTags.keywords).toContain('Weather News');
      expect(metaTags.keywords).toContain('Weather Dominica');
    });

    it('should generate homepage meta tags with Dominica-specific keywords', () => {
      const metaTags = MetaTagsService.generateHomepageMetaTags();

      expect(metaTags.title).toContain('Dominica News');
      expect(metaTags.description).toContain('breaking news from Dominica');
      expect(metaTags.keywords).toContain('Dominica News');
      expect(metaTags.keywords).toContain('Dominica Breaking News');
      expect(metaTags.keywords).toContain('Dominica Politics');
      expect(metaTags.keywords).toContain('Dominica Weather Updates');
      expect(metaTags.keywords).toContain('Caribbean News');
      expect(metaTags.canonical).toBe('https://dominicanews.com');
    });

    it('should generate author page meta tags', () => {
      const metaTags = MetaTagsService.generateAuthorMetaTags(
        'Dominica News Weather Desk',
        'dominica-news-weather-desk',
        'Professional weather reporting team covering Caribbean weather patterns'
      );

      expect(metaTags.title).toContain('Dominica News Weather Desk');
      expect(metaTags.description).toContain('Professional weather reporting team');
      expect(metaTags.canonical).toBe('https://dominicanews.com/author/dominica-news-weather-desk');
      expect(metaTags.ogType).toBe('profile');
    });

    it('should generate static page meta tags', () => {
      const metaTags = MetaTagsService.generateStaticPageMetaTags(
        'About Us',
        'about',
        '<p>Dominica News is the leading news source for the Commonwealth of Dominica.</p>'
      );

      expect(metaTags.title).toContain('About Us');
      expect(metaTags.description).toContain('Dominica News is the leading news source');
      expect(metaTags.canonical).toBe('https://dominicanews.com/about');
      expect(metaTags.keywords).toContain('About Us');
    });

    it('should inject meta tags into document head', () => {
      const metaTags = MetaTagsService.generateHomepageMetaTags();
      
      MetaTagsService.injectMetaTags(metaTags);

      expect(document.title).toBe(metaTags.title);
      
      const descriptionMeta = document.querySelector('meta[name="description"]');
      expect(descriptionMeta?.getAttribute('content')).toBe(metaTags.description);
      
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      expect(keywordsMeta?.getAttribute('content')).toBe(metaTags.keywords.join(', '));
      
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      expect(ogTitleMeta?.getAttribute('content')).toBe(metaTags.ogTitle);
      
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      expect(canonicalLink?.getAttribute('href')).toBe(metaTags.canonical);
    });

    it('should include geographic meta tags for Dominica', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);

      expect(metaTags.geoRegion).toBe('DM');
      expect(metaTags.geoCountry).toBe('Dominica');
      expect(metaTags.geoPlacename).toBeDefined();
    });

    it('should include news-specific meta tags', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);

      expect(metaTags.newsKeywords).toBeDefined();
      expect(metaTags.newsKeywords).toContain('Dominica News');
      expect(metaTags.articlePublishedTime).toBeDefined();
      expect(metaTags.articleModifiedTime).toBeDefined();
      expect(metaTags.articleAuthor).toBe(mockArticle.author.name);
      expect(metaTags.articleSection).toBe(mockArticle.category.name);
    });
  });

  describe('Keyword Optimization', () => {
    it('should optimize content for Dominica-specific keywords', () => {
      const optimizedContent = KeywordOptimizationService.generateOptimizedContent(
        mockArticle,
        'weather'
      );

      expect(optimizedContent.title).toBeDefined();
      expect(optimizedContent.description).toBeDefined();
      expect(optimizedContent.keywords).toBeDefined();
      expect(optimizedContent.keywords.length).toBeGreaterThan(0);
    });

    it('should analyze keyword density and provide recommendations', () => {
      const analysis = KeywordOptimizationService.analyzeKeywordDensity(
        mockArticle.content,
        ['dominica', 'hurricane', 'weather']
      );

      expect(analysis).toBeDefined();
      expect(Array.isArray(analysis)).toBe(true);
      expect(analysis.length).toBeGreaterThan(0);
      expect(analysis[0]).toHaveProperty('keyword');
      expect(analysis[0]).toHaveProperty('count');
      expect(analysis[0]).toHaveProperty('density');
    });

    it('should generate SEO-friendly titles with target keywords', () => {
      const optimizedTitle = KeywordOptimizationService.optimizeTitle(
        'Hurricane Season Update',
        'Weather',
        false
      );

      expect(optimizedTitle).toBeDefined();
      expect(typeof optimizedTitle).toBe('string');
      expect(optimizedTitle.length).toBeLessThanOrEqual(60);
      expect(optimizedTitle).toContain('Hurricane Season Update');
    });

    it('should optimize meta descriptions for search engines', () => {
      const optimizedDescription = KeywordOptimizationService.optimizeDescription(
        'Hurricane season preparations in Dominica',
        'Weather',
        ['Dominica Weather', 'Hurricane Safety', 'Caribbean News']
      );

      expect(optimizedDescription).toBeDefined();
      expect(typeof optimizedDescription).toBe('string');
      expect(optimizedDescription.length).toBeLessThanOrEqual(160);
      expect(optimizedDescription).toContain('Hurricane season preparations');
    });

    it('should provide SEO recommendations for articles', () => {
      const recommendations = KeywordOptimizationService.getSEORecommendations(
        mockArticle,
        'weather'
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.title).toBeDefined();
      expect(recommendations.description).toBeDefined();
      expect(recommendations.keywords).toBeDefined();
      expect(recommendations.content).toBeDefined();
      expect(Array.isArray(recommendations.title)).toBe(true);
      expect(Array.isArray(recommendations.description)).toBe(true);
    });
  });

  describe('SEO Components Integration', () => {
    it('should render EnhancedSEO component with article data', () => {
      render(
        <HelmetProvider>
          <EnhancedSEO type="article" article={mockArticle} />
        </HelmetProvider>
      );

      // Component should render without errors
      expect(document.head.querySelector('script[type="application/ld+json"]')).toBeTruthy();
    });

    it('should render StructuredData component with schema markup', () => {
      render(
        <HelmetProvider>
          <StructuredData type="article" article={mockArticle} />
        </HelmetProvider>
      );

      // Component should render without errors
      const schemaScript = document.head.querySelector('script[type="application/ld+json"]');
      expect(schemaScript).toBeTruthy();
      expect(schemaScript?.textContent).toContain('"@type": "NewsArticle"');
    });
  });

  describe('SEO Validation and Testing', () => {
    it('should validate schema markup against Google guidelines', () => {
      const schema = SchemaMarkupService.generateNewsArticleSchema(mockArticle);
      
      // Required properties for NewsArticle
      expect(schema.headline).toBeDefined();
      expect(schema.image).toBeDefined();
      expect(schema.datePublished).toBeDefined();
      expect(schema.author).toBeDefined();
      expect(schema.publisher).toBeDefined();
      expect(schema.publisher.name).toBeDefined();
      expect(schema.publisher.logo).toBeDefined();
      
      // Validate image array
      expect(Array.isArray(schema.image)).toBe(true);
      expect(schema.image.length).toBeGreaterThan(0);
      
      // Validate author structure
      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBeDefined();
      
      // Validate publisher structure
      expect(schema.publisher['@type']).toBe('Organization');
      expect(schema.publisher.logo['@type']).toBe('ImageObject');
    });

    it('should ensure meta tags comply with length limits', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);
      
      expect(metaTags.title.length).toBeLessThanOrEqual(60);
      expect(metaTags.description.length).toBeLessThanOrEqual(160);
      expect(metaTags.ogTitle.length).toBeLessThanOrEqual(95);
      expect(metaTags.ogDescription.length).toBeLessThanOrEqual(200);
      expect(metaTags.twitterTitle.length).toBeLessThanOrEqual(70);
      expect(metaTags.twitterDescription.length).toBeLessThanOrEqual(200);
    });

    it('should validate canonical URLs are properly formatted', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);
      
      expect(metaTags.canonical).toMatch(/^https:\/\/dominicanews\.com\//);
      expect(metaTags.ogUrl).toMatch(/^https:\/\/dominicanews\.com\//);
      
      // Should not have trailing slashes for article URLs
      expect(metaTags.canonical).not.toMatch(/\/$/);
    });

    it('should ensure all images have proper alt text for accessibility', () => {
      const metaTags = MetaTagsService.generateArticleMetaTags(mockArticle);
      
      expect(metaTags.ogImageAlt).toBeDefined();
      expect(metaTags.twitterImageAlt).toBeDefined();
      expect(metaTags.ogImageAlt).toBe(mockArticle.featuredImageAlt);
    });

    it('should validate keyword targeting includes required Dominica terms', () => {
      const metaTags = MetaTagsService.generateHomepageMetaTags();
      
      const requiredKeywords = [
        'Dominica News',
        'Dominica Breaking News',
        'Caribbean News',
        'Dominica Politics',
        'Dominica Weather Updates'
      ];
      
      requiredKeywords.forEach(keyword => {
        expect(metaTags.keywords).toContain(keyword);
      });
    });
  });
});