/**
 * React hook for managing meta tags
 */

import { useEffect } from 'react';
import { MetaTagsService } from '../services/metaTags';
import { Article } from '../types/api';

/**
 * Hook for managing article meta tags
 */
export const useArticleMetaTags = (article: Article | null) => {
  useEffect(() => {
    if (!article) return;

    const metaTags = MetaTagsService.generateArticleMetaTags(article);
    MetaTagsService.injectMetaTags(metaTags);
  }, [article]);
};

/**
 * Hook for managing category meta tags
 */
export const useCategoryMetaTags = (categoryName: string, categorySlug: string) => {
  useEffect(() => {
    if (!categoryName || !categorySlug) return;

    const metaTags = MetaTagsService.generateCategoryMetaTags(categoryName, categorySlug);
    MetaTagsService.injectMetaTags(metaTags);
  }, [categoryName, categorySlug]);
};

/**
 * Hook for managing homepage meta tags
 */
export const useHomepageMetaTags = () => {
  useEffect(() => {
    const metaTags = MetaTagsService.generateHomepageMetaTags();
    MetaTagsService.injectMetaTags(metaTags);
  }, []);
};

/**
 * Hook for managing author meta tags
 */
export const useAuthorMetaTags = (authorName: string, authorSlug: string, authorBio?: string) => {
  useEffect(() => {
    if (!authorName || !authorSlug) return;

    const metaTags = MetaTagsService.generateAuthorMetaTags(authorName, authorSlug, authorBio);
    MetaTagsService.injectMetaTags(metaTags);
  }, [authorName, authorSlug, authorBio]);
};

/**
 * Hook for managing static page meta tags
 */
export const useStaticPageMetaTags = (pageTitle: string, pageSlug: string, pageContent?: string) => {
  useEffect(() => {
    if (!pageTitle || !pageSlug) return;

    const metaTags = MetaTagsService.generateStaticPageMetaTags(pageTitle, pageSlug, pageContent);
    MetaTagsService.injectMetaTags(metaTags);
  }, [pageTitle, pageSlug, pageContent]);
};