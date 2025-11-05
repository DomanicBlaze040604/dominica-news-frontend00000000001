/**
 * Enhanced SEO Component
 * Combines meta tags, structured data, and Open Graph optimization
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Article } from '../types/api';
import { MetaTagsService } from '../services/metaTags';
import { StructuredData } from './StructuredData';

interface EnhancedSEOProps {
  type: 'article' | 'homepage' | 'category' | 'author' | 'static-page';
  
  // Article-specific props
  article?: Article;
  
  // Category-specific props
  categoryName?: string;
  categorySlug?: string;
  
  // Author-specific props
  authorName?: string;
  authorSlug?: string;
  authorBio?: string;
  
  // Static page props
  pageTitle?: string;
  pageSlug?: string;
  pageContent?: string;
  
  // Common props
  breadcrumbs?: Array<{name: string; url: string}>;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string[];
  customImage?: string;
  customImageAlt?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  
  // Organization contact info
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export const EnhancedSEO: React.FC<EnhancedSEOProps> = ({
  type,
  article,
  categoryName,
  categorySlug,
  authorName,
  authorSlug,
  authorBio,
  pageTitle,
  pageSlug,
  pageContent,
  breadcrumbs = [],
  customTitle,
  customDescription,
  customKeywords,
  customImage,
  customImageAlt,
  noIndex = false,
  noFollow = false,
  contactEmail,
  contactPhone,
  address
}) => {
  // Generate meta tags based on type
  const generateMetaTags = () => {
    let metaTags;
    
    switch (type) {
      case 'article':
        if (article) {
          metaTags = MetaTagsService.generateArticleMetaTags(article);
        }
        break;
        
      case 'homepage':
        metaTags = MetaTagsService.generateHomepageMetaTags();
        break;
        
      case 'category':
        if (categoryName && categorySlug) {
          metaTags = MetaTagsService.generateCategoryMetaTags(categoryName, categorySlug);
        }
        break;
        
      case 'author':
        if (authorName && authorSlug) {
          metaTags = MetaTagsService.generateAuthorMetaTags(authorName, authorSlug, authorBio);
        }
        break;
        
      case 'static-page':
        if (pageTitle && pageSlug) {
          metaTags = MetaTagsService.generateStaticPageMetaTags(pageTitle, pageSlug, pageContent);
        }
        break;
    }
    
    if (!metaTags) {
      // Fallback to homepage meta tags
      metaTags = MetaTagsService.generateHomepageMetaTags();
    }
    
    // Apply custom overrides
    if (customTitle) metaTags.title = customTitle;
    if (customDescription) metaTags.description = customDescription;
    if (customKeywords) metaTags.keywords = customKeywords;
    if (customImage) metaTags.ogImage = customImage;
    if (customImageAlt) metaTags.ogImageAlt = customImageAlt;
    
    // Apply robots directives
    const robotsDirectives = [];
    if (noIndex) robotsDirectives.push('noindex');
    else robotsDirectives.push('index');
    
    if (noFollow) robotsDirectives.push('nofollow');
    else robotsDirectives.push('follow');
    
    metaTags.robots = robotsDirectives.join(', ');
    
    return metaTags;
  };

  const metaTags = generateMetaTags();

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="keywords" content={metaTags.keywords.join(', ')} />
        <meta name="robots" content={metaTags.robots} />
        <link rel="canonical" href={metaTags.canonical} />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={metaTags.ogTitle} />
        <meta property="og:description" content={metaTags.ogDescription} />
        <meta property="og:type" content={metaTags.ogType} />
        <meta property="og:url" content={metaTags.ogUrl} />
        <meta property="og:site_name" content={metaTags.ogSiteName} />
        <meta property="og:locale" content={metaTags.ogLocale} />
        <meta property="og:image" content={metaTags.ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {metaTags.ogImageAlt && (
          <meta property="og:image:alt" content={metaTags.ogImageAlt} />
        )}

        {/* Article-specific Open Graph tags */}
        {metaTags.articlePublishedTime && (
          <meta property="article:published_time" content={metaTags.articlePublishedTime} />
        )}
        {metaTags.articleModifiedTime && (
          <meta property="article:modified_time" content={metaTags.articleModifiedTime} />
        )}
        {metaTags.articleAuthor && (
          <meta property="article:author" content={metaTags.articleAuthor} />
        )}
        {metaTags.articleSection && (
          <meta property="article:section" content={metaTags.articleSection} />
        )}
        {metaTags.articleTags && metaTags.articleTags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content={metaTags.twitterCard} />
        <meta name="twitter:site" content={metaTags.twitterSite} />
        <meta name="twitter:title" content={metaTags.twitterTitle} />
        <meta name="twitter:description" content={metaTags.twitterDescription} />
        <meta name="twitter:image" content={metaTags.twitterImage} />
        {metaTags.twitterCreator && (
          <meta name="twitter:creator" content={metaTags.twitterCreator} />
        )}
        {metaTags.twitterImageAlt && (
          <meta name="twitter:image:alt" content={metaTags.twitterImageAlt} />
        )}

        {/* News-specific Meta Tags */}
        {metaTags.newsKeywords && (
          <meta name="news_keywords" content={metaTags.newsKeywords} />
        )}

        {/* Geographic Meta Tags */}
        {metaTags.geoRegion && (
          <meta name="geo.region" content={metaTags.geoRegion} />
        )}
        {metaTags.geoCountry && (
          <meta name="geo.country" content={metaTags.geoCountry} />
        )}
        {metaTags.geoPlacename && (
          <meta name="geo.placename" content={metaTags.geoPlacename} />
        )}

        {/* Additional Meta Tags */}
        <meta name="language" content={metaTags.language} />
        <meta name="distribution" content={metaTags.distribution} />
        <meta name="rating" content={metaTags.rating} />
        {metaTags.revisitAfter && (
          <meta name="revisit-after" content={metaTags.revisitAfter} />
        )}

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

      {/* Structured Data */}
      <StructuredData
        type={type === 'static-page' ? 'organization' : type}
        article={article}
        categoryName={categoryName}
        categorySlug={categorySlug}
        authorName={authorName}
        authorSlug={authorSlug}
        authorBio={authorBio}
        breadcrumbs={breadcrumbs}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        address={address}
      />
    </>
  );
};

export default EnhancedSEO;