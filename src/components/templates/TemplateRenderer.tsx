import React from 'react';
import { StaticPage } from '../../services/staticPages';
import { DefaultTemplate } from './DefaultTemplate';
import { AboutTemplate } from './AboutTemplate';
import { ContactTemplate } from './ContactTemplate';
import { EditorialTemplate } from './EditorialTemplate';
import { LegalTemplate } from './LegalTemplate';

interface TemplateRendererProps {
  page: StaticPage & { template?: string };
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ page }) => {
  const template = page.template || 'default';

  switch (template) {
    case 'about':
      return <AboutTemplate page={page} />;
    
    case 'contact':
      return <ContactTemplate page={page} />;
    
    case 'editorial':
      return <EditorialTemplate page={page} />;
    
    case 'privacy':
      return <LegalTemplate page={page} type="privacy" />;
    
    case 'terms':
      return <LegalTemplate page={page} type="terms" />;
    
    case 'default':
    default:
      return <DefaultTemplate page={page} />;
  }
};