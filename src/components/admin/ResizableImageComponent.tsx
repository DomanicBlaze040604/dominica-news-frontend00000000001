import React, { useState, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Move, RotateCcw, Trash2, AlignLeft, AlignCenter, AlignRight, Maximize2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResizableImageComponentProps {
  node: {
    attrs: {
      src: string;
      alt?: string;
      title?: string;
      width?: number;
      height?: number;
      style?: string;
      align?: 'left' | 'center' | 'right';
      float?: 'left' | 'right' | 'none';
    };
  };
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  selected: boolean;
}

export const ResizableImageComponent: React.FC<ResizableImageComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);

  const { src, alt, title, width, height, align = 'left', float = 'none' } = node.attrs;

  const handleMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    setIsResizing(true);
    
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      let newWidth = dragStart.width;
      let newHeight = dragStart.height;

      switch (corner) {
        case 'se': // Southeast corner
          newWidth = Math.max(50, dragStart.width + deltaX);
          newHeight = Math.max(50, dragStart.height + deltaY);
          break;
        case 'sw': // Southwest corner
          newWidth = Math.max(50, dragStart.width - deltaX);
          newHeight = Math.max(50, dragStart.height + deltaY);
          break;
        case 'ne': // Northeast corner
          newWidth = Math.max(50, dragStart.width + deltaX);
          newHeight = Math.max(50, dragStart.height - deltaY);
          break;
        case 'nw': // Northwest corner
          newWidth = Math.max(50, dragStart.width - deltaX);
          newHeight = Math.max(50, dragStart.height - deltaY);
          break;
      }

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dragStart, updateAttributes]);

  const resetSize = useCallback(() => {
    updateAttributes({
      width: null,
      height: null,
    });
  }, [updateAttributes]);

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  const setAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    updateAttributes({ align: alignment, float: 'none' });
  }, [updateAttributes]);

  const setFloat = useCallback((floatValue: 'left' | 'right' | 'none') => {
    updateAttributes({ float: floatValue, align: floatValue === 'none' ? 'left' : floatValue });
  }, [updateAttributes]);

  const setPresetSize = useCallback((size: string) => {
    const img = imageRef.current;
    if (!img) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const aspectRatio = naturalWidth / naturalHeight;

    let newWidth: number;
    let newHeight: number;

    switch (size) {
      case 'small':
        newWidth = Math.min(300, naturalWidth);
        newHeight = newWidth / aspectRatio;
        break;
      case 'medium':
        newWidth = Math.min(600, naturalWidth);
        newHeight = newWidth / aspectRatio;
        break;
      case 'large':
        newWidth = Math.min(900, naturalWidth);
        newHeight = newWidth / aspectRatio;
        break;
      case 'full':
        newWidth = naturalWidth;
        newHeight = naturalHeight;
        break;
      default:
        return;
    }

    updateAttributes({
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    });
  }, [updateAttributes]);

  const applyCustomSize = useCallback(() => {
    const w = parseInt(customWidth);
    const h = parseInt(customHeight);
    
    if (w > 0 && h > 0) {
      updateAttributes({ width: w, height: h });
    } else if (w > 0) {
      // Maintain aspect ratio
      const img = imageRef.current;
      if (img) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        updateAttributes({ width: w, height: Math.round(w / aspectRatio) });
      }
    }
    
    setCustomWidth('');
    setCustomHeight('');
    setShowSettings(false);
  }, [customWidth, customHeight, updateAttributes]);

  // Calculate container styles based on alignment and float
  const getContainerStyles = () => {
    const styles: React.CSSProperties = {
      width: width ? `${width}px` : 'auto',
      height: height ? `${height}px` : 'auto',
    };

    if (float === 'left') {
      styles.float = 'left';
      styles.marginRight = '16px';
      styles.marginBottom = '8px';
    } else if (float === 'right') {
      styles.float = 'right';
      styles.marginLeft = '16px';
      styles.marginBottom = '8px';
    } else if (align === 'center') {
      styles.display = 'block';
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
    } else if (align === 'right') {
      styles.display = 'block';
      styles.marginLeft = 'auto';
    }

    return styles;
  };

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div 
        className={`relative group ${selected ? 'selected' : ''} ${float !== 'none' ? 'float-image' : 'block-image'}`}
        style={getContainerStyles()}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="max-w-full h-auto rounded border"
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
            objectFit: 'contain',
          }}
          draggable={false}
        />

        {/* Selection overlay and controls */}
        {selected && (
          <>
            {/* Resize handles */}
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
            
            {/* Corner resize handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />

            {/* Enhanced Toolbar */}
            <div className="absolute -top-12 left-0 flex items-center gap-1 bg-white border border-gray-200 rounded shadow-lg p-1">
              {/* Alignment Controls */}
              <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1 mr-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment('left')}
                  className={`h-6 w-6 p-0 ${align === 'left' && float === 'none' ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Align left"
                >
                  <AlignLeft className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment('center')}
                  className={`h-6 w-6 p-0 ${align === 'center' ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Align center"
                >
                  <AlignCenter className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment('right')}
                  className={`h-6 w-6 p-0 ${align === 'right' && float === 'none' ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Align right"
                >
                  <AlignRight className="h-3 w-3" />
                </Button>
              </div>

              {/* Float Controls */}
              <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1 mr-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFloat('left')}
                  className={`h-6 w-6 p-0 ${float === 'left' ? 'bg-green-100 text-green-600' : ''}`}
                  title="Float left"
                >
                  <div className="text-xs font-bold">L</div>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFloat('right')}
                  className={`h-6 w-6 p-0 ${float === 'right' ? 'bg-green-100 text-green-600' : ''}`}
                  title="Float right"
                >
                  <div className="text-xs font-bold">R</div>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFloat('none')}
                  className={`h-6 w-6 p-0 ${float === 'none' ? 'bg-gray-100' : ''}`}
                  title="No float"
                >
                  <div className="text-xs font-bold">×</div>
                </Button>
              </div>

              {/* Size Presets */}
              <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1 mr-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPresetSize('small')}
                  className="h-6 px-1 text-xs"
                  title="Small (300px)"
                >
                  S
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPresetSize('medium')}
                  className="h-6 px-1 text-xs"
                  title="Medium (600px)"
                >
                  M
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPresetSize('large')}
                  className="h-6 px-1 text-xs"
                  title="Large (900px)"
                >
                  L
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPresetSize('full')}
                  className="h-6 w-6 p-0"
                  title="Full size"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Settings */}
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title="Custom size"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Custom Size</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <Input
                            placeholder="Width"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Height"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyCustomSize}
                      className="w-full h-7 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Reset and Delete */}
              <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1 ml-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetSize}
                  className="h-6 w-6 p-0"
                  title="Reset size"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  title="Delete image"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Enhanced Size and Position indicator */}
            <div className="absolute -bottom-8 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {width || 'auto'} × {height || 'auto'}
              {float !== 'none' && (
                <span className="ml-2 text-yellow-300">Float: {float}</span>
              )}
              {align !== 'left' && float === 'none' && (
                <span className="ml-2 text-blue-300">Align: {align}</span>
              )}
            </div>
          </>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 pointer-events-none" />
      </div>

      <style>{`
        .resizable-image-wrapper {
          display: inline-block;
          position: relative;
        }

        .resizable-image-wrapper.selected {
          outline: none;
        }

        .resizable-image-wrapper img {
          display: block;
        }

        .resizable-image-wrapper .resize-handle {
          position: absolute;
          background: #3b82f6;
          border: 1px solid white;
          width: 8px;
          height: 8px;
          z-index: 10;
        }

        .resizable-image-wrapper .resize-handle:hover {
          background: #1d4ed8;
        }
      `}</style>
    </NodeViewWrapper>
  );
};