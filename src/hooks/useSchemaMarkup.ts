/**
 * React hook for managing schema markup injection and removal
 */

import { useEffect } from 'react';
import { SchemaMarkupService } from '../services/schemaMarkup';
import { Article } from '../types/api';

/**
 * Hook for managing article schema markup
 */
export const useArticleSchema = (article: Article | null) => {
  useEffect(() => {
    if (!article) return;

    const schemas = SchemaMarkupService.generateArticlePageSchema(article);
    
    // Inject all schemas
    SchemaMarkupService.injectSchemaMarkup(schemas.newsArticle, 'news-article');
    SchemaMarkupService.injectSchemaMarkup(schemas.breadcrumb, 'breadcrumb');
    SchemaMarkupService.injectSchemaMarkup(schemas.organization, 'organization');

    // Cleanup on unmount
    return () => {
      SchemaMarkupService.removeSchemaMarkup('news-article');
      SchemaMarkupService.removeSchemaMarkup('breadcrumb');
      SchemaMarkupService.removeSchemaMarkup('organization');
    };
  }, [article]);
};

/**
 * Hook for managing website schema markup (for homepage)
 */
export const useWebsiteSchema = () => {
  useEffect(() => {
    const websiteSchema = SchemaMarkupService.generateWebsiteSchema();
    const organizationSchema = SchemaMarkupService.generateOrganizationSchema();
    
    SchemaMarkupService.injectSchemaMarkup(websiteSchema, 'website');
    SchemaMarkupService.injectSchemaMarkup(organizationSchema, 'organization');

    return () => {
      SchemaMarkupService.removeSchemaMarkup('website');
      SchemaMarkupService.removeSchemaMarkup('organization');
    };
  }, []);
};

/**
 * Hook for managing breadcrumb schema markup
 */
export const useBreadcrumbSchema = (items: Array<{name: string; url: string}>) => {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const breadcrumbSchema = SchemaMarkupService.generateBreadcrumbSchema(items);
    SchemaMarkupService.injectSchemaMarkup(breadcrumbSchema, 'breadcrumb');

    return () => {
      SchemaMarkupService.removeSchemaMarkup('breadcrumb');
    };
  }, [items]);
};

/**
 * Hook for managing organization schema markup with dynamic contact info
 */
export const useOrganizationSchema = (
  contactEmail?: string,
  contactPhone?: string,
  address?: string
) => {
  useEffect(() => {
    const organizationSchema = SchemaMarkupService.generateOrganizationSchema(
      contactEmail,
      contactPhone,
      address
    );
    
    SchemaMarkupService.injectSchemaMarkup(organizationSchema, 'organization');

    return () => {
      SchemaMarkupService.removeSchemaMarkup('organization');
    };
  }, [contactEmail, contactPhone, address]);
};

/**
 * Hook for managing breaking news schema markup
 */
export const useBreakingNewsSchema = (article: Article | null) => {
  useEffect(() => {
    if (!article || !article.isBreaking) return;

    const breakingNewsSchema = SchemaMarkupService.generateBreakingNewsSchema(article);
    SchemaMarkupService.injectSchemaMarkup(breakingNewsSchema, 'breaking-news');

    return () => {
      SchemaMarkupService.removeSchemaMarkup('breaking-news');
    };
  }, [article]);
};