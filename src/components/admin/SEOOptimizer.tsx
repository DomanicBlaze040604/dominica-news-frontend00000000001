/**
 * SEO Optimizer Component for Admin Panel
 * Provides SEO recommendations and keyword optimization tools
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  BarChart3
} from 'lucide-react';
import { Article } from '../../types/api';
import { useArticleOptimization, useKeywordAnalysis } from '../../hooks/useKeywordOptimization';

interface SEOOptimizerProps {
  article: Article;
  categorySlug: string;
  onOptimizationApply?: (optimizedData: {
    title: string;
    description: string;
    keywords: string[];
  }) => void;
}

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  article,
  categorySlug,
  onOptimizationApply
}) => {
  const optimization = useArticleOptimization(article, categorySlug);
  const keywordAnalysis = useKeywordAnalysis(
    article.content,
    optimization?.optimizedContent.keywords || []
  );

  if (!optimization) {
    return null;
  }

  const { optimizedContent, recommendations, keywordStrategy } = optimization;

  // Calculate SEO score
  const calculateSEOScore = (): number => {
    let score = 0;
    const maxScore = 100;

    // Title optimization (20 points)
    if (article.title.length >= 30 && article.title.length <= 60) score += 10;
    if (article.title.toLowerCase().includes('dominica')) score += 10;

    // Description optimization (20 points)
    const description = article.excerpt || article.seo?.metaDescription || '';
    if (description.length >= 120 && description.length <= 160) score += 10;
    if (description.toLowerCase().includes('dominica')) score += 10;

    // Keywords optimization (20 points)
    if (article.tags.length >= 3) score += 10;
    if (article.tags.some(tag => tag.toLowerCase().includes('dominica'))) score += 10;

    // Content optimization (20 points)
    if (article.content.length >= 300) score += 10;
    const hasKeywords = keywordAnalysis.some(kw => kw.density >= 0.5 && kw.density <= 3);
    if (hasKeywords) score += 10;

    // Image optimization (10 points)
    if (article.featuredImage && article.featuredImageAlt) score += 10;

    // Location targeting (10 points)
    if (article.location) score += 10;

    return Math.min(score, maxScore);
  };

  const seoScore = calculateSEOScore();

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SEO Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(seoScore)}`}>
                {seoScore}/100
              </div>
              <div className="text-sm text-muted-foreground">
                {getScoreLabel(seoScore)}
              </div>
            </div>
            <div className="w-32">
              <Progress value={seoScore} className="h-2" />
            </div>
          </div>
          
          {seoScore < 80 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your article could benefit from SEO optimization. Check the recommendations below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Keyword Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Keyword Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Primary Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {keywordStrategy.primary.map((keyword, index) => (
                <Badge key={index} variant="default">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Category Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {keywordStrategy.secondary.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {keywordStrategy.location.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Location Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywordStrategy.location.slice(0, 3).map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword Density Analysis */}
      {keywordAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Keyword Density Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keywordAnalysis.slice(0, 8).map((analysis, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{analysis.keyword}</div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.count} occurrences
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {analysis.density.toFixed(1)}%
                    </div>
                    {analysis.density >= 0.5 && analysis.density <= 3 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title Recommendations */}
          {recommendations.title.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Title Optimization
              </h4>
              <ul className="space-y-1">
                {recommendations.title.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description Recommendations */}
          {recommendations.description.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Description Optimization
              </h4>
              <ul className="space-y-1">
                {recommendations.description.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keyword Recommendations */}
          {recommendations.keywords.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Keyword Optimization
              </h4>
              <ul className="space-y-1">
                {recommendations.keywords.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Recommendations */}
          {recommendations.content.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Content Optimization
              </h4>
              <ul className="space-y-1">
                {recommendations.content.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimized Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Optimized Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Optimized Title</h4>
            <div className="p-3 bg-muted rounded-md text-sm">
              {optimizedContent.title}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {optimizedContent.title.length}/60 characters
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Optimized Description</h4>
            <div className="p-3 bg-muted rounded-md text-sm">
              {optimizedContent.description}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {optimizedContent.description.length}/160 characters
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Suggested Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {optimizedContent.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {onOptimizationApply && (
            <button
              onClick={() => onOptimizationApply({
                title: optimizedContent.title,
                description: optimizedContent.description,
                keywords: optimizedContent.keywords
              })}
              className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Apply SEO Optimizations
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOOptimizer;