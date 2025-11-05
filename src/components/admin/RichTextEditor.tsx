import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { ResizableImage } from './extensions/ResizableImage';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import History from '@tiptap/extension-history';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Type,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Upload
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ImageGalleryPicker } from './ImageGalleryPicker';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  enableImageUpload?: boolean;
  enableDragDrop?: boolean;
  enableGalleryPicker?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  height = "400px",
  enableImageUpload = false,
  enableDragDrop = false,
  enableGalleryPicker = true,
  onImageUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable conflicting extensions from StarterKit
        dropcursor: false,
        gapcursor: false,
      }),
      History.configure({
        depth: 100,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      ResizableImage.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'editor-code-block',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'editor-blockquote',
        },
      }),
      Dropcursor,
      Gapcursor,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none editor-content',
        style: `min-height: ${height}; padding: 16px;`,
      },
      handleDrop: enableDragDrop ? (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      } : undefined,
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    
    try {
      let url: string;
      
      if (onImageUpload) {
        // Use custom upload handler if provided
        url = await onImageUpload(file);
      } else {
        // Use default image service
        const { imagesService } = await import('../../services/images');
        const response = await imagesService.uploadImage(file);
        url = response.data.image.urls?.medium || response.data.image.url;
      }
      
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
      // Show error toast
      const { toast } = await import('sonner');
      toast.error('Failed to upload image. Please try again.');
    }
  }, [editor, onImageUpload]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  const addImage = useCallback(() => {
    if (enableImageUpload && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      const url = window.prompt('Enter image URL:');
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, enableImageUpload]);

  const openGalleryPicker = useCallback(() => {
    setShowGalleryPicker(true);
  }, []);

  const handleGalleryImageSelect = useCallback((imageUrl: string, altText: string, imageData?: any) => {
    if (editor) {
      editor.chain().focus().setImage({ 
        src: imageUrl, 
        alt: altText,
        title: imageData?.originalName || altText
      }).run();
    }
    setShowGalleryPicker(false);
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const setFontFamily = useCallback((fontFamily: string) => {
    if (!editor) return;
    if (fontFamily === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(fontFamily).run();
    }
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Font Family */}
          <Select onValueChange={setFontFamily}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Courier New">Courier</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
            </SelectContent>
          </Select>

          {/* Headings */}
          <Select onValueChange={(value) => {
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Normal</SelectItem>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>

          <div className="border-r border-gray-300 pr-2 mr-2" />

          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-8 gap-1">
                {[
                  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#FFFFFF',
                  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669', '#0D9488',
                  '#0891B2', '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="border-r border-gray-300 pr-2 mr-2" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-r border-gray-300 pr-2 mr-2" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-r border-gray-300 pr-2 mr-2" />

          {/* Special Elements */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLink}
              className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <Link className="h-4 w-4" />
            </Button>
            {/* Image insertion options */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  {enableGalleryPicker && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={openGalleryPicker}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      From Gallery
                    </Button>
                  )}
                  {enableImageUpload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addImage}
                      className="w-full justify-start"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = window.prompt('Enter image URL:');
                      if (url && editor) {
                        editor.chain().focus().setImage({ src: url }).run();
                      }
                    }}
                    className="w-full justify-start"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    From URL
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertTable}
              className="h-8 w-8 p-0"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="rich-text-content"
          style={{ minHeight: height }}
        />
        {enableImageUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}
      </div>

      {/* Image Gallery Picker */}
      {enableGalleryPicker && (
        <ImageGalleryPicker
          isOpen={showGalleryPicker}
          onClose={() => setShowGalleryPicker(false)}
          onImageSelect={handleGalleryImageSelect}
          allowMultiple={false}
        />
      )}

      {/* Custom Styles */}
      <style>{`
        .rich-text-content .ProseMirror {
          outline: none;
          padding: 16px;
          min-height: ${height};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }

        .rich-text-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        .rich-text-content .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }

        .rich-text-content .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }

        .rich-text-content .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }

        .rich-text-content .ProseMirror h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0;
        }

        .rich-text-content .ProseMirror h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.17em 0;
        }

        .rich-text-content .ProseMirror h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 1.33em 0;
        }

        .rich-text-content .ProseMirror .editor-blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
        }

        .rich-text-content .ProseMirror .editor-code-block {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 12px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        .rich-text-content .ProseMirror .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em 0;
        }

        .rich-text-content .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .rich-text-content .ProseMirror a:hover {
          color: #1d4ed8;
        }

        .rich-text-content .ProseMirror ul,
        .rich-text-content .ProseMirror ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        .rich-text-content .ProseMirror li {
          margin: 0.25em 0;
        }

        .rich-text-content .ProseMirror strong {
          font-weight: 600;
        }

        .rich-text-content .ProseMirror em {
          font-style: italic;
        }

        .rich-text-content .ProseMirror u {
          text-decoration: underline;
        }

        .rich-text-content .ProseMirror s {
          text-decoration: line-through;
        }

        .rich-text-content .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          table-layout: fixed;
        }

        .rich-text-content .ProseMirror table td,
        .rich-text-content .ProseMirror table th {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
          position: relative;
        }

        .rich-text-content .ProseMirror table th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        .rich-text-content .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }

        .rich-text-content .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }

        .rich-text-content .ProseMirror.resize-cursor {
          cursor: ew-resize;
          cursor: col-resize;
        }

        /* Drag and drop styles */
        .rich-text-content .ProseMirror .ProseMirror-dropcursor {
          position: relative;
          pointer-events: none;
        }

        .rich-text-content .ProseMirror .ProseMirror-dropcursor:after {
          content: '';
          display: block;
          position: absolute;
          left: -8px;
          right: -8px;
          top: -2px;
          bottom: -2px;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.1);
          border: 2px solid #3b82f6;
        }

        /* Image drag over feedback */
        .rich-text-content .ProseMirror.drag-over-image {
          background: rgba(59, 130, 246, 0.05);
          border: 2px dashed #3b82f6;
          border-radius: 4px;
        }

        .rich-text-content .ProseMirror.drag-over-image:before {
          content: 'Drop image here to insert';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          z-index: 10;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};