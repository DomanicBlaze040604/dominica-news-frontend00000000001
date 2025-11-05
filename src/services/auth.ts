import { api } from './api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  fullName: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
  };
}

// Authentication API calls
export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },

  // Refresh access token
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh');
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse<{}>> => {
    const response = await api.post<ApiResponse<{}>>('/auth/logout');
    return response.data;
  },

  // Logout from all devices
  logoutAll: async (): Promise<ApiResponse<{}>> => {
    const response = await api.post<ApiResponse<{}>>('/auth/logout-all');
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<{}>> => {
    const response = await api.put<ApiResponse<{}>>('/auth/change-password', data);
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return response.data;
  },
};

// Token management utilities
export const tokenService = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  isTokenValid: (): boolean => {
    const token = tokenService.getToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (payload.exp <= currentTime) {
        return false;
      }
      
      // Check if token type is access token
      if (payload.tokenType && payload.tokenType !== 'access') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  getTokenExpiration: (): Date | null => {
    const token = tokenService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  },

  isTokenExpiringSoon: (minutesThreshold: number = 5): boolean => {
    const expiration = tokenService.getTokenExpiration();
    if (!expiration) return true;
    
    const now = new Date();
    const timeDiff = expiration.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff <= minutesThreshold;
  },
};

// User data management utilities
export const userService = {
  getUser: (): User | null => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  setUser: (user: User): void => {
    localStorage.setItem('user_data', JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem('user_data');
  },

  isAdmin: (): boolean => {
    const user = userService.getUser();
    return user?.role === 'admin';
  },

  isEditor: (): boolean => {
    const user = userService.getUser();
    return user?.role === 'admin' || user?.role === 'editor';
  },

  hasRole: (role: string): boolean => {
    const user = userService.getUser();
    return user?.role === role;
  },
};