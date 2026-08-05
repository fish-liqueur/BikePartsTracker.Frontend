import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';
import { realtimeService } from '@/services/realtimeService';
import type {
  User, LoginRequest, RegisterRequest
} from '@/types';
import { getErrorMessage } from '@/utils/error';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const currentUser = computed(() => user.value);

  const initializeAuth = () => {
    const storedToken = authService.getToken();
    const storedUser = authService.getCurrentUser();

    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = storedUser;
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await authService.login(credentials);
      if (response.success && response.user && response.token) {
        user.value = response.user;
        token.value = response.token;
        void realtimeService.connect();
      } else {
        throw new Error(response.message || 'Login failed');
      }

      return response;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Login failed');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await authService.register(userData);
      if (response.success && response.user && response.token) {
        user.value = response.user;
        token.value = response.token;
        void realtimeService.connect();
      } else {
        throw new Error(response.message || 'Registration failed');
      }

      return response;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Registration failed');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    void realtimeService.disconnect();
    authService.logout();
    user.value = null;
    token.value = null;
    error.value = null;
  };

  const AUTH_TOKEN_KEY = 'authToken';

  const setupCrossTabSignOut = () => {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event: StorageEvent) => {
      const clearedElsewhere = event.key === AUTH_TOKEN_KEY && event.newValue === null;
      if (!clearedElsewhere || !token.value) return;

      void realtimeService.disconnect();
      user.value = null;
      token.value = null;
      error.value = null;
      window.location.href = '/login';
    });
  };

  const clearError = () => {
    error.value = null;
  };

  const updateUser = (updatedUser: User) => {
    user.value = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    currentUser,
    initializeAuth,
    login,
    register,
    logout,
    clearError,
    updateUser,
    setupCrossTabSignOut
  };
});
