/**
 * Comprehensive SEO Head component with schema markup support
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Article } from '../types/api';
import { SchemaMarkupService } from '../services/schemaMarkup';
import { MetaTagsService } from '../services/metaTags';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  article?: Article;
  breadcrumbs?: Array<{name: string; url: string}>;
  noindex?: boolean;
  nofollow?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Dominica News - Breaking News, Politics, Weather & Sports',
  description = 'Your trusted source for breaking news from Dominica. Get the latest updates on politics, weather, sports, entertainment, and Caribbean regional news.',
  keywords = ['Dominica News', 'Breaking News', 'Caribbean News', 'Politics', 'Weather Updates'],
  canonical,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  article,
  breadcrumbs = [],
  noindex = false,
  nofollow = false
}) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://dominicanews.com';
  const fullImageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/default-og-image.jpg`;
  const canonicalUrl = canonical || window.location.href;

  // Inject schema markup and meta tags
  useEffect(() => {
    if (article) {
      // Article page schema
      const schemas = SchemaMarkupService.generateArticlePageSchema(article);
      SchemaMarkupService.injectSchemaMarkup(schemas.newsArticle, 'news-article');
      SchemaMarkupService.injectSchemaMarkup(schemas.organization, 'organization');
      
      if (breadcrumbs.length > 0) {
        SchemaMarkupService.injectSchemaMarkup(schemas.breadcrumb, 'breadcrumb');
      }

      // Inject article meta tags
      const metaTags = MetaTagsService.generateArticleMetaTags(article);
      MetaTagsService.injectMetaTags(metaTags);
    } else {
      // Website/homepage schema
      const websiteSchema = SchemaMarkupService.generateWebsiteSchema();
      const organizationSchema = SchemaMarkupService.generateOrganizationSchema();
      
      SchemaMarkupService.injectSchemaMarkup(websiteSchema, 'website');
      SchemaMarkupService.injectSchemaMarkup(organizationSchema, 'organization');
      
      if (breadcrumbs.length > 0) {
        const breadcrumbSchema = SchemaMarkupService.generateBreadcrumbSchema(breadcrumbs);
        SchemaMarkupService.injectSchemaMarkup(breadcrumbSchema, 'breadcrumb');
      }

      // Inject homepage meta tags
      const metaTags = MetaTagsService.generateHomepageMetaTags();
      MetaTagsService.injectMetaTags(metaTags);
    }

    // Cleanup on unmount
    return () => {
      SchemaMarkupService.removeSchemaMarkup('news-article');
      SchemaMarkupService.removeSchemaMarkup('website');
      SchemaMarkupService.removeSchemaMarkup('organization');
      SchemaMarkupService.removeSchemaMarkup('breadcrumb');
    };
  }, [article, breadcrumbs]);

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Dominica News" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={fullImageUrl} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Article-specific Open Graph tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@DominicaNews" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {/* Additional Meta Tags for News */}
      <meta name="news_keywords" content={keywords.join(', ')} />
      <meta name="geo.region" content="DM" />
      <meta name="geo.country" content="Dominica" />
      <meta name="language" content="en" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />

      {/* Preconnect for Critical Resources */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;