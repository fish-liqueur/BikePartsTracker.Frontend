<template>
  <q-card>
    <q-card-section>
      <h5 class="text-h5">Strava Connection</h5>
      <div class="strava-status">
        <q-icon 
          :name="isConnected ? 'check_circle' : 'link_off'" 
          :color="isConnected ? 'positive' : 'grey'"
          size="2em"
        />
        <div class="status-text">
          <p class="status-value">{{ isConnected ? `Connected as ${currentAthlete?.firstname} ${currentAthlete?.lastname}` : 'Not Connected' }}</p>
        </div>
      </div>
      <div v-if="error" class="text-subtitle1 color-negative">{{ error }}</div>
    </q-card-section>

    <q-card-actions align="stretch">
      <q-btn :flat="hasAthlete" 
             color="primary" 
             :loading="isLoading" 
             :disabled="hasAthlete" 
             @click="handleAddStrava">Connect Strava</q-btn>
      <q-btn :flat="!hasAthlete"   
             color="negative" 
             :loading="isLoading" 
             :disabled="!hasAthlete" 
             @click="handleDisconnectStrava">Disconnect Strava</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { stravaService } from '@/services/stravaService';
import { useStravaStore } from '@/stores/stravaStore';
import { useQuasar } from 'quasar';

const stravaStore = useStravaStore();
const $q = useQuasar();

const isConnected = computed(() => stravaStore.isConnected);
const isLoading = computed(() => stravaStore.isLoading);
const error = computed(() => stravaStore.error);
const hasAthlete = computed(() => stravaStore.hasAthlete);

const handleAddStrava = () => {
  
  stravaStore.clearError();
  
  // Redirect to Strava authorization page
  stravaService.authorize();
};

const handleDisconnectStrava = async () => {
  try {
    $q.dialog({
      title: 'Confirm',
      message: 'Do you want to disconnect from Strava?',
      cancel: true,
      persistent: false
    }).onOk(() => {
      stravaStore.disconnect();
    });

  } catch (err: any) {
    // Error is already handled in the store
  }
};

const currentAthlete = computed(() => stravaStore.currentAthlete);
</script>

<style scoped lang="css">
.strava-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
}

.status-text {
  flex: 1;
}

.status-value {
  color: #2d3748;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
</style>

