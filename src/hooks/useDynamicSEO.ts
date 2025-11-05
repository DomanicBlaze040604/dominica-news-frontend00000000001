import { useMemo } from 'react';
import { useSiteSetting } from './useSiteSettings';
import { SEO_CONFIG } from '../utils/seoConfig';

/**
 * Hook that provides dynamic SEO configuration based on site settings
 */
export const useDynamicSEO = () => {
  // Get dynamic settings
  const { data: siteNameData } = useSiteSetting('site_name');
  const { data: siteDescriptionData } = useSiteSetting('site_description');
  const { data: metaTitleData } = useSiteSetting('seo_meta_title');
  const { data: metaDescriptionData } = useSiteSetting('seo_meta_description');
  const { data: keywordsData } = useSiteSetting('seo_keywords');
  const { data: ogImageData } = useSiteSetting('seo_og_image');
  const { data: facebookData } = useSiteSetting('social_facebook');
  const { data: twitterData } = useSiteSetting('social_twitter');

  // Create dynamic SEO config
  const dynamicSEOConfig = useMemo(() => {
    const siteName = siteNameData?.value || SEO_CONFIG.site.name;
    const siteDescription = siteDescriptionData?.value || SEO_CONFIG.site.description;
    const metaTitle = metaTitleData?.value || SEO_CONFIG.templates.homepage.title;
    const metaDescription = metaDescriptionData?.value || SEO_CONFIG.templates.homepage.description;
    const keywords = keywordsData?.value || SEO_CONFIG.templates.homepage.keywords.join(', ');
    const ogImage = ogImageData?.value || SEO_CONFIG.site.defaultImage;
    const facebookUrl = facebookData?.value || SEO_CONFIG.site.facebookPage;
    const twitterHandle = twitterData?.value ? `@${twitterData.value.split('/').pop()}` : SEO_CONFIG.site.twitterHandle;

    return {
      ...SEO_CONFIG,
      site: {
        ...SEO_CONFIG.site,
        name: siteName,
        description: siteDescription,
        defaultImage: ogImage,
        facebookPage: facebookUrl,
        twitterHandle: twitterHandle,
      },
      templates: {
        ...SEO_CONFIG.templates,
        homepage: {
          title: metaTitle,
          description: metaDescription,
          keywords: keywords.split(',').map(k => k.trim()),
        },
      },
      structuredData: {
        ...SEO_CONFIG.structuredData,
        website: {
          ...SEO_CONFIG.structuredData.website,
          name: siteName,
        },
      },
    };
  }, [
    siteNameData,
    siteDescriptionData,
    metaTitleData,
    metaDescriptionData,
    keywordsData,
    ogImageData,
    facebookData,
    twitterData,
  ]);

  return dynamicSEOConfig;
};

/**
 * Get dynamic homepage SEO data
 */
export const useDynamicHomepageSEO = () => {
  const seoConfig = useDynamicSEO();
  
  return useMemo(() => ({
    title: seoConfig.templates.homepage.title,
    description: seoConfig.templates.homepage.description,
    keywords: seoConfig.templates.homepage.keywords.join(', '),
    canonical: seoConfig.site.url,
  }), [seoConfig]);
};

/**
 * Get dynamic category SEO data
 */
export const useDynamicCategorySEO = (categorySlug: string, categoryName: string) => {
  const seoConfig = useDynamicSEO();
  
  return useMemo(() => {
    const categoryConfig = seoConfig.categories[categorySlug as keyof typeof seoConfig.categories];
    
    return {
      title: seoConfig.templates.category.title(categoryName),
      description: categoryConfig?.description || seoConfig.templates.category.description(categoryName),
      keywords: categoryConfig?.keywords || [categoryName, seoConfig.site.name, 'Breaking News'],
      canonical: seoConfig.urls.category(categorySlug),
    };
  }, [seoConfig, categorySlug, categoryName]);
};