import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';
import type {
  User, LoginRequest, RegisterRequest 
} from '@/types';

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
    } catch (err: any) {
      error.value = err.message || 'Login failed';
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
    } catch (err: any) {
      error.value = err.message || 'Registration failed';
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
    updateUser
  };
});
