import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  Edit, 
  Tag, 
  FileText, 
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageMetadataEditorProps {
  image: {
    id: string;
    filename: string;
    originalName: string;
    altText?: string;
    title?: string;
    description?: string;
    tags?: string[];
    caption?: string;
    credit?: string;
    copyright?: string;
    uploadedAt: string;
    metadata?: {
      width?: number;
      height?: number;
      format?: string;
      colorSpace?: string;
    };
  };
  onSave: (updatedMetadata: any) => Promise<void>;
  onCancel: () => void;
}

export const ImageMetadataEditor: React.FC<ImageMetadataEditorProps> = ({
  image,
  onSave,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    altText: image.altText || '',
    title: image.title || image.originalName,
    description: image.description || '',
    caption: image.caption || '',
    credit: image.credit || '',
    copyright: image.copyright || '',
    tags: image.tags?.join(', ') || ''
  });

  const handleSave = async () => {
    if (!formData.altText.trim()) {
      toast.error('Alt text is required for accessibility');
      return;
    }

    if (formData.altText.trim().length < 3) {
      toast.error('Alt text must be at least 3 characters long');
      return;
    }

    setIsSaving(true);
    try {
      const updatedMetadata = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      };

      await onSave(updatedMetadata);
      setIsEditing(false);
      toast.success('Image metadata updated successfully');
    } catch (error: any) {
      console.error('Error saving metadata:', error);
      toast.error(error.message || 'Failed to update image metadata');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      altText: image.altText || '',
      title: image.title || image.originalName,
      description: image.description || '',
      caption: image.caption || '',
      credit: image.credit || '',
      copyright: image.copyright || '',
      tags: image.tags?.join(', ') || ''
    });
    setIsEditing(false);
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Image Metadata
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Filename</p>
            <p className="text-gray-600">{image.filename}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Original Name</p>
            <p className="text-gray-600">{image.originalName}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Uploaded</p>
            <p className="text-gray-600">
              {new Date(image.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          {image.metadata && (
            <div>
              <p className="font-medium text-gray-700">Dimensions</p>
              <p className="text-gray-600">
                {image.metadata.width} × {image.metadata.height}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Editable Metadata */}
        <div className="space-y-4">
          {/* Alt Text */}
          <div>
            <Label htmlFor="altText" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Alt Text <span className="text-red-500">*</span>
            </Label>
            {isEditing ? (
              <Input
                id="altText"
                value={formData.altText}
                onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                placeholder="Describe the image for accessibility..."
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {image.altText || 'No alt text provided'}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Required for accessibility. Describe what's in the image.
            </p>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            {isEditing ? (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Image title..."
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {image.title || image.originalName}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the image..."
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded min-h-[60px]">
                {image.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Caption</Label>
            {isEditing ? (
              <Input
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Image caption for display..."
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {image.caption || 'No caption provided'}
              </p>
            )}
          </div>

          {/* Credit */}
          <div>
            <Label htmlFor="credit" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Credit/Attribution
            </Label>
            {isEditing ? (
              <Input
                id="credit"
                value={formData.credit}
                onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                placeholder="Photo credit or attribution..."
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {image.credit || 'No credit provided'}
              </p>
            )}
          </div>

          {/* Copyright */}
          <div>
            <Label htmlFor="copyright">Copyright</Label>
            {isEditing ? (
              <Input
                id="copyright"
                value={formData.copyright}
                onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
                placeholder="Copyright information..."
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {image.copyright || 'No copyright information'}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            {isEditing ? (
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags..."
                className="mt-1"
              />
            ) : (
              <div className="mt-1">
                {image.tags && image.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {image.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    No tags added
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};