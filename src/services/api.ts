import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

// Get base URL from environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Log the base URL in development to help debug
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request URL in development to help debug
    if (import.meta.env.DEV) {
      const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
      console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Log connection errors in development for debugging
    if (import.meta.env.DEV && !error.response) {
      const baseUrl = API_BASE_URL;
      console.error(`API Connection Error to ${baseUrl}:`, {
        message: error.message,
        code: (error as any).code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access denied');
    }
    
    if (error.response && error.response?.status >= 500) {
      // Server error
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to normalize API responses
// Handles both cases: backend returns ApiResponse<T> or returns T directly
function normalizeResponse<T>(data: any): ApiResponse<T> {
  // Check if response is already in ApiResponse format
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    return data as ApiResponse<T>;
  }
  // Otherwise, wrap the response in ApiResponse format
  return {
    data: data as T,
    success: true,
  };
}

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get<any>(url, { params });
      return normalizeResponse<T>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post<any>(url, data);
      return normalizeResponse<T>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put<any>(url, data);
      return normalizeResponse<T>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // DELETE request
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete<any>(url);
      return normalizeResponse<T>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Error handler
function handleApiError(error: any): Error {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.statusText;
    return new Error(message);
  } else if (error.request) {
    // Request was made but no response received
    return new Error('No response from server');
  } else {
    // Something else happened
    return new Error(error.message || 'An error occurred');
  }
}

export default api;
