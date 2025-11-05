import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '../LazyImage';
import { toast } from 'sonner';
import { imagesService } from '../../services/images';

interface BatchImageUploadProps {
  onUploadComplete: (uploadedImages: any[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
  previewUrl?: string;
}

export const BatchImageUpload: React.FC<BatchImageUploadProps> = ({
  onUploadComplete,
  maxFiles = 20,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Not an image file';
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const createUploadItems = (files: File[]): UploadItem[] => {
    return files.map((file, index) => {
      const validationError = validateFile(file);
      const previewUrl = URL.createObjectURL(file);
      
      return {
        file,
        id: `${file.name}-${Date.now()}-${index}`,
        status: validationError ? 'error' : 'pending',
        progress: 0,
        error: validationError || undefined,
        previewUrl,
      };
    });
  };

  const uploadSingleFile = async (item: UploadItem): Promise<void> => {
    if (item.status === 'error') return;

    setUploadItems(prev => 
      prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i)
    );

    try {
      const formData = new FormData();
      formData.append('image', item.file);
      formData.append('altText', `Uploaded image: ${item.file.name}`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadItems(prev => 
          prev.map(i => {
            if (i.id === item.id && i.progress < 90) {
              return { ...i, progress: i.progress + 10 };
            }
            return i;
          })
        );
      }, 200);

      const response = await imagesService.uploadImage(formData);
      
      clearInterval(progressInterval);
      
      setUploadItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'success', progress: 100, result: response.data.image }
            : i
        )
      );
    } catch (error: any) {
      console.error(`Upload error for ${item.file.name}:`, error);
      setUploadItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                status: 'error', 
                progress: 0, 
                error: error.response?.data?.error || 'Upload failed' 
              }
            : i
        )
      );
    }
  };

  const startBatchUpload = async () => {
    const pendingItems = uploadItems.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    try {
      // Upload files in batches of 3 to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        await Promise.all(batch.map(item => uploadSingleFile(item)));
      }

      // Get successful uploads
      const successfulUploads = uploadItems
        .filter(item => item.status === 'success' && item.result)
        .map(item => item.result);

      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
        toast.success(`${successfulUploads.length} images uploaded successfully!`);
      }

      const failedCount = uploadItems.filter(item => item.status === 'error').length;
      if (failedCount > 0) {
        toast.error(`${failedCount} images failed to upload`);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      toast.error('Batch upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (files.length === 0) {
        toast.error('No valid image files found');
        return;
      }

      if (files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newItems = createUploadItems(files);
      setUploadItems(prev => [...prev, ...newItems]);
    },
    [disabled, maxFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      
      if (fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newItems = createUploadItems(fileArray);
      setUploadItems(prev => [...prev, ...newItems]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [maxFiles]
  );

  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeItem = (id: string) => {
    setUploadItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const clearAll = () => {
    uploadItems.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setUploadItems([]);
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>;
      default:
        return <ImageIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: UploadItem['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const pendingCount = uploadItems.filter(item => item.status === 'pending').length;
  const successCount = uploadItems.filter(item => item.status === 'success').length;
  const errorCount = uploadItems.filter(item => item.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Image Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop images here or click to upload
                </p>
                <p className="text-sm text-gray-500">
                  JPEG, PNG, WebP up to 5MB each (Max {maxFiles} files)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
              >
                Select Images
              </Button>
            </div>
          </div>

          {/* Upload Queue */}
          {uploadItems.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">Upload Queue ({uploadItems.length})</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">{pendingCount} Pending</Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800">{successCount} Success</Badge>
                    <Badge variant="destructive">{errorCount} Error</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={startBatchUpload}
                    disabled={isUploading || pendingCount === 0}
                    size="sm"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${pendingCount} Files`}
                  </Button>
                  <Button
                    onClick={clearAll}
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {uploadItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {item.previewUrl && (
                        <LazyImage
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-16 h-16 object-cover rounded"
                          useIntersectionObserver={false}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(item.status)}
                        <p className="text-sm font-medium truncate">{item.file.name}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {item.status === 'uploading' && (
                        <Progress value={item.progress} className="w-full mt-2" />
                      )}
                      {item.error && (
                        <p className="text-xs text-red-600 mt-1">{item.error}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="sm"
                      disabled={isUploading}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};