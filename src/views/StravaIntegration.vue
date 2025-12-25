<template>
  <div class="view-container">
    <div class="view-content">
      <div v-if="isLoading" class="callback-status">
        <q-spinner color="primary" size="3em" />
        <p>Connecting to Strava...</p>
      </div>
      <div v-else-if="error" class="callback-status error">
        <q-icon name="error" size="3em" color="negative" />
        <p>{{ error }}</p>
        <q-btn
          label="Go to Settings"
          color="primary"
          @click="goToSettings"
          class="action-button"
        />
      </div>
      <div v-else-if="success" class="callback-status success">
        <q-icon name="check_circle" size="3em" color="positive" />
        <p>Successfully connected to Strava!</p>
        <q-btn
        size="lg"
          label="Go to Settings"
          color="primary"
          @click="goToSettings"
          class="action-button"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { stravaService } from '@/services/stravaService';
import { useStravaStore } from '@/stores/stravaStore';

const router = useRouter();
const stravaStore = useStravaStore();
const isLoading = ref(true);
const error = ref<string | null>(null);
const success = ref(false);

const goToSettings = () => {
  router.push('/settings');
};

onMounted(async () => {
  try {
    // Extract code and state from URL
    const callbackData = stravaService.handleCallback();
    console.log('callbackData', callbackData);
    
    if (!callbackData) {
      error.value = 'No authorization code received from Strava.';
      isLoading.value = false;
      return;
    }

    // Exchange code for access token via backend
    const response = await stravaService.exchangeCodeForToken(callbackData.code);
    
    if (response.success) {
      // Store athlete data in the store
      if (response.athlete) {
        stravaStore.setAthlete(response.athlete);
      }
      success.value = true;
    } else {
      error.value = response.message || 'Failed to connect to Strava.';
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred while connecting to Strava.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.view-container {
  min-height: 100%;
  background-color: #f8fafc;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-content {
  background: white;
  padding: 48px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.callback-status {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.callback-status p {
  color: #4a5568;
  font-size: 1.1rem;
  margin: 0;
}

.callback-status.error p {
  color: #e53e3e;
}

.callback-status.success p {
  color: #38a169;
}

.action-button {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .view-container {
    padding: 20px;
  }

  .view-content {
    padding: 32px 24px;
  }
}
</style>

