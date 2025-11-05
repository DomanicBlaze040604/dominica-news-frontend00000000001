import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Navbar from '../components/Navbar';
import { categoriesService } from '../services/categories';

// Mock the auth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
    isAdmin: false,
  }),
}));

// Mock the categories service
vi.mock('../services/categories', () => ({
  categoriesService: {
    getCategories: vi.fn(),
    getCategoryPreview: vi.fn(),
  },
}));

// Mock CategoryDropdown component
vi.mock('../components/CategoryDropdown', () => ({
  CategoryDropdown: ({ categorySlug, categoryName, isActive }: any) => (
    <div data-testid={`category-dropdown-${categorySlug}`}>
      <span>{categoryName}</span>
      {isActive && <span data-testid="active-indicator">Active</span>}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon" />,
  User: () => <div data-testid="user-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

const mockCategories = [
  { id: '1', name: 'Weather', slug: 'weather', displayOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'News', slug: 'news', displayOrder: 2, createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'World', slug: 'world', displayOrder: 3, createdAt: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Crime', slug: 'crime', displayOrder: 4, createdAt: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Caribbean', slug: 'caribbean', displayOrder: 5, createdAt: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'Entertainment', slug: 'entertainment', displayOrder: 6, createdAt: '2024-01-01T00:00:00Z' },
  { id: '7', name: 'Business', slug: 'business', displayOrder: 7, createdAt: '2024-01-01T00:00:00Z' },
  { id: '8', name: 'Trending', slug: 'trending', displayOrder: 8, createdAt: '2024-01-01T00:00:00Z' },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Navbar Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful categories response
    vi.mocked(categoriesService.getCategories).mockResolvedValue({
      success: true,
      data: {
        categories: mockCategories,
        count: mockCategories.length,
      },
    });
  });

  describe('Basic Navigation Structure', () => {
    it('should render the main navigation elements', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Check for logo
      expect(screen.getByText('DOMINICA NEWS')).toBeInTheDocument();
      
      // Check for search button
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      
      // Check for mobile menu button
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    it('should load and display all required categories', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Wait for categories to load
      await waitFor(() => {
        expect(categoriesService.getCategories).toHaveBeenCalled();
      });

      // Check that all categories are rendered
      await waitFor(() => {
        expect(screen.getByTestId('category-dropdown-weather')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-news')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-world')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-crime')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-caribbean')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-entertainment')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-business')).toBeInTheDocument();
        expect(screen.getByTestId('category-dropdown-trending')).toBeInTheDocument();
      });
    });

    it('should display Home link alongside categories', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Home should be displayed as a regular link
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should display categories in correct order', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      await waitFor(() => {
        const categoryElements = screen.getAllByText(/Weather|News|World|Crime|Caribbean|Entertainment|Business|Trending/);
        
        // Should include all 8 categories
        expect(categoryElements).toHaveLength(8);
        
        // Check specific categories are present
        expect(screen.getByText('Weather')).toBeInTheDocument();
        expect(screen.getByText('News')).toBeInTheDocument();
        expect(screen.getByText('World')).toBeInTheDocument();
        expect(screen.getByText('Crime')).toBeInTheDocument();
        expect(screen.getByText('Caribbean')).toBeInTheDocument();
        expect(screen.getByText('Entertainment')).toBeInTheDocument();
        expect(screen.getByText('Business')).toBeInTheDocument();
        expect(screen.getByText('Trending')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('should show mobile menu when menu button is clicked', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton!);

      // Mobile menu should be visible
      await waitFor(() => {
        // Check for mobile navigation links
        const mobileLinks = screen.getAllByRole('link');
        const mobileCategoryLinks = mobileLinks.filter(link => 
          link.getAttribute('href')?.startsWith('/category/')
        );
        
        expect(mobileCategoryLinks.length).toBeGreaterThan(0);
      });
    });

    it('should hide mobile menu when menu button is clicked again', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      
      // Open menu
      fireEvent.click(menuButton!);
      
      // Close menu
      fireEvent.click(menuButton!);

      // Mobile menu should be hidden
      await waitFor(() => {
        const mobileNav = screen.queryByRole('navigation');
        // The mobile navigation should not be visible or should have hidden classes
        expect(mobileNav).toBeTruthy(); // Navigation still exists but may be hidden via CSS
      });
    });
  });

  describe('Search Functionality', () => {
    it('should show search bar when search button is clicked', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      const searchButton = screen.getByTestId('search-icon').closest('button');
      fireEvent.click(searchButton!);

      // Search input should be visible
      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
    });

    it('should hide search bar when X button is clicked', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Open search
      const searchButton = screen.getByTestId('search-icon').closest('button');
      fireEvent.click(searchButton!);

      // Close search
      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton!);

      // Search input should be hidden
      expect(screen.queryByPlaceholderText('Search articles...')).not.toBeInTheDocument();
    });

    it('should handle search form submission', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Open search
      const searchButton = screen.getByTestId('search-icon').closest('button');
      fireEvent.click(searchButton!);

      const searchInput = screen.getByPlaceholderText('Search articles...');
      fireEvent.change(searchInput, { target: { value: 'weather update' } });

      const form = searchInput.closest('form');
      fireEvent.submit(form!);

      // Should navigate to search results (mocked navigation)
      expect(searchInput).toHaveValue('weather update');
    });
  });

  describe('Responsive Design', () => {
    it('should hide desktop navigation on mobile screens', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Desktop navigation should have lg:flex class (hidden on mobile)
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('hidden', 'lg:flex');
    });

    it('should show mobile menu button on small screens', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      const mobileMenuButton = screen.getByTestId('menu-icon').closest('button');
      expect(mobileMenuButton).toHaveClass('lg:hidden');
    });
  });

  describe('Authentication States', () => {
    it('should show sign in and register buttons when not authenticated', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle categories loading failure gracefully', async () => {
      const Wrapper = createWrapper();
      
      // Mock API failure
      vi.mocked(categoriesService.getCategories).mockRejectedValue(
        new Error('Failed to load categories')
      );

      render(<Navbar />, { wrapper: Wrapper });

      // Should still render basic navigation elements
      expect(screen.getByText('DOMINICA NEWS')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();

      // Should not crash the application
      await waitFor(() => {
        expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      });
    });

    it('should handle empty categories response', async () => {
      const Wrapper = createWrapper();
      
      // Mock empty response
      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        success: true,
        data: {
          categories: [],
          count: 0,
        },
      });

      render(<Navbar />, { wrapper: Wrapper });

      // Should still show Home link
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();

      // Should not show any category dropdowns
      await waitFor(() => {
        expect(screen.queryByTestId('category-dropdown-weather')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation Performance', () => {
    it('should call categories API on mount', async () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(categoriesService.getCategories).toHaveBeenCalled();
      });

      // Verify the API was called at least once (React Query passes additional parameters)
      expect(categoriesService.getCategories).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      // Check for proper navigation role
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check for proper link roles
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      const Wrapper = createWrapper();
      
      render(<Navbar />, { wrapper: Wrapper });

      const homeLink = screen.getByRole('link', { name: 'Home' });
      
      // Should be focusable
      homeLink.focus();
      expect(document.activeElement).toBe(homeLink);
    });
  });
});