/**
 * Schema Markup Service for News Articles and Pages
 * Implements JSON-LD structured data following Google News guidelines
 */

import { Article } from '../types/api';

export interface NewsArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'NewsArticle';
  headline: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
      width?: number;
      height?: number;
    };
    url: string;
  };
  description: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  articleSection: string;
  keywords: string[];
  locationCreated?: {
    '@type': 'Place';
    name: string;
    addressCountry: 'DM';
  };
  inLanguage: string;
  wordCount?: number;
  timeRequired?: string;
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'NewsMediaOrganization';
  name: string;
  url: string;
  logo: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  sameAs: string[];
  address?: {
    '@type': 'PostalAddress';
    addressCountry: 'DM';
    addressLocality: string;
  };
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: 'customer service';
    email?: string;
    telephone?: string;
  };
}

export interface WebsiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export class SchemaMarkupService {
  private static readonly BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://dominicanews.com';
  private static readonly LOGO_URL = `${this.BASE_URL}/logo.png`;
  private static readonly ORGANIZATION_NAME = 'Dominica News';

  /**
   * Generate NewsArticle schema markup for articles
   */
  static generateNewsArticleSchema(article: Article): NewsArticleSchema {
    const articleUrl = `${this.BASE_URL}/articles/${article.slug}`;
    const images = [];
    
    // Add featured image if available
    if (article.featuredImage) {
      images.push(article.featuredImage.startsWith('http') 
        ? article.featuredImage 
        : `${this.BASE_URL}${article.featuredImage}`);
    }
    
    // Add gallery images
    if (article.gallery && article.gallery.length > 0) {
      article.gallery.forEach(img => {
        images.push(img.startsWith('http') ? img : `${this.BASE_URL}${img}`);
      });
    }
    
    // Fallback to default image if no images
    if (images.length === 0) {
      images.push(`${this.BASE_URL}/default-article-image.jpg`);
    }

    const schema: NewsArticleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      image: images,
      datePublished: new Date(article.publishedAt || article.createdAt).toISOString(),
      dateModified: new Date(article.updatedAt).toISOString(),
      author: {
        '@type': 'Person',
        name: article.author.name,
        url: `${this.BASE_URL}/author/${article.author.slug}`
      },
      publisher: {
        '@type': 'Organization',
        name: this.ORGANIZATION_NAME,
        logo: {
          '@type': 'ImageObject',
          url: this.LOGO_URL,
          width: 200,
          height: 60
        },
        url: this.BASE_URL
      },
      description: article.excerpt || article.seo?.metaDescription || '',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleUrl
      },
      articleSection: article.category.name,
      keywords: [
        ...article.tags,
        article.category.name,
        'Dominica News',
        'Breaking News',
        'Caribbean News'
      ],
      inLanguage: article.language || 'en'
    };

    // Add location if specified
    if (article.location) {
      schema.locationCreated = {
        '@type': 'Place',
        name: article.location,
        addressCountry: 'DM'
      };
    }

    // Add reading time if available
    if (article.readingTime) {
      schema.timeRequired = `PT${article.readingTime}M`;
    }

    // Add word count if calculable
    if (article.content) {
      const wordCount = article.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      schema.wordCount = wordCount;
    }

    return schema;
  }

  /**
   * Generate Organization schema markup
   */
  static generateOrganizationSchema(
    contactEmail?: string,
    contactPhone?: string,
    address?: string
  ): OrganizationSchema {
    const schema: OrganizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: this.ORGANIZATION_NAME,
      url: this.BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: this.LOGO_URL,
        width: 200,
        height: 60
      },
      sameAs: [
        'https://facebook.com/DominicaNews',
        'https://twitter.com/DominicaNews',
        'https://instagram.com/DominicaNews',
        'https://youtube.com/DominicaNews'
      ]
    };

    // Add address if provided
    if (address) {
      schema.address = {
        '@type': 'PostalAddress',
        addressCountry: 'DM',
        addressLocality: address
      };
    }

    // Add contact information if provided
    if (contactEmail || contactPhone) {
      schema.contactPoint = {
        '@type': 'ContactPoint',
        contactType: 'customer service'
      };
      
      if (contactEmail) {
        schema.contactPoint.email = contactEmail;
      }
      
      if (contactPhone) {
        schema.contactPoint.telephone = contactPhone;
      }
    }

    return schema;
  }

  /**
   * Generate Website schema markup
   */
  static generateWebsiteSchema(): WebsiteSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.ORGANIZATION_NAME,
      url: this.BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.BASE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: this.ORGANIZATION_NAME
      }
    };
  }

  /**
   * Generate Breadcrumb schema markup
   */
  static generateBreadcrumbSchema(items: Array<{name: string; url: string}>): BreadcrumbSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.BASE_URL}${item.url}`
      }))
    };
  }

  /**
   * Generate schema for breaking news
   */
  static generateBreakingNewsSchema(article: Article): NewsArticleSchema {
    const schema = this.generateNewsArticleSchema(article);
    
    // Add breaking news specific properties
    return {
      ...schema,
      '@type': 'NewsArticle',
      keywords: [
        'Breaking News',
        'Urgent',
        'Alert',
        ...schema.keywords
      ],
      description: `BREAKING: ${schema.description}`
    };
  }

  /**
   * Inject schema markup into document head
   */
  static injectSchemaMarkup(schema: any, id: string): void {
    // Remove existing schema with same ID
    const existingScript = document.querySelector(`script[data-schema-id="${id}"]`);
    if (existingScript) {
      existingScript.remove();
    }

    // Create and inject new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-id', id);
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  }

  /**
   * Remove schema markup from document head
   */
  static removeSchemaMarkup(id: string): void {
    const script = document.querySelector(`script[data-schema-id="${id}"]`);
    if (script) {
      script.remove();
    }
  }

  /**
   * Generate comprehensive schema for article pages
   */
  static generateArticlePageSchema(article: Article): {
    newsArticle: NewsArticleSchema;
    breadcrumb: BreadcrumbSchema;
    organization: OrganizationSchema;
  } {
    const breadcrumbItems = [
      { name: 'Home', url: '/' },
      { name: article.category.name, url: `/category/${article.category.slug}` },
      { name: article.title, url: `/articles/${article.slug}` }
    ];

    return {
      newsArticle: article.isBreaking 
        ? this.generateBreakingNewsSchema(article)
        : this.generateNewsArticleSchema(article),
      breadcrumb: this.generateBreadcrumbSchema(breadcrumbItems),
      organization: this.generateOrganizationSchema()
    };
  }
}

export default SchemaMarkupService;