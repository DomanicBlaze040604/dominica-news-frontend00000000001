import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { BatchImageUpload } from '@/components/admin/BatchImageUpload';
import { ImageOptimizationInfo } from '@/components/admin/ImageOptimizationInfo';
import { ImageMetadataEditor } from '@/components/admin/ImageMetadataEditor';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { imagesService } from '../../services/images';
import { Image } from '../../types/api';
import { 
  Trash2, 
  Eye, 
  Copy, 
  Image as ImageIcon, 
  Zap, 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Enhanced Image interface for gallery management
interface EnhancedImage extends Image {
  processing?: {
    compressionRatio: string;
    variantsCreated: number;
    totalSize: number;
    originalSize: number;
  };
  variants?: {
    [key: string]: {
      webp: { size: number; url: string; };
      jpeg: { size: number; url: string; };
    };
  };
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    colorSpace?: string;
    hasAlpha?: boolean;
    density?: number;
  };
  uploadedAt?: string;
  original?: {
    size: number;
    width?: number;
    height?: number;
    format?: string;
  };
}

export const AdminImages: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'images' | 'optimized'>('all');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch images with search and filters
  const { data: imagesData, isLoading } = useQuery({
    queryKey: ['images', { page, searchQuery, sortBy, sortOrder, filterBy }],
    queryFn: () => imagesService.getImages({ 
      page, 
      limit: 20, 
      search: searchQuery,
      sortBy,
      sortOrder,
      filter: filterBy
    }),
  });

  const images = (imagesData?.data.images || []) as EnhancedImage[];
  const pagination = imagesData?.data.pagination;

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: imagesService.uploadImage,
    onSuccess: () => {
      toast.success('Image uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: imagesService.deleteImage,
    onSuccess: () => {
      toast.success('Image deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['images'] });
      setShowDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete image');
    },
  });

  // Check image references mutation
  const checkReferencesMutation = useMutation({
    mutationFn: imagesService.checkImageReferences,
    onSuccess: (data) => {
      if (data.data.canDelete) {
        deleteMutation.mutate(showDeleteConfirm!);
      } else {
        toast.error(`Cannot delete image. It's referenced in ${data.data.references.length} item(s).`);
        setShowDeleteConfirm(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to check image references');
      setShowDeleteConfirm(null);
    },
  });

  const handleDelete = (imageId: string) => {
    setShowDeleteConfirm(imageId);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      checkReferencesMutation.mutate(showDeleteConfirm);
    }
  };

  const copyImageUrl = (image: EnhancedImage) => {
    const url = image.urls?.medium || image.url;
    navigator.clipboard.writeText(url);
    toast.success('Image URL copied to clipboard!');
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedImages.size} images? This action cannot be undone.`)) {
      const deletePromises = Array.from(selectedImages).map(imageId => 
        imagesService.deleteImage(imageId)
      );
      
      try {
        await Promise.all(deletePromises);
        toast.success(`${selectedImages.size} images deleted successfully!`);
        setSelectedImages(new Set());
        queryClient.invalidateQueries({ queryKey: ['images'] });
      } catch (error) {
        toast.error('Some images could not be deleted');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Images</h1>
          <p className="text-gray-600">Manage your media library</p>
        </div>
      </div>

      {/* Batch Upload Area */}
      <BatchImageUpload
        onUploadComplete={() => {
          // Refresh the images list after batch upload
          queryClient.invalidateQueries({ queryKey: ['images'] });
        }}
        maxFiles={20}
        disabled={uploadMutation.isPending}
      />

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'size') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Upload Date</SelectItem>
                <SelectItem value="name">File Name</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Descending
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Ascending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter By Type */}
            <Select value={filterBy} onValueChange={(value: 'all' | 'images' | 'optimized') => setFilterBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Images</SelectItem>
                <SelectItem value="images">Original Images</SelectItem>
                <SelectItem value="optimized">Optimized Images</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedImages.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedImages.size} image(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Implement bulk download
                      toast.info('Bulk download feature coming soon');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImages(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            Media Library ({pagination?.totalImages || 0})
          </CardTitle>
          <CardDescription>
            Click on an image to view details or copy its URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No images uploaded yet</p>
              <p className="text-sm text-gray-400">
                Upload your first image using the area above
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="group relative">
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedImages.has(image.id)}
                        onCheckedChange={(checked) => {
                          const newSelection = new Set(selectedImages);
                          if (checked) {
                            newSelection.add(image.id);
                          } else {
                            newSelection.delete(image.id);
                          }
                          setSelectedImages(newSelection);
                        }}
                        className="bg-white/80 border-white"
                      />
                    </div>

                    {/* Optimization Badge */}
                    {image.processing && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          {image.processing.compressionRatio}
                        </Badge>
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer">
                          <LazyImage
                            src={image.urls?.thumbnail || image.thumbnailUrl}
                            alt={image.altText || image.originalName}
                            className="w-full aspect-square object-cover rounded-lg border hover:shadow-md transition-shadow"
                            useIntersectionObserver={true}
                            threshold={0.1}
                            rootMargin="100px"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </DialogTrigger>

                      {/* Image Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate">
                          {image.originalName}
                        </p>
                        <p className="text-white/80 text-xs">
                          {formatFileSize(image.fileSize || image.original?.size || 0)}
                        </p>
                      </div>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{image.originalName}</DialogTitle>
                          <DialogDescription>
                            Manage image details, metadata, and optimization
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="max-h-[80vh] overflow-y-auto">
                          <Tabs defaultValue="preview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="preview">Preview</TabsTrigger>
                              <TabsTrigger value="metadata">Metadata</TabsTrigger>
                              <TabsTrigger value="optimization">Optimization</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="preview" className="space-y-4">
                              {/* Image Preview */}
                              <LazyImage
                                src={image.urls?.medium || image.url}
                                alt={image.altText || image.originalName}
                                className="w-full max-h-96 object-contain rounded-lg border"
                                useIntersectionObserver={false}
                              />
                              
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-gray-700">File Size</p>
                                  <p className="text-gray-600">{formatFileSize(image.fileSize || image.original?.size || 0)}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Dimensions</p>
                                  <p className="text-gray-600">
                                    {image.width || image.metadata?.width || 0} × {image.height || image.metadata?.height || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Type</p>
                                  <p className="text-gray-600">{image.mimeType || image.metadata?.format || 'Unknown'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Uploaded</p>
                                  <p className="text-gray-600">
                                    {format(new Date(image.createdAt || image.uploadedAt || new Date()), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyImageUrl(image)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy URL
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(image.urls?.original || image.url, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Size
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(image.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="metadata">
                              <ImageMetadataEditor
                                image={{
                                  id: image.id,
                                  filename: image.filename,
                                  originalName: image.originalName,
                                  altText: image.altText,
                                  title: image.originalName,
                                  description: '',
                                  tags: [],
                                  caption: '',
                                  credit: '',
                                  copyright: '',
                                  uploadedAt: image.createdAt || image.uploadedAt || new Date().toISOString(),
                                  metadata: image.metadata
                                }}
                                onSave={async (updatedMetadata) => {
                                  // Update image metadata
                                  try {
                                    await imagesService.updateImageMetadata(image.id, updatedMetadata);
                                    queryClient.invalidateQueries({ queryKey: ['images'] });
                                  } catch (error) {
                                    throw error;
                                  }
                                }}
                                onCancel={() => {}}
                              />
                            </TabsContent>
                            
                            <TabsContent value="optimization">
                              {image.processing && image.variants ? (
                                <ImageOptimizationInfo imageData={{
                                  filename: image.filename,
                                  original: image.original || {
                                    size: image.fileSize,
                                    width: image.width,
                                    height: image.height,
                                    format: image.mimeType
                                  },
                                  variants: image.variants,
                                  processing: image.processing,
                                  metadata: image.metadata
                                }} />
                              ) : (
                                <div className="text-center py-8">
                                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500">No optimization data available</p>
                                  <p className="text-sm text-gray-400">This image may not have been processed with the new optimization system</p>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center mt-8 space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Image Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
              We'll check if the image is being used elsewhere before deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={checkReferencesMutation.isPending || deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={checkReferencesMutation.isPending || deleteMutation.isPending}
            >
              {checkReferencesMutation.isPending || deleteMutation.isPending ? 'Deleting...' : 'Delete Image'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};