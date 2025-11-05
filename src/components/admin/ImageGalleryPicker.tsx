import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { BatchImageUpload } from './BatchImageUpload';
import { imagesService } from '../../services/images';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Image as ImageIcon, 
  Upload,
  Check,
  X,
  Zap,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageGalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string, altText: string, imageData?: any) => void;
  allowMultiple?: boolean;
  selectedImages?: string[];
}

interface EnhancedImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  altText: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
  urls?: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
  processing?: {
    compressionRatio: string;
    variantsCreated: number;
  };
}

export const ImageGalleryPicker: React.FC<ImageGalleryPickerProps> = ({
  isOpen,
  onClose,
  onImageSelect,
  allowMultiple = false,
  selectedImages = []
}) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'images' | 'optimized'>('all');
  const [localSelectedImages, setLocalSelectedImages] = useState<Set<string>>(new Set(selectedImages));
  const [previewImage, setPreviewImage] = useState<EnhancedImage | null>(null);

  // Fetch images with search and filters
  const { data: imagesData, isLoading, refetch } = useQuery({
    queryKey: ['gallery-images', { page, searchQuery, sortBy, sortOrder, filterBy }],
    queryFn: () => imagesService.getImages({ 
      page, 
      limit: 12, 
      search: searchQuery,
      sortBy,
      sortOrder,
      filter: filterBy
    }),
    enabled: isOpen,
  });

  const images = (imagesData?.data.images || []) as EnhancedImage[];
  const pagination = imagesData?.data.pagination;

  const handleImageClick = (image: EnhancedImage) => {
    if (allowMultiple) {
      const newSelection = new Set(localSelectedImages);
      if (newSelection.has(image.id)) {
        newSelection.delete(image.id);
      } else {
        newSelection.add(image.id);
      }
      setLocalSelectedImages(newSelection);
    } else {
      // Single selection - insert immediately
      const imageUrl = image.urls?.medium || image.url;
      onImageSelect(imageUrl, image.altText, image);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (allowMultiple && localSelectedImages.size > 0) {
      // For multiple selection, we'd need to handle this differently
      // For now, just select the first one
      const firstSelectedId = Array.from(localSelectedImages)[0];
      const selectedImage = images.find(img => img.id === firstSelectedId);
      if (selectedImage) {
        const imageUrl = selectedImage.urls?.medium || selectedImage.url;
        onImageSelect(imageUrl, selectedImage.altText, selectedImage);
      }
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('date');
    setSortOrder('desc');
    setFilterBy('all');
    setPage(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Select Image from Gallery
          </DialogTitle>
          <DialogDescription>
            Choose an image from your media library or upload a new one
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="gallery" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>

            <TabsContent value="gallery" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                {/* Search and Filter Controls */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Search & Filter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search images..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-9"
                        />
                      </div>

                      {/* Sort By */}
                      <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'size') => setSortBy(value)}>
                        <SelectTrigger className="h-9">
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
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">
                            <div className="flex items-center gap-2">
                              <SortDesc className="h-4 w-4" />
                              Newest First
                            </div>
                          </SelectItem>
                          <SelectItem value="asc">
                            <div className="flex items-center gap-2">
                              <SortAsc className="h-4 w-4" />
                              Oldest First
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Filter By Type */}
                      <Select value={filterBy} onValueChange={(value: 'all' | 'images' | 'optimized') => setFilterBy(value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Images</SelectItem>
                          <SelectItem value="images">Original Images</SelectItem>
                          <SelectItem value="optimized">Optimized Images</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {pagination?.totalImages || 0} images found
                        {localSelectedImages.size > 0 && (
                          <span className="ml-2 text-blue-600 font-medium">
                            • {localSelectedImages.size} selected
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-xs"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Images Grid */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                      <p className="text-gray-500 mb-2">No images found</p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your search or upload a new image
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            localSelectedImages.has(image.id)
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          onClick={() => handleImageClick(image)}
                        >
                          {/* Selection Indicator */}
                          {localSelectedImages.has(image.id) && (
                            <div className="absolute top-2 left-2 z-10">
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <Check className="h-3 w-3" />
                              </div>
                            </div>
                          )}

                          {/* Optimization Badge */}
                          {image.processing && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                {image.processing.compressionRatio}
                              </Badge>
                            </div>
                          )}

                          {/* Image */}
                          <LazyImage
                            src={image.urls?.thumbnail || image.thumbnailUrl || image.url}
                            alt={image.altText || image.originalName}
                            className="w-full aspect-square object-cover"
                            useIntersectionObserver={true}
                            threshold={0.1}
                            rootMargin="50px"
                          />

                          {/* Image Info Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-xs font-medium truncate">
                                {image.originalName}
                              </p>
                              <p className="text-white/80 text-xs">
                                {formatFileSize(image.fileSize)}
                              </p>
                            </div>
                            
                            {/* Preview Button */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(image);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center mt-6 space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex-1">
              <div className="h-full">
                <BatchImageUpload
                  onUploadComplete={() => {
                    // Refresh the images list after upload
                    refetch();
                    toast.success('Images uploaded successfully! You can now select them from the gallery.');
                  }}
                  maxFiles={5}
                  disabled={false}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {allowMultiple ? (
              localSelectedImages.size > 0 ? (
                `${localSelectedImages.size} image(s) selected`
              ) : (
                'Select one or more images'
              )
            ) : (
              'Click an image to select it'
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            {allowMultiple && (
              <Button 
                onClick={handleConfirmSelection}
                disabled={localSelectedImages.size === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Insert Selected ({localSelectedImages.size})
              </Button>
            )}
          </div>
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewImage?.originalName}</DialogTitle>
              <DialogDescription>
                Image preview and details
              </DialogDescription>
            </DialogHeader>
            
            {previewImage && (
              <div className="space-y-4">
                <LazyImage
                  src={previewImage.urls?.medium || previewImage.url}
                  alt={previewImage.altText || previewImage.originalName}
                  className="w-full max-h-96 object-contain rounded-lg border"
                  useIntersectionObserver={false}
                />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">File Size</p>
                    <p className="text-gray-600">{formatFileSize(previewImage.fileSize)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Dimensions</p>
                    <p className="text-gray-600">
                      {previewImage.width || 0} × {previewImage.height || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Type</p>
                    <p className="text-gray-600">{previewImage.mimeType}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Alt Text</p>
                    <p className="text-gray-600">{previewImage.altText || 'No alt text'}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewImage(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const imageUrl = previewImage.urls?.medium || previewImage.url;
                      onImageSelect(imageUrl, previewImage.altText, previewImage);
                      setPreviewImage(null);
                      onClose();
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Select This Image
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};