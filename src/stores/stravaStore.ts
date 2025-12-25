import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { stravaService } from '@/services/stravaService';
import type { StravaAthleteDto } from '@/types';

export const useStravaStore = defineStore('strava', () => {
  // State
  const athlete = ref<StravaAthleteDto | null>(null);
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const currentAthlete = computed(() => athlete.value);
  const hasAthlete = computed(() => !!athlete.value);
  const athleteName = computed(() => {
    if (!athlete.value) return null;
    if (athlete.value.firstname || athlete.value.lastname) {
      return [athlete.value.firstname, athlete.value.lastname].filter(Boolean).join(' ') || null;
    }
    return athlete.value.username || null;
  });

  // Actions
  const setAthlete = (athleteData: StravaAthleteDto) => {
    athlete.value = athleteData;
    isConnected.value = true;
    // Optionally persist to localStorage
    localStorage.setItem('strava_athlete', JSON.stringify(athleteData));
    localStorage.setItem('strava_connected', 'true');
  };

  const clearAthlete = () => {
    athlete.value = null;
    isConnected.value = false;
    localStorage.removeItem('strava_athlete');
    localStorage.removeItem('strava_connected');
  };

  const initializeStrava = () => {
    // Load athlete data from localStorage if available
    const storedAthlete = localStorage.getItem('strava_athlete');
    const connected = localStorage.getItem('strava_connected') === 'true';
    
    if (storedAthlete && connected) {
      try {
        athlete.value = JSON.parse(storedAthlete);
        isConnected.value = true;
      } catch (error) {
        console.error('Failed to parse stored Strava athlete data:', error);
        clearAthlete();
      }
    }
  };

  const disconnect = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await stravaService.disconnect();
      clearAthlete();
    } catch (err: any) {
      error.value = err.message || 'Failed to disconnect from Strava.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    athlete,
    isConnected,
    isLoading,
    error,
    
    // Getters
    currentAthlete,
    hasAthlete,
    athleteName,
    
    // Actions
    setAthlete,
    clearAthlete,
    initializeStrava,
    disconnect,
    clearError
  };
});

