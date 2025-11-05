import React from 'react';
import { StaticPage } from '../../services/staticPages';

interface DefaultTemplateProps {
  page: StaticPage;
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({ page }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="bg-white rounded-lg shadow-sm p-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </div>
          </header>
          
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  );
};