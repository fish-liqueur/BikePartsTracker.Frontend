import { apiService } from './api';
import api from './api';
import type {
  LoginRequest, RegisterRequest, AuthResponse, User 
} from '@/types';

export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    
    // Store token and user data
    if (response.data && response.data.success && response.data.token && response.data.user) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', userData);
    
    // Store token and user data
    if (response.data && response.data.success && response.data.token && response.data.user) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Logout user
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Refresh token (if you implement refresh token logic)
  async refreshToken(): Promise<string | null> {
    try {
      const response = await api.post<{ token: string }>('/api/auth/refresh');
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        return response.data.token;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.logout();
    }
    return null;
  }
};
