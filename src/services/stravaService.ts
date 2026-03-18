import { apiService } from './api';
import type {
  ApiResponse, StravaAthleteDto, StravaBike 
} from '@/types';

// Strava OAuth configuration
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID || '';
const STRAVA_REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI || `${window.location.origin}/strava/integration`;
const STRAVA_SCOPE = 'profile:read_all';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';

export interface StravaAuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  athlete?: StravaAthleteDto;
}

export const stravaService = {
  /**
   * Generate a random state string for OAuth security
   */
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  /**
   * Get the Strava OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    if (!STRAVA_CLIENT_ID) {
      throw new Error('Strava Client ID is not configured. Please set VITE_STRAVA_CLIENT_ID in your .env file.');
    }

    const state = this.generateState();
    // Store state in sessionStorage to verify on callback
    sessionStorage.setItem('strava_oauth_state', state);

    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      redirect_uri: STRAVA_REDIRECT_URI,
      response_type: 'code',
      scope: STRAVA_SCOPE,
      state: state,
    });

    return `${STRAVA_AUTH_URL}?${params.toString()}`;
  },

  /**
   * Initiate Strava OAuth flow by redirecting to Strava authorization page
   */
  authorize(): void {
    const authUrl = this.getAuthorizationUrl();
    window.location.href = authUrl;
  },

  /**
   * Handle OAuth callback - extract code and state from URL
   */
  handleCallback(url: string = window.location.href): { code: string; state: string } | null {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      const error = urlObj.searchParams.get('error');
      console.log('state', state);

      if (error) {
        throw new Error(`Strava authorization error: ${error}`);
      }

      if (!code || !state) {
        return null;
      }

      // Verify state matches what we stored
      const storedState = sessionStorage.getItem('strava_oauth_state');
      console.log('storedState', storedState);
      if (storedState !== state) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
      }

      // Clear stored state
      sessionStorage.removeItem('strava_oauth_state');

      return { code, state };
    } catch (error) {
      console.error('Error handling Strava callback:', error);
      throw error;
    }
  },

  /**
   * Exchange authorization code for access token
   * This should call your backend API which will exchange the code with Strava
   */
  async exchangeCodeForToken(code: string): Promise<StravaAuthResponse> {
    try {
      const response = await apiService.post<StravaAuthResponse>('/api/strava/authorize', {
        code,
        redirect_uri: STRAVA_REDIRECT_URI,
      });

      if (response.data && response.data.success && response.data.accessToken) {
        // Store Strava connection status 
        localStorage.setItem('strava_connected', 'true');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  },

  /**
   * Check if user has connected Strava
   */
  isConnected(): boolean {
    return localStorage.getItem('strava_connected') === 'true';
  },

  /**
   * Disconnect Strava (call backend to revoke token)
   */
  async disconnect(): Promise<boolean> {
    try {
      const response = await apiService.post<{ success: boolean }>('/api/strava/disconnect');
      localStorage.removeItem('strava_connected');
      return response.data?.success || false;
    } catch (error) {
      console.error('Failed to disconnect Strava:', error);
      throw error;
    }
  },

  /**
   * Fetch bikes from Strava
   */
  async getBikes(): Promise<StravaBike[]> {
    try {
      const response = await apiService.get<StravaBike[]>('/api/strava/bikes');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch Strava bikes:', error);
      throw error;
    }
  },

  /**
   * Fetch athlete data from Strava (includes bikes)
   */
  async getAthlete(): Promise<StravaAthleteDto> {
    try {
      const response = await apiService.get<StravaAthleteDto>('/api/strava/athlete');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Strava athlete data:', error);
      throw error;
    }
  },
};

