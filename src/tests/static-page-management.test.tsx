import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminStaticPages } from '../pages/admin/AdminStaticPages';
import { staticPagesService } from '../services/staticPages';
import { slugService } from '../services/slug';
import { mockAuthToken, clearAuthToken } from './setup';
import { afterEach } from 'node:test';

// Mock the services
vi.mock('../services/staticPages');
vi.mock('../services/slug');

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockStaticPagesService = staticPagesService as {
  getAdminPages: Mock;
  createPage: Mock;
  updatePage: Mock;
  deletePage: Mock;
  getMenuPages: Mock;
  reorderMenuPages: Mock;
};

const mockSlugService = slugService as {
  generateSlug: Mock;
  validateStaticPageSlug: Mock;
  generateUniqueSlug: Mock;
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

// Mock data
const mockStaticPages = [
  {
    id: '1',
    title: 'About Us',
    slug: 'about-us',
    content: '<h1>About Us</h1><p>Welcome to our website.</p>',
    metaTitle: 'About Us - Test Site',
    metaDescription: 'Learn about our company',
    template: 'about',
    showInMenu: true,
    menuOrder: 1,
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Contact Us',
    slug: 'contact-us',
    content: '<h1>Contact Us</h1><p>Get in touch with us.</p>',
    metaTitle: 'Contact Us - Test Site',
    metaDescription: 'Contact our team',
    template: 'contact',
    showInMenu: true,
    menuOrder: 2,
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: '<h1>Privacy Policy</h1><p>Our privacy policy.</p>',
    metaTitle: 'Privacy Policy - Test Site',
    metaDescription: 'Read our privacy policy',
    template: 'privacy',
    showInMenu: false,
    menuOrder: 0,
    isPublished: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('Static Page Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthToken();

    // Setup default mock responses
    mockStaticPagesService.getAdminPages.mockResolvedValue({
      success: true,
      data: {
        data: mockStaticPages,
        pagination: {
          current: 1,
          pages: 1,
          total: mockStaticPages.length,
          limit: 10,
        },
      },
    });

    mockSlugService.generateSlug.mockImplementation((title: string) => 
      title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    );

    mockSlugService.validateStaticPageSlug.mockResolvedValue({
      success: true,
      data: {
        isValid: true,
        isUnique: true,
      },
    });
  });

  afterEach(() => {
    clearAuthToken();
  });

  describe('Static Pages List', () => {
    it('should render static pages list', async () => {
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Static Pages')).toBeInTheDocument();
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      });
    });

    it('should show page status badges correctly', async () => {
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        const publishedBadges = screen.getAllByText('Published');
        const draftBadges = screen.getAllByText('Draft');
        
        expect(publishedBadges).toHaveLength(2); // About Us and Contact Us
        expect(draftBadges).toHaveLength(1); // Privacy Policy
      });
    });

    it('should show menu status correctly', async () => {
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        const inMenuBadges = screen.getAllByText('In Menu');
        const hiddenBadges = screen.getAllByText('Hidden');
        
        expect(inMenuBadges).toHaveLength(2); // About Us and Contact Us
        expect(hiddenBadges).toHaveLength(1); // Privacy Policy
      });
    });

    it('should filter pages by search term', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search pages...');
      await user.type(searchInput, 'about');

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.queryByText('Contact Us')).not.toBeInTheDocument();
      });
    });

    it('should filter pages by published status', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      });

      const publishedOnlySwitch = screen.getByLabelText('Published only');
      await user.click(publishedOnlySwitch);

      await waitFor(() => {
        expect(mockStaticPagesService.getAdminPages).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Create Static Page', () => {
    it('should open create dialog when New Page button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      const newPageButton = screen.getByText('New Page');
      await user.click(newPageButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Static Page')).toBeInTheDocument();
        expect(screen.getByLabelText('Page Title *')).toBeInTheDocument();
        expect(screen.getByLabelText('Page Content *')).toBeInTheDocument();
      });
    });

    it('should create a new static page successfully', async () => {
      const user = userEvent.setup();
      
      mockStaticPagesService.createPage.mockResolvedValue({
        success: true,
        data: {
          id: '4',
          title: 'New Page',
          slug: 'new-page',
          content: '<p>New page content</p>',
          isPublished: true,
        },
      });

      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      const newPageButton = screen.getByText('New Page');
      await user.click(newPageButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Static Page')).toBeInTheDocument();
      });

      // Fill in the form
      const titleInput = screen.getByLabelText('Page Title *');
      const contentTextarea = screen.getByLabelText('Page Content *');
      
      await user.type(titleInput, 'New Page');
      await user.type(contentTextarea, '<p>New page content</p>');

      // Submit the form
      const createButton = screen.getByText('Create Page');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockStaticPagesService.createPage).toHaveBeenCalledWith({
          title: 'New Page',
          slug: 'new-page',
          content: '<p>New page content</p>',
          metaTitle: '',
          metaDescription: '',
          template: 'default',
          showInMenu: false,
          menuOrder: 0,
          isPublished: true,
        });
      });
    });

    it('should show validation errors for invalid input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      const newPageButton = screen.getByText('New Page');
      await user.click(newPageButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Static Page')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const createButton = screen.getByText('Create Page');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Title must be at least 2 characters')).toBeInTheDocument();
        expect(screen.getByText('Content must be at least 10 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Static Page', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('title') !== 'View page'
      );
      
      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText('Edit Static Page')).toBeInTheDocument();
          expect(screen.getByDisplayValue('About Us')).toBeInTheDocument();
        });
      }
    });

    it('should update static page successfully', async () => {
      const user = userEvent.setup();
      
      mockStaticPagesService.updatePage.mockResolvedValue({
        success: true,
        data: {
          ...mockStaticPages[0],
          title: 'Updated About Us',
        },
      });

      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('title') !== 'View page'
      );
      
      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByDisplayValue('About Us')).toBeInTheDocument();
        });

        const titleInput = screen.getByDisplayValue('About Us');
        await user.clear(titleInput);
        await user.type(titleInput, 'Updated About Us');

        const updateButton = screen.getByText('Update Page');
        await user.click(updateButton);

        await waitFor(() => {
          expect(mockStaticPagesService.updatePage).toHaveBeenCalledWith('1', expect.objectContaining({
            title: 'Updated About Us',
          }));
        });
      }
    });
  });

  describe('Delete Static Page', () => {
    it('should delete static page after confirmation', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      mockStaticPagesService.deletePage.mockResolvedValue({
        success: true,
        data: { message: 'Page deleted successfully' },
      });

      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.className.includes('text-red-600')
      );
      
      if (deleteButton) {
        await user.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to delete this page? This action cannot be undone.'
        );

        await waitFor(() => {
          expect(mockStaticPagesService.deletePage).toHaveBeenCalledWith('1');
        });
      }

      confirmSpy.mockRestore();
    });

    it('should not delete static page if confirmation is cancelled', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.className.includes('text-red-600')
      );
      
      if (deleteButton) {
        await user.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockStaticPagesService.deletePage).not.toHaveBeenCalled();
      }

      confirmSpy.mockRestore();
    });
  });

  describe('Template Selection', () => {
    it('should show template selection in create form', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      const newPageButton = screen.getByText('New Page');
      await user.click(newPageButton);

      await waitFor(() => {
        expect(screen.getByText('Page Template')).toBeInTheDocument();
      });
    });

    it('should create page with selected template', async () => {
      const user = userEvent.setup();
      
      mockStaticPagesService.createPage.mockResolvedValue({
        success: true,
        data: {
          id: '4',
          title: 'About Page',
          slug: 'about-page',
          content: '<p>About content</p>',
          template: 'about',
          isPublished: true,
        },
      });

      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      const newPageButton = screen.getByText('New Page');
      await user.click(newPageButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Static Page')).toBeInTheDocument();
      });

      // Fill in the form
      const titleInput = screen.getByLabelText('Page Title *');
      const contentTextarea = screen.getByLabelText('Page Content *');
      
      await user.type(titleInput, 'About Page');
      await user.type(contentTextarea, '<p>About content</p>');

      // Select template
      const templateSelect = screen.getByRole('combobox');
      await user.click(templateSelect);
      
      await waitFor(async () => {
        const aboutOption = screen.getByText('About Page');
        await user.click(aboutOption);
      });

      // Submit the form
      const createButton = screen.getByText('Create Page');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockStaticPagesService.createPage).toHaveBeenCalledWith(
          expect.objectContaining({
            template: 'about',
          })
        );
      });
    });
  });

  describe('Menu Integration', () => {
    it('should show menu order button', async () => {
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Menu Order')).toBeInTheDocument();
      });
    });

    it('should toggle menu reorder interface', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminStaticPages />
        </TestWrapper>
      );

      const menuOrderButton = screen.getByText('Menu Order');
      await user.click(menuOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Menu Order Management')).toBeInTheDocument();
      });
    });
  });
});