import { apiService } from './api';
import type { UserSettings, UserSettingsDto } from '@/types';

export const userSettingsService = {
  async getUserSettings(): Promise<UserSettings> {
    const response = await apiService.get<UserSettings>('/api/users/settings');
    return response.data || {};
  },
  async updateUserSettings(settings: UserSettingsDto): Promise<UserSettingsDto> {
    const response = await apiService.put<UserSettingsDto>('/api/users/settings', settings);
    return response.data || {};
  },
};

