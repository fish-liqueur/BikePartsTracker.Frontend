<template>
  <q-card class="part-card">
    <q-card-section>
      <div class="part-header">
        <div>
          <q-chip
            :label="part.partType"
            color="primary"
            text-color="white"
            size="sm"
            class="part-type-chip"
          />
          <h3 class="part-name">{{ part.name }}</h3>
          <div v-if="part.brand || part.model" class="part-brand-model">
            {{ part.brand }} {{ part.model }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="part-info">
      <!-- Remaining kms/days to maintenance -->
      <div class="info-row">
        <span class="info-label">Remaining:</span>
        <span class="info-value" :class="remainingClass">
          {{ remainingText }}
        </span>
      </div>

      <!-- Total Mileage -->
      <div class="info-row">
        <span class="info-label">Total Mileage:</span>
        <span class="info-value">{{ totalMileage }} km</span>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Action Buttons -->
    <q-card-actions align="right" class="part-actions">
      <q-btn
        flat
        label="Full Details"
        color="primary"
        icon="info"
        size="sm"
        @click="handleFullDetails"
      />
      <q-btn
        flat
        label="Rides History"
        color="primary"
        icon="history"
        size="sm"
        @click="handleRidesHistory"
      />
      
      <!-- Bike Submenu -->
      <q-btn-dropdown
        flat
        label="Bike"
        color="primary"
        icon="pedal_bike"
        size="sm"
      >
        <q-list>
          <q-item
            v-if="part.bike"
            clickable
            v-close-popup
            @click="handleShowBike"
          >
            <q-item-section avatar>
              <q-icon name="visibility" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Show Bike</q-item-label>
              <q-item-label caption>{{ part.bike.name }}</q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            v-if="part.bike"
            clickable
            v-close-popup
            @click="handleRemoveFromBike"
          >
            <q-item-section avatar>
              <q-icon name="remove_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Remove from Bike</q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            clickable
            v-close-popup
            @click="handlePutOnOtherBike"
          >
            <q-item-section avatar>
              <q-icon name="swap_horiz" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Put on Other Bike</q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            clickable
            v-close-popup
            @click="handlePassToOtherUser"
          >
            <q-item-section avatar>
              <q-icon name="person_add" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Pass Part to Other User</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn
        flat
        label="Delete"
        color="negative"
        icon="delete"
        size="sm"
        @click="handleDelete"
      />
      <q-btn
        flat
        label="Configure"
        color="primary"
        icon="settings"
        size="sm"
        @click="handleConfigure"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { BikePart } from '@/types';

interface Props {
  part: BikePart;
  currentBikeMileage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentBikeMileage: 0
});

const emit = defineEmits<{
  fullDetails: [partId: string];
  ridesHistory: [partId: string];
  showBike: [bikeId: string];
  removeFromBike: [partId: string];
  putOnOtherBike: [partId: string];
  passToOtherUser: [partId: string];
  delete: [partId: string];
  configure: [partId: string];
}>();

const router = useRouter();

// Calculate total mileage
const totalMileage = computed((): number => {
  if (!props.currentBikeMileage || props.currentBikeMileage === 0) {
    return 0;
  }
  return Math.max(0, props.currentBikeMileage - props.part.mileageAtInstallation);
});

// Calculate remaining kms to maintenance
const remainingKms = computed((): number | null => {
  if (!props.currentBikeMileage || props.currentBikeMileage === 0) {
    return null;
  }
  
  const currentMileage = totalMileage.value;
  const remaining = props.part.expectedLifespan - currentMileage;
  
  return Math.max(0, remaining);
});

// Calculate remaining days (based on installation date and expected lifespan)
// This is a simplified calculation - assumes expectedLifespan is in km
// For days calculation, we'd need average daily usage or lifespan in days
const remainingDays = computed((): number | null => {
  if (!props.part.installationDate) {
    return null;
  }
  
  // If we have usage history, we could calculate average daily usage
  // For now, return null as we don't have enough data
  return null;
});

// Format remaining text
const remainingText = computed((): string => {
  const kms = remainingKms.value;
  
  if (kms === null) {
    return 'N/A';
  }
  
  if (kms === 0) {
    return '0 km (Due)';
  }
  
  return `${kms} km`;
});

// Remaining class for styling (warning/error if low)
const remainingClass = computed((): string => {
  const kms = remainingKms.value;
  
  if (kms === null || kms === 0) {
    return 'remaining-due';
  }
  
  // Warning if less than 20% of expected lifespan remaining
  const percentage = (kms / props.part.expectedLifespan) * 100;
  if (percentage < 20) {
    return 'remaining-warning';
  }
  
  return '';
});

// Event handlers
const handleFullDetails = () => {
  emit('fullDetails', props.part.id);
  router.push(`/parts/${props.part.id}`);
};

const handleRidesHistory = () => {
  emit('ridesHistory', props.part.id);
  router.push(`/parts/${props.part.id}/rides`);
};

const handleShowBike = () => {
  if (props.part.bikeId) {
    emit('showBike', props.part.bikeId);
    router.push(`/bikes/${props.part.bikeId}`);
  }
};

const handleRemoveFromBike = () => {
  emit('removeFromBike', props.part.id);
};

const handlePutOnOtherBike = () => {
  emit('putOnOtherBike', props.part.id);
};

const handlePassToOtherUser = () => {
  emit('passToOtherUser', props.part.id);
};

const handleDelete = () => {
  emit('delete', props.part.id);
};

const handleConfigure = () => {
  emit('configure', props.part.id);
  router.push(`/parts/${props.part.id}/configure`);
};
</script>

<style scoped lang="css">
.part-card {
  min-width: 300px;
  max-width: 100%;
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.part-type-chip {
  margin-bottom: 8px;
}

.part-name {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.part-brand-model {
  color: #718096;
  font-size: 0.875rem;
  margin-top: 4px;
}

.part-info {
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

.info-value {
  font-weight: 600;
  color: #1a202c;
  font-size: 0.875rem;
}

.info-value.remaining-warning {
  color: #ed8936;
}

.info-value.remaining-due {
  color: #e53e3e;
}

.part-actions {
  padding: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.part-actions :deep(.q-btn) {
  margin: 2px;
}
</style>

