import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userSettingsService } from '@/services/userSettingsService';
import type { UserSettings } from '@/types';

export const useUserSettingsStore = defineStore('userSettings', () => {
  // State
  const userSettings = ref<UserSettings | null>(null);

  // Getters

  // Actions
  const fetchSettings = async () => {
    try {      
      const fetchedSettings = await userSettingsService.getUserSettings();
      
      userSettings.value = fetchedSettings;
      
      return fetchedSettings;
    } catch (err: any) {
      throw err;
    } 
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    try {
      const updatedSettings = await userSettingsService.updateUserSettings(settings);
      userSettings.value = updatedSettings;
      return updatedSettings;
    } catch (err: any) {
      throw err;
    }
  };
  

  return {
    // State
    userSettings,
    
    // Getters
    
    // Actions
    fetchSettings,
    updateSettings,
  };
});

