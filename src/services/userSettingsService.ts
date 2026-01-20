import { apiService } from './api';
import type { UserSettings } from '@/types';

export const userSettingsService = {
  async getUserSettings(): Promise<UserSettings> {
    const response = await apiService.get<UserSettings>('/api/users/settings');
    return response.data || {};
  },
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await apiService.put<UserSettings>('/api/users/settings', settings);
    return response.data || {};
  },
};

