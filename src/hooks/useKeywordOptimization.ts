/**
 * React hook for keyword optimization and SEO recommendations
 */

import { useMemo } from 'react';
import { KeywordOptimizationService } from '../services/keywordOptimization';
import { Article } from '../types/api';

/**
 * Hook for optimizing article SEO
 */
export const useArticleOptimization = (article: Article | null, categorySlug?: string) => {
  return useMemo(() => {
    if (!article || !categorySlug) {
      return null;
    }

    const optimizedContent = KeywordOptimizationService.generateOptimizedContent(article, categorySlug);
    const recommendations = KeywordOptimizationService.getSEORecommendations(article, categorySlug);
    const keywordStrategy = KeywordOptimizationService.generateKeywordStrategy(article, categorySlug);

    return {
      optimizedContent,
      recommendations,
      keywordStrategy
    };
  }, [article, categorySlug]);
};

/**
 * Hook for category page optimization
 */
export const useCategoryOptimization = (categoryName: string, categorySlug: string) => {
  return useMemo(() => {
    if (!categoryName || !categorySlug) {
      return null;
    }

    return KeywordOptimizationService.optimizeCategoryPage(categoryName, categorySlug);
  }, [categoryName, categorySlug]);
};

/**
 * Hook for homepage optimization
 */
export const useHomepageOptimization = () => {
  return useMemo(() => {
    return KeywordOptimizationService.optimizeHomepage();
  }, []);
};

/**
 * Hook for analyzing keyword density in content
 */
export const useKeywordAnalysis = (content: string, targetKeywords: string[]) => {
  return useMemo(() => {
    if (!content || !targetKeywords.length) {
      return [];
    }

    return KeywordOptimizationService.analyzeKeywordDensity(content, targetKeywords);
  }, [content, targetKeywords]);
};