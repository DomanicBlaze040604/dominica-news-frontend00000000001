import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: (key: string) => {
      return localStorageMock[key] || null;
    },
    setItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageMock[key];
    },
    clear: () => {
      Object.keys(localStorageMock).forEach(key => {
        if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete localStorageMock[key];
        }
      });
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });

  // Mock fetch for tests that don't use the API service
  global.fetch = async (url: string, options?: RequestInit) => {
    console.log(`Mock fetch called: ${url}`);
    return new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

afterAll(() => {
  // Clean up any global mocks if needed
});

// Global test utilities
export const waitForLoadingToFinish = async () => {
  const { waitFor, screen } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  }, { timeout: 10000 });
};

export const mockAuthToken = (token: string = 'mock-token') => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify({
    id: '1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'admin',
    createdAt: new Date().toISOString(),
  }));
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
};