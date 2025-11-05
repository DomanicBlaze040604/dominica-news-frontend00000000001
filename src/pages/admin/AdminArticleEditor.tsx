import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DragDropImageUpload } from '@/components/admin/DragDropImageUpload';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { SlugInput } from '@/components/admin/SlugInput';
import { articlesService } from '../../services/articles';
import { categoriesService } from '../../services/categories';
import { authorsService } from '../../services/authors';
import { ArticleFormData as ApiArticleFormData } from '../../types/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Calendar, Pin, Search, Plus, User } from 'lucide-react';
import { formatForDateTimeInput, parseLocalTimeToUTC, getCurrentLocalTime } from '../../utils/timezone';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  categoryId: z.string().min(1, 'Please select a category'),
  authorId: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']),
  scheduledAt: z.string().optional(),
  isPinned: z.boolean().optional(),
  seoTitle: z.string().max(60, 'SEO title cannot exceed 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description cannot exceed 160 characters').optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export const AdminArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== 'new';
  const [uploadedImage, setUploadedImage] = React.useState<any>(null);
  const [imageAltText, setImageAltText] = React.useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = React.useState<boolean>(false);

  // Fetch article data if editing
  const { data: articleData, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => articlesService.getAdminArticleById(id!),
    enabled: isEditing,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesService.getAdminCategories,
  });

  // Fetch authors
  const { data: authorsData } = useQuery({
    queryKey: ['admin-authors'],
    queryFn: authorsService.getAdminAuthors,
  });

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      featuredImageAlt: '',
      categoryId: '',
      authorId: '',
      status: 'draft',
      scheduledAt: '',
      isPinned: false,
      seoTitle: '',
      seoDescription: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (articleData?.data.article) {
      const article = articleData.data.article;
      form.reset({
        title: article.title,
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        content: article.content,
        featuredImage: article.featuredImage || '',
        featuredImageAlt: article.featuredImageAlt || '',
        categoryId: article.category.id,
        authorId: article.author.id,
        status: article.status,
        scheduledAt: article.scheduledAt ? formatForDateTimeInput(article.scheduledAt) : '',
        isPinned: article.isPinned || false,
        seoTitle: article.seoTitle || '',
        seoDescription: article.seoDescription || '',
      });
      setImageAltText(article.featuredImageAlt || '');
    }
  }, [articleData, form]);

  // Create article mutation
  const createMutation = useMutation({
    mutationFn: articlesService.createArticle,
    onSuccess: (response) => {
      toast.success('Article created successfully!');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      
      // Navigate to the created article or back to list
      if (response.data.article?.slug) {
        toast.success(`Article "${response.data.article.title}" created successfully!`);
      }
      navigate('/admin/articles');
    },
    onError: (error: any) => {
      console.error('Create article error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create article';
      toast.error(errorMessage);
      
      // Handle specific validation errors
      if (error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          Object.keys(validationErrors).forEach(field => {
            toast.error(`${field}: ${validationErrors[field]}`);
          });
        }
      }
    },
  });

  // Update article mutation
  const updateMutation = useMutation({
    mutationFn: (data: ApiArticleFormData) => articlesService.updateArticle(id!, data),
    onSuccess: (response) => {
      toast.success('Article updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-article', id] });
      
      if (response.data.article?.title) {
        toast.success(`Article "${response.data.article.title}" updated successfully!`);
      }
      navigate('/admin/articles');
    },
    onError: (error: any) => {
      console.error('Update article error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update article';
      toast.error(errorMessage);
      
      // Handle specific validation errors
      if (error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          Object.keys(validationErrors).forEach(field => {
            toast.error(`${field}: ${validationErrors[field]}`);
          });
        }
      }
      
      // Handle slug conflicts
      if (error.response?.status === 409) {
        toast.error('Article slug already exists. Please choose a different slug.');
      }
    },
  });

  const onSubmit = (data: ArticleFormData) => {
    // Additional validation
    if (!data.slug.trim()) {
      toast.error('Article slug is required');
      return;
    }

    if (!data.categoryId) {
      toast.error('Please select a category');
      return;
    }

    if (!data.authorId) {
      toast.error('Please select an author');
      return;
    }

    // Use uploaded image URL if available, otherwise use the form value
    const submitData: ApiArticleFormData = {
      title: data.title.trim(),
      slug: data.slug.trim(),
      excerpt: data.excerpt?.trim() || '',
      content: data.content,
      featuredImage: uploadedImage?.urls?.medium || data.featuredImage || '',
      featuredImageAlt: imageAltText || data.featuredImageAlt || '',
      categoryId: data.categoryId,
      authorId: data.authorId,
      status: data.status,
      scheduledAt: data.scheduledAt ? parseLocalTimeToUTC(data.scheduledAt).toISOString() : undefined,
      isPinned: data.isPinned || false,
      seoTitle: data.seoTitle?.trim() || '',
      seoDescription: data.seoDescription?.trim() || '',
    };

    // Validate scheduled date if status is scheduled
    if (data.status === 'scheduled') {
      if (!data.scheduledAt) {
        toast.error('Please select a scheduled date and time');
        return;
      }
      const scheduledDate = parseLocalTimeToUTC(data.scheduledAt);
      if (scheduledDate <= getCurrentLocalTime()) {
        toast.error('Scheduled date must be in the future');
        return;
      }
    }

    // Validate content length
    if (data.content.length < 50) {
      toast.error('Article content must be at least 50 characters long');
      return;
    }

    // Validate SEO fields if provided
    if (data.seoTitle && data.seoTitle.length > 60) {
      toast.error('SEO title cannot exceed 60 characters');
      return;
    }

    if (data.seoDescription && data.seoDescription.length > 160) {
      toast.error('SEO description cannot exceed 160 characters');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleImageUploaded = (imageData: any) => {
    setUploadedImage(imageData);
    if (imageData) {
      form.setValue('featuredImage', imageData.urls.medium);
      form.setValue('featuredImageAlt', imageData.altText);
      setImageAltText(imageData.altText);
    } else {
      form.setValue('featuredImage', '');
      form.setValue('featuredImageAlt', '');
      setImageAltText('');
    }
  };

  const handleAltTextChange = (altText: string) => {
    setImageAltText(altText);
    form.setValue('featuredImageAlt', altText);
  };

  const isLoading = isLoadingArticle || createMutation.isPending || updateMutation.isPending;
  const categories = categoriesData?.data || [];
  const authors = authorsData?.data.authors || [];
  const currentStatus = form.watch('status');
  const isPinnedValue = form.watch('isPinned');

  if (isEditing && isLoadingArticle) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/articles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Articles
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Article' : 'New Article'}
            </h1>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Update your article' : 'Create a new article'}
            </p>
          </div>
        </div>
      </div>

      {/* Author Information Banner (when editing) */}
      {isEditing && articleData?.data.article && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-blue-900">
                    Published by: {articleData.data.article.author?.name || 'Unknown Author'}
                  </h3>
                  {articleData.data.article.author?.role && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {articleData.data.article.author.role}
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Original author of this article • You can change the author in the sidebar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
                <CardDescription>The main content of your article</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter article title..."
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <SlugInput
                    title={form.watch('title')}
                    slug={form.watch('slug')}
                    onSlugChange={(slug) => form.setValue('slug', slug)}
                    type="article"
                    excludeId={isEditing ? id : undefined}
                    disabled={isLoading}
                    label="Article URL Slug"
                    placeholder="article-url-slug"
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the article..."
                    rows={3}
                    {...form.register('excerpt')}
                  />
                  {form.formState.errors.excerpt && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.excerpt.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Content</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isPreviewMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {isPreviewMode ? 'Edit' : 'Preview'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info('Use the rich text editor toolbar to format your content with bold, italic, headings, lists, links, and images.');
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Help
                      </Button>
                    </div>
                  </div>
                  
                  {isPreviewMode ? (
                    <div className="border border-gray-200 rounded-lg p-4 min-h-[500px] bg-white">
                      <div className="prose prose-sm max-w-none">
                        <div 
                          dangerouslySetInnerHTML={{ __html: form.watch('content') || '<p class="text-gray-500 italic">No content to preview yet. Switch to edit mode to start writing.</p>' }}
                          className="article-preview"
                        />
                      </div>
                      <style>{`
                        .article-preview h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
                        .article-preview h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
                        .article-preview h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
                        .article-preview p { margin: 1em 0; line-height: 1.6; }
                        .article-preview strong { font-weight: 600; }
                        .article-preview em { font-style: italic; }
                        .article-preview u { text-decoration: underline; }
                        .article-preview ul, .article-preview ol { padding-left: 1.5em; margin: 1em 0; }
                        .article-preview li { margin: 0.25em 0; }
                        .article-preview blockquote { border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280; }
                        .article-preview img { max-width: 100%; height: auto; border-radius: 4px; margin: 1em 0; }
                        .article-preview a { color: #3b82f6; text-decoration: underline; }
                        .article-preview pre { background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; overflow-x: auto; }
                      `}</style>
                    </div>
                  ) : (
                    <RichTextEditor
                      value={form.watch('content')}
                      onChange={(value) => form.setValue('content', value)}
                      placeholder="Write your article content here... Use the toolbar above for formatting options like bold, italic, headings, and more. You can also drag and drop images directly into the editor."
                      height="500px"
                      enableImageUpload={true}
                      enableDragDrop={true}
                      enableGalleryPicker={true}
                    />
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {isPreviewMode 
                      ? 'Preview mode: This is how your formatted content will appear to readers.'
                      : 'Use the rich text editor toolbar to format your content with bold, italic, headings, lists, links, and images.'
                    }
                  </p>
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
                <CardDescription>Control how your article is published</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value: 'draft' | 'published' | 'scheduled') => {
                      form.setValue('status', value);
                      // Clear scheduled date if not scheduling
                      if (value !== 'scheduled') {
                        form.setValue('scheduledAt', '');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Save as Draft</SelectItem>
                      <SelectItem value="published">Publish Now</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.status.message}
                    </p>
                  )}
                </div>

                {currentStatus === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduledAt">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Schedule Date & Time
                    </Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      {...form.register('scheduledAt')}
                      min={formatForDateTimeInput(getCurrentLocalTime())}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time is in Dominica timezone (UTC-4)
                    </p>
                    {form.formState.errors.scheduledAt && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.scheduledAt.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPinned"
                    checked={isPinnedValue}
                    onCheckedChange={(checked) => form.setValue('isPinned', checked)}
                  />
                  <Label htmlFor="isPinned" className="flex items-center">
                    <Pin className="w-4 h-4 mr-1" />
                    Pin to Featured
                  </Label>
                </div>

                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={form.watch('categoryId')}
                    onValueChange={(value) => form.setValue('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                  <Select
                    value=""
                    onValueChange={() => {
                      // Placeholder for future subcategory functionality
                      toast.info('Subcategory feature coming soon!');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subcategories available</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Subcategories will be available in a future update.
                  </p>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value="en"
                    onValueChange={() => {
                      // Placeholder for future language functionality
                      toast.info('Multi-language support coming soon!');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Currently only English is supported. Multi-language support coming soon.
                  </p>
                </div>

                <div>
                  <Label htmlFor="authorId">Author</Label>
                  <Select
                    value={form.watch('authorId')}
                    onValueChange={(value) => form.setValue('authorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent>
                      {authors.map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          {author.name} - {author.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.authorId && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.authorId.message}
                    </p>
                  )}
                  
                  {/* Selected Author Information */}
                  {form.watch('authorId') && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const selectedAuthor = authors.find(a => a.id === form.watch('authorId'));
                            if (!selectedAuthor) return null;
                            
                            return (
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {selectedAuthor.name}
                                </p>
                                <p className="text-xs text-blue-700">
                                  {selectedAuthor.role}
                                </p>
                                {selectedAuthor.biography && (
                                  <p className="text-xs text-blue-600 mt-1 line-clamp-2">
                                    {selectedAuthor.biography}
                                  </p>
                                )}
                                <p className="text-xs text-blue-500 mt-1">
                                  This article will be published under this author's name
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Featured Image</Label>
                  <DragDropImageUpload
                    onImageUploaded={handleImageUploaded}
                    currentImageUrl={form.watch('featuredImage')}
                    altText={imageAltText}
                    onAltTextChange={handleAltTextChange}
                    disabled={isLoading}
                  />
                  {form.formState.errors.featuredImage && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.featuredImage.message}
                    </p>
                  )}
                  {form.formState.errors.featuredImageAlt && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.featuredImageAlt.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  SEO Settings
                </CardTitle>
                <CardDescription>Optimize your article for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    placeholder="Custom title for search engines (max 60 chars)"
                    maxLength={60}
                    {...form.register('seoTitle')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.watch('seoTitle')?.length || 0}/60 characters
                  </p>
                  {form.formState.errors.seoTitle && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.seoTitle.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    placeholder="Brief description for search results (max 160 chars)"
                    maxLength={160}
                    rows={3}
                    {...form.register('seoDescription')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.watch('seoDescription')?.length || 0}/160 characters
                  </p>
                  {form.formState.errors.seoDescription && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.seoDescription.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 
                     currentStatus === 'scheduled' ? 'Schedule Article' :
                     currentStatus === 'published' ? (isEditing ? 'Update Article' : 'Publish Article') :
                     'Save as Draft'}
                  </Button>
                  
                  {isEditing && form.watch('status') === 'published' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const article = articleData?.data.article;
                        if (article) {
                          window.open(`/articles/${article.slug}`, '_blank');
                        }
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Article
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};