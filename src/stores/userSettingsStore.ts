import { defineStore } from 'pinia';
import { ref } from 'vue';
import { userSettingsService } from '@/services/userSettingsService';
import type { UserSettings, UserSettingsDto, FetchStatus } from '@/types';

export const useUserSettingsStore = defineStore('userSettings', () => {
  // State
  const userSettings = ref<UserSettings | null>(null);
  const fetchStatus = ref<FetchStatus>('idle');

  // Actions
  const ensureSettings = async () => {
    if (fetchStatus.value === 'done' || fetchStatus.value === 'loading') return;
    return fetchSettings();
  };

  const fetchSettings = async () => {
    try {
      fetchStatus.value = 'loading';
      const fetchedSettings = await userSettingsService.getUserSettings();
      userSettings.value = fetchedSettings;
      fetchStatus.value = 'done';
      return fetchedSettings;
    } catch (err: any) {
      fetchStatus.value = 'error';
      throw err;
    } 
  };

  const updateSettings = async (settings: UserSettingsDto) => {
    try {
      const updatedSettings = await userSettingsService.updateUserSettings(settings);
      userSettings.value = updatedSettings as UserSettings;
      return updatedSettings;
    } catch (err: any) {
      throw err;
    }
  };

  const reset = () => {
    userSettings.value = null;
    fetchStatus.value = 'idle';
  };

  return {
    // State
    userSettings,
    fetchStatus,
    
    // Actions
    ensureSettings,
    fetchSettings,
    updateSettings,
    reset,
  };
});

