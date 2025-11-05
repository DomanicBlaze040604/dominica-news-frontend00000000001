/**
 * Structured Data Component
 * Manages JSON-LD structured data injection
 */

import React, { useEffect } from 'react';
import { SchemaMarkupService } from '../services/schemaMarkup';
import { Article } from '../types/api';

interface StructuredDataProps {
  type: 'article' | 'homepage' | 'category' | 'author' | 'organization';
  article?: Article;
  categoryName?: string;
  categorySlug?: string;
  authorName?: string;
  authorSlug?: string;
  authorBio?: string;
  breadcrumbs?: Array<{name: string; url: string}>;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type,
  article,
  categoryName,
  categorySlug,
  authorName,
  authorSlug,
  authorBio,
  breadcrumbs = [],
  contactEmail,
  contactPhone,
  address
}) => {
  useEffect(() => {
    // Clean up existing schemas
    SchemaMarkupService.removeSchemaMarkup('news-article');
    SchemaMarkupService.removeSchemaMarkup('website');
    SchemaMarkupService.removeSchemaMarkup('organization');
    SchemaMarkupService.removeSchemaMarkup('breadcrumb');
    SchemaMarkupService.removeSchemaMarkup('breaking-news');

    switch (type) {
      case 'article':
        if (article) {
          const schemas = SchemaMarkupService.generateArticlePageSchema(article);
          
          // Inject article schema
          if (article.isBreaking) {
            const breakingNewsSchema = SchemaMarkupService.generateBreakingNewsSchema(article);
            SchemaMarkupService.injectSchemaMarkup(breakingNewsSchema, 'breaking-news');
          } else {
            SchemaMarkupService.injectSchemaMarkup(schemas.newsArticle, 'news-article');
          }
          
          // Inject organization schema
          SchemaMarkupService.injectSchemaMarkup(schemas.organization, 'organization');
          
          // Inject breadcrumb schema if available
          if (breadcrumbs.length > 0) {
            SchemaMarkupService.injectSchemaMarkup(schemas.breadcrumb, 'breadcrumb');
          }
        }
        break;

      case 'homepage':
        // Website schema
        const websiteSchema = SchemaMarkupService.generateWebsiteSchema();
        SchemaMarkupService.injectSchemaMarkup(websiteSchema, 'website');
        
        // Organization schema with contact info
        const organizationSchema = SchemaMarkupService.generateOrganizationSchema(
          contactEmail,
          contactPhone,
          address
        );
        SchemaMarkupService.injectSchemaMarkup(organizationSchema, 'organization');
        break;

      case 'category':
        if (categoryName && categorySlug) {
          // Organization schema
          const categoryOrgSchema = SchemaMarkupService.generateOrganizationSchema();
          SchemaMarkupService.injectSchemaMarkup(categoryOrgSchema, 'organization');
          
          // Breadcrumb schema for category
          if (breadcrumbs.length > 0) {
            const breadcrumbSchema = SchemaMarkupService.generateBreadcrumbSchema(breadcrumbs);
            SchemaMarkupService.injectSchemaMarkup(breadcrumbSchema, 'breadcrumb');
          }
        }
        break;

      case 'author':
        if (authorName && authorSlug) {
          // Organization schema
          const authorOrgSchema = SchemaMarkupService.generateOrganizationSchema();
          SchemaMarkupService.injectSchemaMarkup(authorOrgSchema, 'organization');
          
          // Person schema for author
          const personSchema = {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: authorName,
            url: `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://dominicanews.com'}/author/${authorSlug}`,
            description: authorBio,
            worksFor: {
              '@type': 'Organization',
              name: 'Dominica News'
            }
          };
          SchemaMarkupService.injectSchemaMarkup(personSchema, 'person');
          
          // Breadcrumb schema for author
          if (breadcrumbs.length > 0) {
            const breadcrumbSchema = SchemaMarkupService.generateBreadcrumbSchema(breadcrumbs);
            SchemaMarkupService.injectSchemaMarkup(breadcrumbSchema, 'breadcrumb');
          }
        }
        break;

      case 'organization':
        // Standalone organization schema
        const standAloneOrgSchema = SchemaMarkupService.generateOrganizationSchema(
          contactEmail,
          contactPhone,
          address
        );
        SchemaMarkupService.injectSchemaMarkup(standAloneOrgSchema, 'organization');
        break;
    }

    // Cleanup on unmount
    return () => {
      SchemaMarkupService.removeSchemaMarkup('news-article');
      SchemaMarkupService.removeSchemaMarkup('website');
      SchemaMarkupService.removeSchemaMarkup('organization');
      SchemaMarkupService.removeSchemaMarkup('breadcrumb');
      SchemaMarkupService.removeSchemaMarkup('breaking-news');
      SchemaMarkupService.removeSchemaMarkup('person');
    };
  }, [
    type,
    article,
    categoryName,
    categorySlug,
    authorName,
    authorSlug,
    authorBio,
    breadcrumbs,
    contactEmail,
    contactPhone,
    address
  ]);

  // This component doesn't render anything visible
  return null;
};

export default StructuredData;