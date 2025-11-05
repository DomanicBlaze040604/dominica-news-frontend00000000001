import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StaticPage } from '../../services/staticPages';
import { authorsService } from '../../services/authors';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '../LoadingState';
import { LazyImage } from '../LazyImage';
import { MapPin, Mail, Phone, Globe, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Author } from '../../types/api';

interface EditorialTemplateProps {
  page: StaticPage;
}

export const EditorialTemplate: React.FC<EditorialTemplateProps> = ({ page }) => {
  const { data: authorsData, isLoading } = useQuery({
    queryKey: ['authors', 'public'],
    queryFn: () => authorsService.getAuthors(),
  });

  const authors = authorsData?.data?.authors?.filter((author: Author) => author.isActive) || [];

  // Group authors by role/department
  const groupedAuthors = authors.reduce((groups: Record<string, Author[]>, author: Author) => {
    const department = getDepartment(author);
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(author);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {page.title}
          </h1>
          <div className="max-w-4xl mx-auto">
            <div 
              className="prose prose-lg mx-auto"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>

        {/* Team Sections */}
        {isLoading ? (
          <div className="text-center py-12">
            <LoadingSpinner message="Loading editorial team..." size="lg" />
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedAuthors).map(([department, departmentAuthors]) => (
              <section key={department}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  {department}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {departmentAuthors.map((author) => (
                    <AuthorCard key={author.id} author={author} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Contact Information */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Contact Our Editorial Team
              </h3>
              <p className="text-gray-600 mb-4">
                Have a story tip or want to reach out to our editorial team?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:editorial@dominicanews.com"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  editorial@dominicanews.com
                </a>
                <a
                  href="tel:+1-767-555-0100"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  +1-767-555-0100
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface AuthorCardProps {
  author: Author;
}

const AuthorCard: React.FC<AuthorCardProps> = ({ author }) => {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          {author.profileImage ? (
            <LazyImage
              src={author.profileImage}
              alt={`${author.name} profile`}
              className="w-24 h-24 rounded-full mx-auto object-cover mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-semibold text-gray-500">
                {author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
          
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {author.name}
          </h3>
          
          {author.title && (
            <p className="text-blue-600 font-medium mb-2">{author.title}</p>
          )}
          
          <p className="text-gray-600 text-sm mb-3">{author.role}</p>
        </div>

        {/* Specializations */}
        {author.specialization && author.specialization.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 justify-center">
              {author.specialization.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Biography */}
        {author.biography && (
          <p className="text-gray-600 text-sm mb-4 text-center">
            {author.biography}
          </p>
        )}

        {/* Contact Information */}
        <div className="space-y-2 text-sm">
          {author.location && (
            <div className="flex items-center justify-center text-gray-600">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="text-xs">{author.location}</span>
            </div>
          )}
          
          {author.email && (
            <div className="flex items-center justify-center text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              <a 
                href={`mailto:${author.email}`}
                className="text-xs hover:text-blue-600 transition-colors"
              >
                {author.email}
              </a>
            </div>
          )}
        </div>

        {/* Social Media */}
        {author.socialMedia && (
          <div className="flex justify-center space-x-3 mt-4 pt-4 border-t border-gray-100">
            {author.socialMedia.twitter && (
              <a
                href={`https://twitter.com/${author.socialMedia.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {author.socialMedia.facebook && (
              <a
                href={author.socialMedia.facebook.startsWith('http') 
                  ? author.socialMedia.facebook 
                  : `https://facebook.com/${author.socialMedia.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {author.socialMedia.instagram && (
              <a
                href={`https://instagram.com/${author.socialMedia.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {author.socialMedia.linkedin && (
              <a
                href={author.socialMedia.linkedin.startsWith('http') 
                  ? author.socialMedia.linkedin 
                  : `https://linkedin.com/in/${author.socialMedia.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-700 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-600 transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to determine department/section
function getDepartment(author: Author): string {
  const name = author.name.toLowerCase();
  const role = author.role.toLowerCase();
  const title = author.title?.toLowerCase() || '';
  
  // Special desk assignments
  if (name.includes('weather desk')) return 'Weather & Environment';
  if (name.includes('world desk')) return 'International Coverage';
  
  // Role-based assignments
  if (role.includes('editor') || title.includes('editor')) return 'Editorial Leadership';
  if (role.includes('political') || role.includes('politics')) return 'Political Coverage';
  if (role.includes('sport') || role.includes('athletics')) return 'Sports';
  if (role.includes('culture') || role.includes('tourism')) return 'Culture & Tourism';
  if (role.includes('business') || role.includes('economic')) return 'Business & Economics';
  
  // Specialization-based assignments
  if (author.specialization?.includes('Politics')) return 'Political Coverage';
  if (author.specialization?.includes('Sports')) return 'Sports';
  if (author.specialization?.includes('Business')) return 'Business & Economics';
  if (author.specialization?.includes('Culture')) return 'Culture & Tourism';
  if (author.specialization?.includes('Weather')) return 'Weather & Environment';
  if (author.specialization?.includes('World News')) return 'International Coverage';
  
  return 'General Reporting';
}