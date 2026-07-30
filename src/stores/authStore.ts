import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';
import type {
  User, LoginRequest, RegisterRequest 
} from '@/types';
import { getErrorMessage } from '@/utils/error';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const currentUser = computed(() => user.value);

  // Actions
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
      console.log('response ', response);
      if (response.success && response.user && response.token) {
        user.value = response.user;
        token.value = response.token;
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
      console.log('response ', response);
      if (response.success && response.user && response.token) {
        user.value = response.user;
        token.value = response.token;
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
    authService.logout();
    user.value = null;
    token.value = null;
    error.value = null;
  };

  // Cross-tab sign-out (ADR 0007): when the auth token is cleared in another tab, this tab must not
  // stay authenticated. The `storage` event only fires in *other* tabs, so a sign-out in tab A is
  // observed here in tab B. We reset in-memory state and send the rider to /login, matching the 401
  // handling in services/api.ts. Legacy key migration is out of scope, so we watch the raw key name.
  const AUTH_TOKEN_KEY = 'authToken';

  const setupCrossTabSignOut = () => {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event: StorageEvent) => {
      const clearedElsewhere = event.key === AUTH_TOKEN_KEY && event.newValue === null;
      if (!clearedElsewhere || !token.value) return;

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
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return {
    // State
    user,
    token,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    currentUser,
    
    // Actions
    initializeAuth,
    login,
    register,
    logout,
    clearError,
    updateUser,
    setupCrossTabSignOut
  };
});
