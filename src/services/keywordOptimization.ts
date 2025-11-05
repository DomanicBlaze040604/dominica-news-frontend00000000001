/**
 * Keyword Optimization Service
 * Implements Dominica-specific keyword targeting and SEO optimization
 */

import { Article } from '../types/api';

export interface KeywordStrategy {
  primary: string[];
  secondary: string[];
  longTail: string[];
  location: string[];
  category: string[];
}

export interface OptimizedContent {
  title: string;
  description: string;
  keywords: string[];
  headings: {
    h1: string;
    h2: string[];
    h3: string[];
  };
}

export class KeywordOptimizationService {
  // Primary keywords for Dominica News
  private static readonly PRIMARY_KEYWORDS = [
    'Dominica News',
    'Dominica Breaking News',
    'Caribbean News',
    'Nature Island News'
  ];

  // Secondary keywords by category
  private static readonly SECONDARY_KEYWORDS = {
    politics: [
      'Dominica Politics',
      'Dominica Government',
      'Dominica Elections',
      'Political Analysis Dominica',
      'Dominica Parliament'
    ],
    weather: [
      'Dominica Weather',
      'Dominica Hurricane Updates',
      'Caribbean Weather',
      'Dominica Climate',
      'Weather Forecast Dominica'
    ],
    sports: [
      'Dominica Sports',
      'Dominica Athletics',
      'Caribbean Sports',
      'Dominica Cricket',
      'Dominica Football'
    ],
    entertainment: [
      'Dominica Entertainment',
      'Caribbean Culture',
      'Dominica Events',
      'Dominica Arts',
      'Dominica Music'
    ],
    business: [
      'Dominica Business',
      'Dominica Economy',
      'Caribbean Business',
      'Dominica Finance',
      'Dominica Investment'
    ],
    world: [
      'World News',
      'International News',
      'Global Affairs',
      'Foreign News',
      'International Relations'
    ],
    crime: [
      'Dominica Crime',
      'Dominica Safety',
      'Law Enforcement Dominica',
      'Dominica Justice',
      'Security News Dominica'
    ],
    caribbean: [
      'Caribbean News',
      'CARICOM News',
      'West Indies News',
      'Regional Caribbean',
      'Caribbean Politics'
    ],
    trending: [
      'Trending Dominica',
      'Popular News Dominica',
      'Viral Caribbean',
      'Social Media Dominica',
      'Current Events Dominica'
    ]
  };

  // Long-tail keywords for specific targeting
  private static readonly LONG_TAIL_KEYWORDS = [
    'latest news from Dominica today',
    'breaking news Dominica Caribbean',
    'Dominica weather updates hurricane season',
    'Dominica politics government news',
    'Dominica sports news athletics',
    'Dominica entertainment events culture',
    'Dominica business economy finance',
    'Dominica crime safety law enforcement',
    'Caribbean regional news CARICOM',
    'Nature Island Dominica news updates'
  ];

  // Location-specific keywords
  private static readonly LOCATION_KEYWORDS = [
    'Roseau Dominica',
    'Portsmouth Dominica',
    'Marigot Dominica',
    'Soufriere Dominica',
    'Calibishie Dominica',
    'Mahaut Dominica',
    'Canefield Dominica',
    'Woodford Hill Dominica',
    'Commonwealth of Dominica',
    'Nature Island Caribbean'
  ];

  /**
   * Generate keyword strategy for article
   */
  static generateKeywordStrategy(
    article: Article,
    categorySlug: string
  ): KeywordStrategy {
    const categoryKeywords = this.SECONDARY_KEYWORDS[categorySlug as keyof typeof this.SECONDARY_KEYWORDS] || [];
    
    return {
      primary: [...this.PRIMARY_KEYWORDS],
      secondary: categoryKeywords,
      longTail: this.LONG_TAIL_KEYWORDS.filter(keyword => 
        keyword.toLowerCase().includes(categorySlug) ||
        keyword.toLowerCase().includes(article.title.toLowerCase().split(' ')[0])
      ),
      location: article.location 
        ? this.LOCATION_KEYWORDS.filter(loc => 
            loc.toLowerCase().includes(article.location!.toLowerCase())
          )
        : this.LOCATION_KEYWORDS.slice(0, 3),
      category: [article.category.name, `${article.category.name} News`, `${article.category.name} Dominica`]
    };
  }

  /**
   * Optimize article title for SEO
   */
  static optimizeTitle(
    originalTitle: string,
    categoryName: string,
    isBreaking: boolean = false
  ): string {
    const maxLength = 60;
    let optimizedTitle = originalTitle;

    // Add breaking news prefix if applicable
    if (isBreaking && !originalTitle.toLowerCase().includes('breaking')) {
      optimizedTitle = `BREAKING: ${originalTitle}`;
    }

    // Add category and site name if space allows
    const suffix = ` - ${categoryName} | Dominica News`;
    if (optimizedTitle.length + suffix.length <= maxLength) {
      optimizedTitle += suffix;
    } else if (optimizedTitle.length + ' | Dominica News'.length <= maxLength) {
      optimizedTitle += ' | Dominica News';
    }

    return optimizedTitle.substring(0, maxLength);
  }

  /**
   * Optimize meta description for SEO
   */
  static optimizeDescription(
    originalDescription: string,
    categoryName: string,
    keywords: string[]
  ): string {
    const maxLength = 160;
    let optimizedDescription = originalDescription;

    // Ensure primary keywords are included
    const primaryKeyword = 'Dominica News';
    if (!optimizedDescription.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      const suffix = ` | Latest ${categoryName.toLowerCase()} news from ${primaryKeyword}.`;
      if (optimizedDescription.length + suffix.length <= maxLength) {
        optimizedDescription += suffix;
      }
    }

    // Add call-to-action if space allows
    const cta = ' Stay informed with breaking news updates.';
    if (optimizedDescription.length + cta.length <= maxLength) {
      optimizedDescription += cta;
    }

    return optimizedDescription.substring(0, maxLength);
  }

  /**
   * Generate optimized keywords array
   */
  static generateOptimizedKeywords(
    article: Article,
    categorySlug: string
  ): string[] {
    const strategy = this.generateKeywordStrategy(article, categorySlug);
    const keywords = new Set<string>();

    // Add primary keywords
    strategy.primary.forEach(keyword => keywords.add(keyword));

    // Add secondary keywords (limited to top 3)
    strategy.secondary.slice(0, 3).forEach(keyword => keywords.add(keyword));

    // Add article tags
    article.tags.forEach(tag => keywords.add(tag));

    // Add category keywords
    strategy.category.forEach(keyword => keywords.add(keyword));

    // Add location keywords if available
    if (strategy.location.length > 0) {
      strategy.location.slice(0, 2).forEach(keyword => keywords.add(keyword));
    }

    // Add long-tail keywords (limited to top 2)
    strategy.longTail.slice(0, 2).forEach(keyword => keywords.add(keyword));

    return Array.from(keywords).slice(0, 15); // Limit to 15 keywords
  }

  /**
   * Generate optimized content structure
   */
  static generateOptimizedContent(
    article: Article,
    categorySlug: string
  ): OptimizedContent {
    const strategy = this.generateKeywordStrategy(article, categorySlug);
    
    return {
      title: this.optimizeTitle(article.title, article.category.name, article.isBreaking),
      description: this.optimizeDescription(
        article.excerpt || article.seo?.metaDescription || '',
        article.category.name,
        strategy.primary
      ),
      keywords: this.generateOptimizedKeywords(article, categorySlug),
      headings: {
        h1: article.title,
        h2: [
          `Latest ${article.category.name} News from Dominica`,
          `${article.category.name} Updates and Analysis`
        ],
        h3: [
          'Breaking News Coverage',
          'Expert Analysis and Commentary',
          'Related Stories from the Caribbean'
        ]
      }
    };
  }

  /**
   * Generate category page SEO optimization
   */
  static optimizeCategoryPage(categoryName: string, categorySlug: string): {
    title: string;
    description: string;
    keywords: string[];
  } {
    const categoryKeywords = this.SECONDARY_KEYWORDS[categorySlug as keyof typeof this.SECONDARY_KEYWORDS] || [];
    
    return {
      title: `${categoryName} News - Latest Updates | Dominica News`,
      description: `Stay updated with the latest ${categoryName.toLowerCase()} news from Dominica. Breaking stories, analysis, and comprehensive coverage from the Caribbean's trusted news source.`,
      keywords: [
        ...this.PRIMARY_KEYWORDS,
        ...categoryKeywords.slice(0, 5),
        `${categoryName} News`,
        `${categoryName} Dominica`,
        `Latest ${categoryName}`,
        'Caribbean News Updates'
      ]
    };
  }

  /**
   * Generate homepage SEO optimization
   */
  static optimizeHomepage(): {
    title: string;
    description: string;
    keywords: string[];
  } {
    return {
      title: 'Dominica News - Breaking News, Politics, Weather & Sports',
      description: 'Your trusted source for breaking news from Dominica. Get the latest updates on politics, weather, sports, entertainment, and Caribbean regional news. Stay informed with Nature Island\'s premier news platform.',
      keywords: [
        ...this.PRIMARY_KEYWORDS,
        'Dominica Weather Updates',
        'Dominica Sports News',
        'Dominica Entertainment',
        'Dominica Politics News',
        'Caribbean Breaking News',
        'Nature Island News',
        'Commonwealth Dominica',
        'Latest Caribbean News',
        'Dominica Government News'
      ]
    };
  }

  /**
   * Analyze keyword density in content
   */
  static analyzeKeywordDensity(content: string, targetKeywords: string[]): {
    keyword: string;
    count: number;
    density: number;
  }[] {
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    return targetKeywords.map(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      let count = 0;
      
      // Count occurrences of the keyword phrase
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        const phrase = words.slice(i, i + keywordWords.length).join(' ');
        if (phrase === keyword.toLowerCase()) {
          count++;
        }
      }
      
      return {
        keyword,
        count,
        density: totalWords > 0 ? (count / totalWords) * 100 : 0
      };
    });
  }

  /**
   * Get SEO recommendations for content
   */
  static getSEORecommendations(
    article: Article,
    categorySlug: string
  ): {
    title: string[];
    description: string[];
    keywords: string[];
    content: string[];
  } {
    const recommendations = {
      title: [] as string[],
      description: [] as string[],
      keywords: [] as string[],
      content: [] as string[]
    };

    const optimized = this.generateOptimizedContent(article, categorySlug);
    
    // Title recommendations
    if (article.title.length > 60) {
      recommendations.title.push('Title is too long. Keep it under 60 characters.');
    }
    if (!article.title.toLowerCase().includes('dominica')) {
      recommendations.title.push('Consider including "Dominica" in the title for better local SEO.');
    }

    // Description recommendations
    const description = article.excerpt || article.seo?.metaDescription || '';
    if (description.length < 120) {
      recommendations.description.push('Meta description is too short. Aim for 120-160 characters.');
    }
    if (description.length > 160) {
      recommendations.description.push('Meta description is too long. Keep it under 160 characters.');
    }

    // Keyword recommendations
    if (article.tags.length < 3) {
      recommendations.keywords.push('Add more relevant tags to improve keyword targeting.');
    }
    if (!article.tags.some(tag => tag.toLowerCase().includes('dominica'))) {
      recommendations.keywords.push('Include location-specific tags like "Dominica" or "Caribbean".');
    }

    // Content recommendations
    if (article.content.length < 300) {
      recommendations.content.push('Article content is too short. Aim for at least 300 words for better SEO.');
    }
    
    const keywordDensity = this.analyzeKeywordDensity(article.content, optimized.keywords.slice(0, 5));
    const lowDensityKeywords = keywordDensity.filter(kw => kw.density < 0.5);
    if (lowDensityKeywords.length > 0) {
      recommendations.content.push(`Consider including these keywords more naturally in the content: ${lowDensityKeywords.map(kw => kw.keyword).join(', ')}`);
    }

    return recommendations;
  }
}

export default KeywordOptimizationService;