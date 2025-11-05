import React, { useEffect } from 'react';
import { useDynamicSEO } from '../hooks/useDynamicSEO';

/**
 * Global SEO component that applies site-wide SEO settings to the document head
 */
export const GlobalSEO: React.FC = () => {
  const seoConfig = useDynamicSEO();

  useEffect(() => {
    // Update document title
    document.title = seoConfig.templates.homepage.title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seoConfig.templates.homepage.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = seoConfig.templates.homepage.description;
      document.head.appendChild(meta);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    const keywordsContent = seoConfig.templates.homepage.keywords.join(', ');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywordsContent);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = keywordsContent;
      document.head.appendChild(meta);
    }

    // Update Open Graph meta tags
    const updateOrCreateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };

    // Open Graph tags
    updateOrCreateMetaTag('og:title', seoConfig.templates.homepage.title);
    updateOrCreateMetaTag('og:description', seoConfig.templates.homepage.description);
    updateOrCreateMetaTag('og:type', 'website');
    updateOrCreateMetaTag('og:url', seoConfig.site.url);
    updateOrCreateMetaTag('og:site_name', seoConfig.site.name);
    updateOrCreateMetaTag('og:locale', seoConfig.site.locale);
    if (seoConfig.site.defaultImage) {
      updateOrCreateMetaTag('og:image', seoConfig.site.defaultImage);
    }

    // Twitter Card tags
    const updateOrCreateTwitterTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };

    updateOrCreateTwitterTag('twitter:card', seoConfig.social.twitter.cardType);
    updateOrCreateTwitterTag('twitter:site', seoConfig.social.twitter.site);
    updateOrCreateTwitterTag('twitter:title', seoConfig.templates.homepage.title);
    updateOrCreateTwitterTag('twitter:description', seoConfig.templates.homepage.description);
    if (seoConfig.site.defaultImage) {
      updateOrCreateTwitterTag('twitter:image', seoConfig.site.defaultImage);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', seoConfig.site.url);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', seoConfig.site.url);
      document.head.appendChild(canonicalLink);
    }

    // Structured data for website
    const existingJsonLd = document.querySelector('script[type="application/ld+json"][data-type="website"]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.setAttribute('data-type', 'website');
    jsonLdScript.textContent = JSON.stringify(seoConfig.structuredData.website);
    document.head.appendChild(jsonLdScript);

  }, [seoConfig]);

  // This component doesn't render anything visible
  return null;
};

export default GlobalSEO;