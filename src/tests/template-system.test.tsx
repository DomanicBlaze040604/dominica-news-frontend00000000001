import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TemplateRenderer } from '../components/templates/TemplateRenderer';
import { DefaultTemplate } from '../components/templates/DefaultTemplate';
import { AboutTemplate } from '../components/templates/AboutTemplate';
import { ContactTemplate } from '../components/templates/ContactTemplate';
import { EditorialTemplate } from '../components/templates/EditorialTemplate';
import { LegalTemplate } from '../components/templates/LegalTemplate';
import { authorsService } from '../services/authors';

// Mock the services
vi.mock('../services/authors');

const mockAuthorsService = authorsService as {
  getAuthors: vi.Mock;
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

// Mock static page data
const mockStaticPage = {
  id: '1',
  title: 'Test Page',
  slug: 'test-page',
  content: '<h1>Test Page</h1><p>This is test content with <strong>formatting</strong>.</p>',
  metaTitle: 'Test Page - Test Site',
  metaDescription: 'A test page for testing templates',
  isPublished: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAuthors = [
  {
    id: '1',
    name: 'John Doe',
    slug: 'john-doe',
    email: 'john@example.com',
    role: 'Senior Editor',
    title: 'Chief Editor',
    biography: 'Experienced journalist with 10 years in the field.',
    specialization: ['Politics', 'Economics'],
    expertise: ['Government', 'Finance'],
    location: 'Roseau, Dominica',
    isActive: true,
    socialMedia: {
      twitter: '@johndoe',
      linkedin: 'johndoe',
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    slug: 'jane-smith',
    email: 'jane@example.com',
    role: 'Sports Reporter',
    title: 'Sports Correspondent',
    biography: 'Covers all major sporting events in the Caribbean.',
    specialization: ['Sports'],
    expertise: ['Football', 'Cricket'],
    location: 'Portsmouth, Dominica',
    isActive: true,
  },
];

describe('Template System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAuthorsService.getAuthors.mockResolvedValue({
      success: true,
      data: {
        authors: mockAuthors,
      },
    });
  });

  describe('TemplateRenderer', () => {
    it('should render DefaultTemplate for default template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'default' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText(/This is test content with/)).toBeInTheDocument();
    });

    it('should render AboutTemplate for about template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'about' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Stay Connected')).toBeInTheDocument();
    });

    it('should render ContactTemplate for contact template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'contact' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Send us a Message')).toBeInTheDocument();
    });

    it('should render EditorialTemplate for editorial template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'editorial' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Contact Our Editorial Team')).toBeInTheDocument();
    });

    it('should render LegalTemplate for privacy template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'privacy' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
      expect(screen.getByText('Questions or Concerns?')).toBeInTheDocument();
    });

    it('should render LegalTemplate for terms template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'terms' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
    });

    it('should fallback to DefaultTemplate for unknown template', () => {
      const pageWithTemplate = { ...mockStaticPage, template: 'unknown' };
      
      render(
        <TestWrapper>
          <TemplateRenderer page={pageWithTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should render DefaultTemplate when no template is specified', () => {
      render(
        <TestWrapper>
          <TemplateRenderer page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('DefaultTemplate', () => {
    it('should render page content with HTML', () => {
      render(
        <TestWrapper>
          <DefaultTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText(/This is test content with/)).toBeInTheDocument();
      expect(screen.getByText('formatting')).toBeInTheDocument();
    });

    it('should show last updated date', () => {
      render(
        <TestWrapper>
          <DefaultTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
    });
  });

  describe('AboutTemplate', () => {
    it('should render about page with stats cards', () => {
      render(
        <TestWrapper>
          <AboutTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('10+')).toBeInTheDocument();
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('5+')).toBeInTheDocument();
      expect(screen.getByText('Years Experience')).toBeInTheDocument();
    });

    it('should render call to action section', () => {
      render(
        <TestWrapper>
          <AboutTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Stay Connected')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('Meet Our Team')).toBeInTheDocument();
    });
  });

  describe('ContactTemplate', () => {
    it('should render contact information cards', () => {
      render(
        <TestWrapper>
          <ContactTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Email Us')).toBeInTheDocument();
      expect(screen.getByText('Call Us')).toBeInTheDocument();
      expect(screen.getByText('Visit Us')).toBeInTheDocument();
      expect(screen.getByText('Business Hours')).toBeInTheDocument();
    });

    it('should render contact form', () => {
      render(
        <TestWrapper>
          <ContactTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Send us a Message')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
      expect(screen.getByLabelText('Message *')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Message/ })).toBeInTheDocument();
    });
  });

  describe('EditorialTemplate', () => {
    it('should render editorial team content', async () => {
      render(
        <TestWrapper>
          <EditorialTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Contact Our Editorial Team')).toBeInTheDocument();
    });

    it('should load and display authors', async () => {
      render(
        <TestWrapper>
          <EditorialTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      // Wait for authors to load
      await screen.findByText('John Doe');
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Chief Editor')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Sports Correspondent')).toBeInTheDocument();
    });

    it('should group authors by department', async () => {
      render(
        <TestWrapper>
          <EditorialTemplate page={mockStaticPage} />
        </TestWrapper>
      );

      // Wait for authors to load
      await screen.findByText('John Doe');
      
      expect(screen.getByText('Editorial Leadership')).toBeInTheDocument();
      expect(screen.getByText('Sports')).toBeInTheDocument();
    });
  });

  describe('LegalTemplate', () => {
    it('should render privacy policy template', () => {
      render(
        <TestWrapper>
          <LegalTemplate page={mockStaticPage} type="privacy" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Learn how we collect, use, and protect your personal information')).toBeInTheDocument();
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
    });

    it('should render terms of service template', () => {
      render(
        <TestWrapper>
          <LegalTemplate page={mockStaticPage} type="terms" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Understand the rules and regulations for using our website')).toBeInTheDocument();
    });

    it('should show contact information for legal questions', () => {
      render(
        <TestWrapper>
          <LegalTemplate page={mockStaticPage} type="privacy" />
        </TestWrapper>
      );

      expect(screen.getByText('Questions or Concerns?')).toBeInTheDocument();
      expect(screen.getByText('legal@dominicanews.com')).toBeInTheDocument();
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
  });
});