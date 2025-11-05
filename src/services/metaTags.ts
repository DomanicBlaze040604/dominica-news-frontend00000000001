/**
 * Meta Tags Service
 * Comprehensive meta tag management for SEO optimization
 */

import { Article } from '../types/api';

export interface MetaTagsConfig {
  // Basic meta tags
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots: string;
  
  // Open Graph tags
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogUrl: string;
  ogImage: string;
  ogImageAlt?: string;
  ogSiteName: string;
  ogLocale: string;
  
  // Twitter Card tags
  twitterCard: string;
  twitterSite: string;
  twitterCreator?: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterImageAlt?: string;
  
  // Article-specific tags
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
  
  // News-specific tags
  newsKeywords?: string;
  
  // Geographic tags
  geoRegion?: string;
  geoCountry?: string;
  geoPlacename?: string;
  
  // Additional tags
  language: string;
  distribution: string;
  rating: string;
  revisitAfter?: string;
}

export class MetaTagsService {
  private static readonly BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://dominicanews.com';
  private static readonly SITE_NAME = 'Dominica News';
  private static readonly DEFAULT_IMAGE = `${this.BASE_URL}/default-og-image.jpg`;
  private static readonly TWITTER_HANDLE = '@DominicaNews';

  /**
   * Generate meta tags for article pages
   */
  static generateArticleMetaTags(article: Article): MetaTagsConfig {
    const articleUrl = `${this.BASE_URL}/articles/${article.slug}`;
    const imageUrl = article.featuredImage 
      ? (article.featuredImage.startsWith('http') ? article.featuredImage : `${this.BASE_URL}${article.featuredImage}`)
      : this.DEFAULT_IMAGE;

    const title = article.seo?.metaTitle || `${article.title} - ${article.category.name} | ${this.SITE_NAME}`;
    const description = article.seo?.metaDescription || article.excerpt || 
      `${article.title} | Latest ${article.category.name.toLowerCase()} news from ${this.SITE_NAME}`;

    const keywords = [
      'Dominica News',
      'Breaking News',
      article.category.name,
      ...article.tags,
      ...(article.seo?.keywords || [])
    ];

    return {
      // Basic meta tags
      title: title.substring(0, 60),
      description: description.substring(0, 160),
      keywords,
      canonical: article.seo?.canonicalUrl || articleUrl,
      robots: 'index, follow',
      
      // Open Graph tags
      ogTitle: title.substring(0, 95),
      ogDescription: description.substring(0, 200),
      ogType: 'article',
      ogUrl: articleUrl,
      ogImage: imageUrl,
      ogImageAlt: article.featuredImageAlt || article.title,
      ogSiteName: this.SITE_NAME,
      ogLocale: 'en_US',
      
      // Twitter Card tags
      twitterCard: 'summary_large_image',
      twitterSite: this.TWITTER_HANDLE,
      twitterCreator: article.author.name ? `@${article.author.name.replace(/\s+/g, '')}` : undefined,
      twitterTitle: title.substring(0, 70),
      twitterDescription: description.substring(0, 200),
      twitterImage: imageUrl,
      twitterImageAlt: article.featuredImageAlt || article.title,
      
      // Article-specific tags
      articlePublishedTime: new Date(article.publishedAt || article.createdAt).toISOString(),
      articleModifiedTime: new Date(article.updatedAt).toISOString(),
      articleAuthor: article.author.name,
      articleSection: article.category.name,
      articleTags: article.tags,
      
      // News-specific tags
      newsKeywords: keywords.join(', '),
      
      // Geographic tags
      geoRegion: 'DM',
      geoCountry: 'Dominica',
      geoPlacename: article.location || 'Dominica',
      
      // Additional tags
      language: article.language || 'en',
      distribution: 'global',
      rating: 'general',
      revisitAfter: '1 day'
    };
  }

  /**
   * Generate meta tags for category pages
   */
  static generateCategoryMetaTags(categoryName: string, categorySlug: string): MetaTagsConfig {
    const categoryUrl = `${this.BASE_URL}/category/${categorySlug}`;
    const title = `${categoryName} News - Latest Updates | ${this.SITE_NAME}`;
    const description = `Stay updated with the latest ${categoryName.toLowerCase()} news from Dominica. Breaking stories, analysis, and comprehensive coverage from the Caribbean's trusted news source.`;

    const keywords = [
      'Dominica News',
      'Breaking News',
      `${categoryName} News`,
      `${categoryName} Dominica`,
      `Latest ${categoryName}`,
      'Caribbean News'
    ];

    return {
      // Basic meta tags
      title: title.substring(0, 60),
      description: description.substring(0, 160),
      keywords,
      canonical: categoryUrl,
      robots: 'index, follow',
      
      // Open Graph tags
      ogTitle: title.substring(0, 95),
      ogDescription: description.substring(0, 200),
      ogType: 'website',
      ogUrl: categoryUrl,
      ogImage: this.DEFAULT_IMAGE,
      ogSiteName: this.SITE_NAME,
      ogLocale: 'en_US',
      
      // Twitter Card tags
      twitterCard: 'summary_large_image',
      twitterSite: this.TWITTER_HANDLE,
      twitterTitle: title.substring(0, 70),
      twitterDescription: description.substring(0, 200),
      twitterImage: this.DEFAULT_IMAGE,
      
      // Geographic tags
      geoRegion: 'DM',
      geoCountry: 'Dominica',
      geoPlacename: 'Dominica',
      
      // Additional tags
      language: 'en',
      distribution: 'global',
      rating: 'general',
      revisitAfter: '1 day'
    };
  }

  /**
   * Generate meta tags for homepage
   */
  static generateHomepageMetaTags(): MetaTagsConfig {
    const title = 'Dominica News - Breaking News, Politics, Weather & Sports';
    const description = 'Your trusted source for breaking news from Dominica. Get the latest updates on politics, weather, sports, entertainment, and Caribbean regional news. Stay informed with Nature Island\'s premier news platform.';

    const keywords = [
      'Dominica News',
      'Dominica Breaking News',
      'Caribbean News',
      'Dominica Politics',
      'Dominica Weather Updates',
      'Dominica Sports News',
      'Dominica Entertainment',
      'Nature Island News',
      'Commonwealth Dominica'
    ];

    return {
      // Basic meta tags
      title,
      description,
      keywords,
      canonical: this.BASE_URL,
      robots: 'index, follow',
      
      // Open Graph tags
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: this.BASE_URL,
      ogImage: this.DEFAULT_IMAGE,
      ogSiteName: this.SITE_NAME,
      ogLocale: 'en_US',
      
      // Twitter Card tags
      twitterCard: 'summary_large_image',
      twitterSite: this.TWITTER_HANDLE,
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: this.DEFAULT_IMAGE,
      
      // Geographic tags
      geoRegion: 'DM',
      geoCountry: 'Dominica',
      geoPlacename: 'Dominica',
      
      // Additional tags
      language: 'en',
      distribution: 'global',
      rating: 'general',
      revisitAfter: '1 hour'
    };
  }

  /**
   * Generate meta tags for author pages
   */
  static generateAuthorMetaTags(authorName: string, authorSlug: string, authorBio?: string): MetaTagsConfig {
    const authorUrl = `${this.BASE_URL}/author/${authorSlug}`;
    const title = `${authorName} - Author Profile | ${this.SITE_NAME}`;
    const description = authorBio 
      ? `Read articles by ${authorName}. ${authorBio.substring(0, 100)}...`
      : `Read the latest articles and news stories by ${authorName} on ${this.SITE_NAME}.`;

    const keywords = [
      'Dominica News',
      authorName,
      `${authorName} Articles`,
      'Caribbean Journalist',
      'News Author'
    ];

    return {
      // Basic meta tags
      title: title.substring(0, 60),
      description: description.substring(0, 160),
      keywords,
      canonical: authorUrl,
      robots: 'index, follow',
      
      // Open Graph tags
      ogTitle: title.substring(0, 95),
      ogDescription: description.substring(0, 200),
      ogType: 'profile',
      ogUrl: authorUrl,
      ogImage: this.DEFAULT_IMAGE,
      ogSiteName: this.SITE_NAME,
      ogLocale: 'en_US',
      
      // Twitter Card tags
      twitterCard: 'summary',
      twitterSite: this.TWITTER_HANDLE,
      twitterTitle: title.substring(0, 70),
      twitterDescription: description.substring(0, 200),
      twitterImage: this.DEFAULT_IMAGE,
      
      // Geographic tags
      geoRegion: 'DM',
      geoCountry: 'Dominica',
      
      // Additional tags
      language: 'en',
      distribution: 'global',
      rating: 'general'
    };
  }

  /**
   * Generate meta tags for static pages
   */
  static generateStaticPageMetaTags(
    pageTitle: string, 
    pageSlug: string, 
    pageContent?: string
  ): MetaTagsConfig {
    const pageUrl = `${this.BASE_URL}/${pageSlug}`;
    const title = `${pageTitle} | ${this.SITE_NAME}`;
    const description = pageContent 
      ? this.extractDescription(pageContent)
      : `${pageTitle} - ${this.SITE_NAME}. Your trusted source for news from Dominica and the Caribbean.`;

    const keywords = [
      'Dominica News',
      pageTitle,
      this.SITE_NAME,
      'Caribbean News'
    ];

    return {
      // Basic meta tags
      title: title.substring(0, 60),
      description: description.substring(0, 160),
      keywords,
      canonical: pageUrl,
      robots: 'index, follow',
      
      // Open Graph tags
      ogTitle: title.substring(0, 95),
      ogDescription: description.substring(0, 200),
      ogType: 'website',
      ogUrl: pageUrl,
      ogImage: this.DEFAULT_IMAGE,
      ogSiteName: this.SITE_NAME,
      ogLocale: 'en_US',
      
      // Twitter Card tags
      twitterCard: 'summary',
      twitterSite: this.TWITTER_HANDLE,
      twitterTitle: title.substring(0, 70),
      twitterDescription: description.substring(0, 200),
      twitterImage: this.DEFAULT_IMAGE,
      
      // Geographic tags
      geoRegion: 'DM',
      geoCountry: 'Dominica',
      
      // Additional tags
      language: 'en',
      distribution: 'global',
      rating: 'general'
    };
  }

  /**
   * Extract description from HTML content
   */
  private static extractDescription(htmlContent: string): string {
    // Remove HTML tags and get first 150 characters
    const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 150 
      ? textContent.substring(0, 150) + '...'
      : textContent;
  }

  /**
   * Inject meta tags into document head
   */
  static injectMetaTags(config: MetaTagsConfig): void {
    // Update document title
    document.title = config.title;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string) => {
      let metaTag = document.querySelector(selector);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        if (selector.includes('property=')) {
          const property = selector.match(/property="([^"]+)"/)?.[1];
          if (property) {
            metaTag.setAttribute('property', property);
          }
        } else if (selector.includes('name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) {
            metaTag.setAttribute('name', name);
          }
        }
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', config.description);
    updateMetaTag('meta[name="keywords"]', config.keywords.join(', '));
    updateMetaTag('meta[name="robots"]', config.robots);

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', config.ogTitle);
    updateMetaTag('meta[property="og:description"]', config.ogDescription);
    updateMetaTag('meta[property="og:type"]', config.ogType);
    updateMetaTag('meta[property="og:url"]', config.ogUrl);
    updateMetaTag('meta[property="og:image"]', config.ogImage);
    updateMetaTag('meta[property="og:site_name"]', config.ogSiteName);
    updateMetaTag('meta[property="og:locale"]', config.ogLocale);

    if (config.ogImageAlt) {
      updateMetaTag('meta[property="og:image:alt"]', config.ogImageAlt);
    }

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', config.twitterCard);
    updateMetaTag('meta[name="twitter:site"]', config.twitterSite);
    updateMetaTag('meta[name="twitter:title"]', config.twitterTitle);
    updateMetaTag('meta[name="twitter:description"]', config.twitterDescription);
    updateMetaTag('meta[name="twitter:image"]', config.twitterImage);

    if (config.twitterCreator) {
      updateMetaTag('meta[name="twitter:creator"]', config.twitterCreator);
    }

    if (config.twitterImageAlt) {
      updateMetaTag('meta[name="twitter:image:alt"]', config.twitterImageAlt);
    }

    // Article-specific tags
    if (config.articlePublishedTime) {
      updateMetaTag('meta[property="article:published_time"]', config.articlePublishedTime);
    }
    if (config.articleModifiedTime) {
      updateMetaTag('meta[property="article:modified_time"]', config.articleModifiedTime);
    }
    if (config.articleAuthor) {
      updateMetaTag('meta[property="article:author"]', config.articleAuthor);
    }
    if (config.articleSection) {
      updateMetaTag('meta[property="article:section"]', config.articleSection);
    }

    // News-specific tags
    if (config.newsKeywords) {
      updateMetaTag('meta[name="news_keywords"]', config.newsKeywords);
    }

    // Geographic tags
    if (config.geoRegion) {
      updateMetaTag('meta[name="geo.region"]', config.geoRegion);
    }
    if (config.geoCountry) {
      updateMetaTag('meta[name="geo.country"]', config.geoCountry);
    }
    if (config.geoPlacename) {
      updateMetaTag('meta[name="geo.placename"]', config.geoPlacename);
    }

    // Additional tags
    updateMetaTag('meta[name="language"]', config.language);
    updateMetaTag('meta[name="distribution"]', config.distribution);
    updateMetaTag('meta[name="rating"]', config.rating);

    if (config.revisitAfter) {
      updateMetaTag('meta[name="revisit-after"]', config.revisitAfter);
    }

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', config.canonical);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', config.canonical);
      document.head.appendChild(canonicalLink);
    }
  }
}

export default MetaTagsService;