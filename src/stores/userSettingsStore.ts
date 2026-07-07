import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { userSettingsService } from '@/services/userSettingsService';
import type {
  UserSettings, UserSettingsDto, FetchStatus, 
  DistanceUnit
} from '@/types';

export const useUserSettingsStore = defineStore('userSettings', () => {
  // State
  const userSettings = ref<UserSettings | null>(null);
  const fetchStatus = ref<FetchStatus>('idle');

  // Getters
  const distanceUnit = computed<DistanceUnit>(() => userSettings.value?.distanceUnit ?? 'km');

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
    } catch (err: unknown) {
      fetchStatus.value = 'error';
      throw err;
    } 
  };

  const updateSettings = async (settings: UserSettingsDto) => {
    try {
      const updatedSettings = await userSettingsService.updateUserSettings(settings);
      userSettings.value = updatedSettings as UserSettings;
      return updatedSettings;
    } catch (err: unknown) {
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

    // Getters
    distanceUnit,
    
    // Actions
    ensureSettings,
    fetchSettings,
    updateSettings,
    reset,
  };
});

