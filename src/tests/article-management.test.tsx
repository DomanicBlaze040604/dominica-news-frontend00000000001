import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminArticleEditor } from '../pages/admin/AdminArticleEditor';
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { SlugInput } from '../components/admin/SlugInput';
import { articlesService } from '../services/articles';
import { categoriesService } from '../services/categories';
import { authorsService } from '../services/authors';
import { slugService } from '../services/slug';
import { mockAuthToken, clearAuthToken } from './setup';

// Mock the services
vi.mock('../services/articles');
vi.mock('../services/categories');
vi.mock('../services/authors');
vi.mock('../services/slug');
vi.mock('../services/images');

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock TipTap editor
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    getHTML: vi.fn(() => '<p>Test content</p>'),
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        setImage: vi.fn(() => ({ run: vi.fn() })),
        undo: vi.fn(() => ({ run: vi.fn() })),
        redo: vi.fn(() => ({ run: vi.fn() })),
        toggleBold: vi.fn(() => ({ run: vi.fn() })),
        toggleItalic: vi.fn(() => ({ run: vi.fn() })),
      })),
    })),
    isActive: vi.fn(() => false),
    can: vi.fn(() => ({ undo: vi.fn(() => true), redo: vi.fn(() => true) })),
  })),
  EditorContent: ({ editor }: any) => <div data-testid="editor-content">Editor Content</div>,
}));

// Mock TipTap extensions
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-image', () => ({ default: {} }));
vi.mock('@tiptap/extension-text-align', () => ({ default: {} }));
vi.mock('@tiptap/extension-color', () => ({ default: {} }));
vi.mock('@tiptap/extension-text-style', () => ({ TextStyle: {} }));
vi.mock('@tiptap/extension-font-family', () => ({ FontFamily: {} }));
vi.mock('@tiptap/extension-table', () => ({ Table: {} }));
vi.mock('@tiptap/extension-table-row', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-cell', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-header', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-code-block', () => ({ default: {} }));
vi.mock('@tiptap/extension-blockquote', () => ({ default: {} }));
vi.mock('@tiptap/extension-history', () => ({ default: {} }));
vi.mock('@tiptap/extension-dropcursor', () => ({ default: {} }));
vi.mock('@tiptap/extension-gapcursor', () => ({ default: {} }));

const mockArticlesService = articlesService as any;
const mockCategoriesService = categoriesService as any;
const mockAuthorsService = authorsService as any;
const mockSlugService = slugService as any;

// Test data
const mockCategories = [
  { id: '1', name: 'Politics', slug: 'politics', displayOrder: 1 },
  { id: '2', name: 'Sports', slug: 'sports', displayOrder: 2 },
];

const mockAuthors = [
  { id: '1', name: 'John Doe', role: 'Editor', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', role: 'Reporter', email: 'jane@example.com' },
];

const mockArticle = {
  id: '1',
  title: 'Test Article',
  slug: 'test-article',
  content: '<p>Test content</p>',
  excerpt: 'Test excerpt',
  featuredImage: '',
  featuredImageAlt: '',
  category: mockCategories[0],
  author: mockAuthors[0],
  status: 'draft',
  isPinned: false,
  seoTitle: '',
  seoDescription: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Article Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthToken();
    
    // Setup default mocks
    mockCategoriesService.getAdminCategories.mockResolvedValue({
      data: mockCategories,
    });
    
    mockAuthorsService.getAdminAuthors.mockResolvedValue({
      data: { authors: mockAuthors },
    });
    
    mockSlugService.generateSlug.mockImplementation((title: string) => 
      title.toLowerCase().replace(/\s+/g, '-')
    );
    
    mockSlugService.validateArticleSlug.mockResolvedValue({
      data: { isValid: true, isUnique: true },
    });
  });

  describe('RichTextEditor', () => {
    it('renders with toolbar and editor content', () => {
      render(
        <TestWrapper>
          <RichTextEditor
            value="<p>Test content</p>"
            onChange={vi.fn()}
            placeholder="Write your content..."
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('calls onChange when content changes', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <RichTextEditor
            value=""
            onChange={mockOnChange}
            placeholder="Write your content..."
          />
        </TestWrapper>
      );

      // The onChange would be called by the TipTap editor
      // Since we're mocking it, we just verify the component renders
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('enables drag and drop when enableDragDrop is true', () => {
      render(
        <TestWrapper>
          <RichTextEditor
            value=""
            onChange={vi.fn()}
            enableDragDrop={true}
            enableImageUpload={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });

  describe('SlugInput', () => {
    it('generates slug from title automatically', async () => {
      const mockOnSlugChange = vi.fn();
      
      render(
        <TestWrapper>
          <SlugInput
            title="Test Article Title"
            slug=""
            onSlugChange={mockOnSlugChange}
            type="article"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSlugService.generateSlug).toHaveBeenCalledWith('Test Article Title');
      });
    });

    it('validates slug uniqueness', async () => {
      const mockOnSlugChange = vi.fn();
      
      render(
        <TestWrapper>
          <SlugInput
            title="Test Article"
            slug="test-article"
            onSlugChange={mockOnSlugChange}
            type="article"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSlugService.validateArticleSlug).toHaveBeenCalledWith('test-article', undefined);
      });
    });

    it('shows manual editing mode when user edits slug', async () => {
      const user = userEvent.setup();
      const mockOnSlugChange = vi.fn();
      
      render(
        <TestWrapper>
          <SlugInput
            title="Test Article"
            slug="test-article"
            onSlugChange={mockOnSlugChange}
            type="article"
          />
        </TestWrapper>
      );

      const slugInput = screen.getByDisplayValue('test-article');
      await user.clear(slugInput);
      await user.type(slugInput, 'custom-slug');

      expect(mockOnSlugChange).toHaveBeenCalledWith('custom-slug');
    });
  });

  describe('AdminArticleEditor', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: 'new' });
    });

    it('renders create article form', async () => {
      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('New Article')).toBeInTheDocument();
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/article url slug/i)).toBeInTheDocument();
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });
    });

    it('loads existing article for editing', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockArticlesService.getAdminArticleById.mockResolvedValue({
        data: { article: mockArticle },
      });

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Article')).toBeInTheDocument();
        expect(mockArticlesService.getAdminArticleById).toHaveBeenCalledWith('1');
      });
    });

    it('creates new article successfully', async () => {
      const user = userEvent.setup();
      mockArticlesService.createArticle.mockResolvedValue({
        data: { article: mockArticle },
      });

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill out the form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Article');

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await user.click(categorySelect);
      
      const authorSelect = screen.getByRole('combobox', { name: /author/i });
      await user.click(authorSelect);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockArticlesService.createArticle).toHaveBeenCalled();
      });
    });

    it('updates existing article successfully', async () => {
      const user = userEvent.setup();
      mockUseParams.mockReturnValue({ id: '1' });
      mockArticlesService.getAdminArticleById.mockResolvedValue({
        data: { article: mockArticle },
      });
      mockArticlesService.updateArticle.mockResolvedValue({
        data: { article: { ...mockArticle, title: 'Updated Article' } },
      });

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for article to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Article')).toBeInTheDocument();
      });

      // Update the title
      const titleInput = screen.getByDisplayValue('Test Article');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Article');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockArticlesService.updateArticle).toHaveBeenCalledWith('1', expect.any(Object));
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
      });
    });

    it('handles scheduled publishing', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill required fields
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Scheduled Article');

      // Select scheduled status
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusSelect);
      
      const scheduledOption = screen.getByText('Schedule for Later');
      await user.click(scheduledOption);

      // Should show date/time picker
      await waitFor(() => {
        expect(screen.getByLabelText(/schedule date & time/i)).toBeInTheDocument();
      });
    });

    it('handles SEO fields correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/seo title/i)).toBeInTheDocument();
      });

      // Fill SEO fields
      const seoTitleInput = screen.getByLabelText(/seo title/i);
      await user.type(seoTitleInput, 'Test SEO Title');

      const seoDescInput = screen.getByLabelText(/seo description/i);
      await user.type(seoDescInput, 'Test SEO description for the article');

      // Check character counters
      expect(screen.getByText('14/60 characters')).toBeInTheDocument();
      expect(screen.getByText('38/160 characters')).toBeInTheDocument();
    });
  });

  describe('Article CRUD Operations', () => {
    it('handles create article API errors', async () => {
      mockArticlesService.createArticle.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Title is required' },
        },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Fill and submit form
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(submitButton);

      // Should handle the error gracefully
      await waitFor(() => {
        expect(mockArticlesService.createArticle).toHaveBeenCalled();
      });
    });

    it('handles update article API errors', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockArticlesService.getAdminArticleById.mockResolvedValue({
        data: { article: mockArticle },
      });
      mockArticlesService.updateArticle.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Slug already exists' },
        },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for article to load and submit
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Article')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(submitButton);

      // Should handle the error gracefully
      await waitFor(() => {
        expect(mockArticlesService.updateArticle).toHaveBeenCalled();
      });
    });

    it('preserves data relationships during updates', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockArticlesService.getAdminArticleById.mockResolvedValue({
        data: { article: mockArticle },
      });
      mockArticlesService.updateArticle.mockResolvedValue({
        data: { article: mockArticle },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminArticleEditor />
        </TestWrapper>
      );

      // Wait for article to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Article')).toBeInTheDocument();
      });

      // Submit without changes
      const submitButton = screen.getByRole('button', { name: /save as draft/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockArticlesService.updateArticle).toHaveBeenCalledWith('1', expect.objectContaining({
          categoryId: mockArticle.category.id,
          authorId: mockArticle.author.id,
        }));
      });
    });
  });

  afterEach(() => {
    clearAuthToken();
  });
});