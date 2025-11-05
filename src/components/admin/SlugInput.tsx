import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Edit, Lock, Unlock } from 'lucide-react';
import { slugService, SlugValidationResponse } from '../../services/slug';
import { toast } from 'sonner';

interface SlugInputProps {
  title: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  type: 'article' | 'category' | 'author' | 'static-page';
  excludeId?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export const SlugInput: React.FC<SlugInputProps> = ({
  title,
  slug,
  onSlugChange,
  type,
  excludeId,
  disabled = false,
  label = 'URL Slug',
  placeholder = 'url-slug-will-be-generated',
}) => {
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<SlugValidationResponse | null>(null);
  const [localSlug, setLocalSlug] = useState(slug);

  // Debounced validation function
  const debouncedValidate = useCallback(
    slugService.debounce(async (slugToValidate: string) => {
      if (!slugToValidate.trim()) {
        setValidation(null);
        return;
      }

      setIsValidating(true);
      try {
        let result: { data: SlugValidationResponse };
        
        switch (type) {
          case 'article':
            result = await slugService.validateArticleSlug(slugToValidate, excludeId);
            break;
          case 'category':
            result = await slugService.validateCategorySlug(slugToValidate, excludeId);
            break;
          case 'author':
            result = await slugService.validateAuthorSlug(slugToValidate, excludeId);
            break;
          case 'static-page':
            result = await slugService.validateStaticPageSlug(slugToValidate, excludeId);
            break;
          default:
            throw new Error(`Unknown type: ${type}`);
        }
        
        setValidation(result.data);
      } catch (error) {
        console.error('Slug validation error:', error);
        setValidation({
          isValid: true,
          isUnique: true, // Assume it's unique if validation fails
        });
      } finally {
        setIsValidating(false);
      }
    }, 500),
    [type, excludeId]
  );

  // Auto-generate slug from title when not manually edited
  useEffect(() => {
    if (!isManuallyEdited && title.trim()) {
      const generatedSlug = slugService.generateSlug(title);
      setLocalSlug(generatedSlug);
      onSlugChange(generatedSlug);
      debouncedValidate(generatedSlug);
    }
  }, [title, isManuallyEdited, onSlugChange, debouncedValidate]);

  // Validate slug when it changes
  useEffect(() => {
    if (localSlug.trim()) {
      debouncedValidate(localSlug);
    }
  }, [localSlug, debouncedValidate]);

  const handleSlugChange = (value: string) => {
    setIsManuallyEdited(true);
    const cleanSlug = slugService.generateSlug(value);
    setLocalSlug(cleanSlug);
    onSlugChange(cleanSlug);
  };

  const handleRegenerate = () => {
    if (!title.trim()) {
      toast.error('Please enter a title first');
      return;
    }
    
    setIsManuallyEdited(false);
    const generatedSlug = slugService.generateSlug(title);
    setLocalSlug(generatedSlug);
    onSlugChange(generatedSlug);
    toast.success('Slug regenerated from title');
  };

  const handleToggleManualEdit = () => {
    setIsManuallyEdited(!isManuallyEdited);
    if (isManuallyEdited && title.trim()) {
      // Switching back to auto-generation
      const generatedSlug = slugService.generateSlug(title);
      setLocalSlug(generatedSlug);
      onSlugChange(generatedSlug);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />;
    }
    
    if (!validation) {
      return null;
    }
    
    if (validation.isUnique) {
      return <Check className="h-4 w-4 text-green-500" />;
    } else {
      return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getValidationMessage = () => {
    if (isValidating) {
      return 'Checking availability...';
    }
    
    if (!validation) {
      return null;
    }
    
    if (validation.isUnique) {
      return 'Slug is available';
    } else {
      return 'Slug is already in use';
    }
  };

  const getValidationColor = () => {
    if (isValidating) return 'text-gray-500';
    if (!validation) return 'text-gray-500';
    return validation.isUnique ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="slug">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant={isManuallyEdited ? 'default' : 'secondary'} className="text-xs">
            {isManuallyEdited ? (
              <>
                <Edit className="h-3 w-3 mr-1" />
                Manual
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto
              </>
            )}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleManualEdit}
            className="h-6 w-6 p-0"
            title={isManuallyEdited ? 'Switch to auto-generation' : 'Switch to manual editing'}
          >
            {isManuallyEdited ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </Button>
          {isManuallyEdited && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-6 w-6 p-0"
              title="Regenerate from title"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <Input
          id="slug"
          value={localSlug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || (!isManuallyEdited && !title?.trim())}
          className={`pr-10 ${
            validation && !validation.isUnique ? 'border-red-300 focus:border-red-500' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      
      {/* URL Preview */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">URL Preview:</span>{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
          /{type === 'article' ? 'articles' : 
            type === 'category' ? 'category' : 
            type === 'author' ? 'author' : 
            'page'}/{localSlug || 'your-slug-here'}
        </code>
      </div>
      
      {/* Validation Message */}
      {getValidationMessage() && (
        <p className={`text-sm ${getValidationColor()}`}>
          {getValidationMessage()}
        </p>
      )}
      
      {/* Suggestions */}
      {validation && validation.suggestions && validation.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Suggested alternatives:</p>
          <div className="flex flex-wrap gap-2">
            {validation.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalSlug(suggestion);
                  onSlugChange(suggestion);
                  setIsManuallyEdited(true);
                }}
                className="text-xs h-6"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Help Text */}
      <p className="text-xs text-gray-500">
        {isManuallyEdited 
          ? 'You are manually editing the slug. Click the lock icon to switch back to auto-generation.'
          : 'Slug is automatically generated from the title. Click the unlock icon to edit manually.'
        }
      </p>
    </div>
  );
};