import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../authStore'
import { authService } from '@/services/authService'
import type { LoginRequest, RegisterRequest, User } from '@/types'

// Mock the authService
vi.mock('@/services/authService', () => ({
  authService: {
    getToken: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }
}))

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with stored token and user', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date()
      }

      vi.mocked(authService.getToken).mockReturnValue('stored-token')
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser)

      const store = useAuthStore()
      store.initializeAuth()

      expect(store.token).toBe('stored-token')
      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
    })

    it('should initialize with null if no stored data', () => {
      vi.mocked(authService.getToken).mockReturnValue(null)
      vi.mocked(authService.getCurrentUser).mockReturnValue(null)

      const store = useAuthStore()
      store.initializeAuth()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date()
      }

      const mockResponse = {
        success: true,
        token: 'new-token',
        user: mockUser
      }

      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = await store.login(credentials)

      expect(authService.login).toHaveBeenCalledWith(credentials)
      expect(store.user).toEqual(mockUser)
      expect(store.token).toBe('new-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(result).toEqual(mockResponse)
    })

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials'
      }

      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      await expect(store.login(credentials)).rejects.toThrow('Invalid credentials')

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Invalid credentials')
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state during login', async () => {
      const mockResponse = {
        success: true,
        token: 'token',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
          createdAt: new Date()
        }
      }

      vi.mocked(authService.login).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )

      const store = useAuthStore()
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      const loginPromise = store.login(credentials)
      expect(store.isLoading).toBe(true)

      await loginPromise
      expect(store.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser: User = {
        id: '1',
        email: 'newuser@example.com',
        username: 'newuser',
        name: 'New User',
        createdAt: new Date()
      }

      const mockResponse = {
        success: true,
        token: 'new-token',
        user: mockUser
      }

      vi.mocked(authService.register).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const userData: RegisterRequest = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }

      const result = await store.register(userData)

      expect(authService.register).toHaveBeenCalledWith(userData)
      expect(store.user).toEqual(mockUser)
      expect(store.token).toBe('new-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(result).toEqual(mockResponse)
    })

    it('should handle registration failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Email already exists'
      }

      vi.mocked(authService.register).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const userData: RegisterRequest = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }

      await expect(store.register(userData)).rejects.toThrow('Email already exists')

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Email already exists')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout and clear state', () => {
      const store = useAuthStore()
      store.user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date()
      }
      store.token = 'some-token'
      store.error = 'some error'

      store.logout()

      expect(authService.logout).toHaveBeenCalled()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.error).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const store = useAuthStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user and localStorage', () => {
      const store = useAuthStore()
      const updatedUser: User = {
        id: '1',
        email: 'updated@example.com',
        username: 'updateduser',
        name: 'Updated User',
        createdAt: new Date()
      }

      store.updateUser(updatedUser)

      expect(store.user).toEqual(updatedUser)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(updatedUser))
    })
  })

  describe('computed properties', () => {
    it('isAuthenticated should return true when token exists', () => {
      const store = useAuthStore()
      store.token = 'some-token'

      expect(store.isAuthenticated).toBe(true)
    })

    it('isAuthenticated should return false when no token', () => {
      const store = useAuthStore()
      store.token = null

      expect(store.isAuthenticated).toBe(false)
    })

    it('currentUser should return user', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date()
      }

      const store = useAuthStore()
      store.user = mockUser

      expect(store.currentUser).toEqual(mockUser)
    })
  })
})

