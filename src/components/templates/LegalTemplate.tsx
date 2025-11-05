import React from 'react';
import { StaticPage } from '../../services/staticPages';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, FileText, Scale, AlertTriangle } from 'lucide-react';

interface LegalTemplateProps {
  page: StaticPage;
  type?: 'privacy' | 'terms';
}

export const LegalTemplate: React.FC<LegalTemplateProps> = ({ page, type = 'privacy' }) => {
  const getIcon = () => {
    switch (type) {
      case 'privacy':
        return <Shield className="h-8 w-8 text-blue-600" />;
      case 'terms':
        return <Scale className="h-8 w-8 text-green-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'privacy':
        return 'Learn how we collect, use, and protect your personal information';
      case 'terms':
        return 'Understand the rules and regulations for using our website';
      default:
        return 'Important legal information';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {page.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {getDescription()}
          </p>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(page.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Important Notice</h3>
                <p className="text-amber-700 text-sm">
                  {type === 'privacy' 
                    ? 'This privacy policy explains how Dominica News collects, uses, and protects your personal information. By using our website, you agree to the collection and use of information in accordance with this policy.'
                    : 'These terms of service govern your use of the Dominica News website. By accessing or using our service, you agree to be bound by these terms.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Questions or Concerns?
            </h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about this {type === 'privacy' ? 'privacy policy' : 'terms of service'}, 
              please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:legal@dominicanews.com"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                legal@dominicanews.com
              </a>
              <a
                href="/contact-us"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Contact Form
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};