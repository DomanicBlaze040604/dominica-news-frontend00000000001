import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { articlesService } from '../../services/articles';
import { categoriesService } from '../../services/categories';
import { imagesService } from '../../services/images';
import { TestConnection } from '../../components/TestConnection';
import { FileText, FolderOpen, Image, TrendingUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  // Fetch dashboard statistics using public endpoints
  const { data: articlesData } = useQuery({
    queryKey: ['articles', { page: 1, limit: 1 }],
    queryFn: () => articlesService.getPublishedArticles({ page: 1, limit: 1 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  // For now, we'll skip images since the endpoint doesn't exist
  const imagesData = { data: { pagination: { totalImages: 0 } } };

  // Use the same articles data for published count
  const publishedArticlesData = articlesData;

  const stats = [
    {
      title: 'Total Articles',
      value: articlesData?.data?.length || 0,
      description: 'All articles in the system',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Published Articles',
      value: publishedArticlesData?.data?.length || 0,
      description: 'Articles visible to readers',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Categories',
      value: categoriesData?.data?.length || 0,
      description: 'Content categories',
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Images',
      value: 0, // Images endpoint not available yet
      description: 'Uploaded media files',
      icon: Image,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to your admin dashboard. Here's an overview of your content.
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col space-y-2">
              <a
                href="/admin/articles/new"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                <FileText className="mr-2 h-4 w-4" />
                Create New Article
              </a>
              <a
                href="/admin/categories"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Manage Categories
              </a>
              <a
                href="/admin/images"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Image className="mr-2 h-4 w-4" />
                Upload Images
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest changes to your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System initialized</p>
                  <p className="text-xs text-gray-500">Ready to create content</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backend Connection Test */}
      <div className="mt-8">
        <TestConnection />
      </div>
    </div>
  );
};