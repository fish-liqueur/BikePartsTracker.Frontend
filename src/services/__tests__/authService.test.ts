import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { authService } from '../authService';
import api from '../api';
import type {
  LoginRequest, RegisterRequest, AuthResponse, User 
} from '@/types';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('authService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store token and user', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date()
      };

      const mockResponse: AuthResponse = {
        success: true,
        token: 'mock-token-123',
        user: mockUser
      };

      vi.mocked(api.post).mockResolvedValue({
        data: mockResponse
      } as any);

      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('authToken')).toBe('mock-token-123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should not store token if response is unsuccessful', async () => {
      const mockResponse: AuthResponse = {
        success: false,
        message: 'Invalid credentials'
      };

      vi.mocked(api.post).mockResolvedValue({
        data: mockResponse
      } as any);

      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const result = await authService.login(credentials);

      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register successfully and store token and user', async () => {
      const mockUser: User = {
        id: '1',
        email: 'newuser@example.com',
        username: 'newuser',
        name: 'New User',
        createdAt: new Date()
      };

      const mockResponse: AuthResponse = {
        success: true,
        token: 'mock-token-456',
        user: mockUser
      };

      vi.mocked(api.post).mockResolvedValue({
        data: mockResponse
      } as any);

      const userData: RegisterRequest = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const result = await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/api/auth/register', userData);
      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('authToken')).toBe('mock-token-456');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect to login', () => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test' }));

      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      authService.logout();

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login');

      // Restore window.location
      window.location = originalLocation;
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date('2024-01-01')
      };

      localStorage.setItem('user', JSON.stringify(mockUser));

      const user = authService.getCurrentUser();

      expect(user).toBeTruthy();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.email).toBe(mockUser.email);
      expect(user?.username).toBe(mockUser.username);
      expect(user?.name).toBe(mockUser.name);
      // Note: Date is serialized as string, so we check the ISO string
      expect(new Date(user!.createdAt).toISOString()).toBe(mockUser.createdAt.toISOString());
    });

    it('should return null if no user in localStorage', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null if user data is invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json');

      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('authToken', 'mock-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('authToken', 'mock-token-123');
      expect(authService.getToken()).toBe('mock-token-123');
    });

    it('should return null if no token', () => {
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { token: 'new-token-123' }
      } as any);

      const newToken = await authService.refreshToken();

      expect(api.post).toHaveBeenCalledWith('/api/auth/refresh');
      expect(newToken).toBe('new-token-123');
      expect(localStorage.getItem('authToken')).toBe('new-token-123');
    });

    it('should logout on refresh failure', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Refresh failed'));

      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      const newToken = await authService.refreshToken();

      expect(newToken).toBeNull();
      expect(window.location.href).toBe('/login');

      // Restore window.location
      window.location = originalLocation;
    });
  });
});

