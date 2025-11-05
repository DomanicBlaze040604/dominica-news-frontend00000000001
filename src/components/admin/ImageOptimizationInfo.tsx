import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Image as ImageIcon, 
  Zap, 
  FileImage, 
  HardDrive, 
  Gauge,
  CheckCircle
} from 'lucide-react';

interface ImageOptimizationInfoProps {
  imageData: {
    filename: string;
    original: {
      size: number;
      width?: number;
      height?: number;
      format?: string;
    };
    variants: {
      [key: string]: {
        webp: { size: number; url: string };
        jpeg: { size: number; url: string };
      };
    };
    processing: {
      variantsCreated: number;
      compressionRatio: string;
      totalSize: number;
      originalSize: number;
    };
    metadata?: {
      width?: number;
      height?: number;
      format?: string;
      hasAlpha?: boolean;
      colorSpace?: string;
    };
  };
}

export const ImageOptimizationInfo: React.FC<ImageOptimizationInfoProps> = ({
  imageData
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionColor = (ratio: string): string => {
    const numericRatio = parseFloat(ratio.replace('%', ''));
    if (numericRatio >= 70) return 'text-green-600';
    if (numericRatio >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompressionLevel = (ratio: string): string => {
    const numericRatio = parseFloat(ratio.replace('%', ''));
    if (numericRatio >= 70) return 'Excellent';
    if (numericRatio >= 50) return 'Good';
    if (numericRatio >= 30) return 'Fair';
    return 'Poor';
  };

  const spaceSaved = imageData.processing.originalSize - imageData.processing.totalSize;
  const compressionRatio = parseFloat(imageData.processing.compressionRatio.replace('%', ''));

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Image Optimization Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileImage className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-2xl font-bold">{imageData.processing.variantsCreated}</p>
              <p className="text-sm text-gray-600">Variants Created</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <HardDrive className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-2xl font-bold">{formatFileSize(spaceSaved)}</p>
              <p className="text-sm text-gray-600">Space Saved</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Gauge className={`h-8 w-8 ${getCompressionColor(imageData.processing.compressionRatio)}`} />
              </div>
              <p className={`text-2xl font-bold ${getCompressionColor(imageData.processing.compressionRatio)}`}>
                {imageData.processing.compressionRatio}
              </p>
              <p className="text-sm text-gray-600">Compression</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <Badge 
                variant={compressionRatio >= 50 ? "default" : "secondary"}
                className={compressionRatio >= 50 ? "bg-green-100 text-green-800" : ""}
              >
                {getCompressionLevel(imageData.processing.compressionRatio)}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Quality</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Size Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Original Size</span>
              <span className="text-sm">{formatFileSize(imageData.processing.originalSize)}</span>
            </div>
            <Progress value={100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Optimized Size</span>
              <span className="text-sm">{formatFileSize(imageData.processing.totalSize)}</span>
            </div>
            <Progress value={compressionRatio} className="h-2" />
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Space Saved: {formatFileSize(spaceSaved)}</span>
              <span>Reduction: {imageData.processing.compressionRatio}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(imageData.variants).map(([variantName, variant]) => (
              <div key={variantName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{variantName}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">WebP</Badge>
                    <Badge variant="outline">JPEG</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">WebP Format</p>
                    <p className="font-medium">{formatFileSize(variant.webp.size)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">JPEG Format</p>
                    <p className="font-medium">{formatFileSize(variant.jpeg.size)}</p>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  WebP is {((variant.jpeg.size - variant.webp.size) / variant.jpeg.size * 100).toFixed(1)}% smaller than JPEG
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      {imageData.metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Dimensions</p>
                <p className="font-medium">
                  {imageData.metadata.width} × {imageData.metadata.height}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Original Format</p>
                <p className="font-medium uppercase">{imageData.metadata.format}</p>
              </div>
              <div>
                <p className="text-gray-600">Color Space</p>
                <p className="font-medium">{imageData.metadata.colorSpace || 'sRGB'}</p>
              </div>
              <div>
                <p className="text-gray-600">Transparency</p>
                <p className="font-medium">{imageData.metadata.hasAlpha ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Multiple Format Support</p>
                <p className="text-gray-600">WebP for modern browsers, JPEG fallback for compatibility</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Responsive Variants</p>
                <p className="text-gray-600">Different sizes for different screen resolutions and use cases</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Bandwidth Savings</p>
                <p className="text-gray-600">Reduced file sizes mean faster loading times and lower data usage</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">SEO Benefits</p>
                <p className="text-gray-600">Faster loading images improve page speed scores</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};