<template>
  <q-card class="part-card">
    <q-card-section>
      <div class="part-header">
        <div class="part-type-chip-wrapper">
          <q-chip
            :label="part.partType"
            color="primary"
            text-color="white"
            size="sm"
            class="part-type-chip"
          />
        </div>
        <div class="bike-name-chip-wrapper">
          <q-chip
          v-if="part.bikeId"
            :label="part.bikeId"
            color="secondary"
            text-color="white"
            size="sm"
            class="bike-name-chip"
          />
        </div>


          <h3 class="part-name">{{ part.name }}</h3>
          <div v-if="part.brand || part.model" class="part-brand-model">
            {{ part.brand }} {{ part.model }}
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
      <q-btn-dropdown color="primary" icon="menu">
      <q-list>
        <q-item clickable v-close-popup @click="handleFullDetails">
          <q-item-section avatar>
            <q-icon name="dashboard_2_gear" />
          </q-item-section>
          <q-item-section>
            <q-item-label>To Part page</q-item-label>
            <!-- <q-item-label caption>February 22, 2016</q-item-label> -->
          </q-item-section>
        </q-item>
        <q-item
            v-if="part.bike"
            clickable
            v-close-popup
          >
            <q-item-section avatar>
              <q-icon name="build" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Do maintenance!</q-item-label>
            </q-item-section>
          </q-item>
        <q-item
            v-if="part.bike"
            clickable
            v-close-popup
            @click="handleShowBike"
          >
            <q-item-section avatar>
              <q-icon name="pedal_bike" />
            </q-item-section>
            <q-item-section>
              <q-item-label>To Bike page</q-item-label>
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
              <q-icon name="archive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Remove from Bike</q-item-label>
              <q-item-label caption>and keep in the box</q-item-label>
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
          <!-- <q-item
            disable
            @click="handlePassToOtherUser"
          >
            <q-item-section avatar>
              <q-icon name="person_add" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Pass Part to Other User</q-item-label>
            </q-item-section>
          </q-item> -->
          <q-item
            clickable
            v-close-popup
            @click="handleDelete"
          >
            <q-item-section avatar>
              <q-icon name="delete" color="negative"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>Delete part</q-item-label>
              <q-item-label caption>delete part and all its history</q-item-label>
            </q-item-section>
          </q-item>
      </q-list>
    </q-btn-dropdown>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import type { Bike, BikePart } from '@/types';
import { BIKE_CONTEXT_KEY, type BikeContextValue } from '@/components/parts/bikeContextKey';

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

// Inject bikeContext from PartsWidget
const bikeContext = inject<ComputedRef<BikeContextValue>>(BIKE_CONTEXT_KEY, computed<BikeContextValue>(() => null));

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
  display: grid;
  grid-template-columns: auto auto;
  /* justify-content: space-between;
  align-items: flex-start; */
}

.part-type-chip-wrapper {
  grid-area: 1 / 1 / 2 / 2;
}

.part-type-chip {
  margin-bottom: 8px;
}

.bike-name-chip-wrapper {
  grid-area: 1 / 2 / 2 / 3;
  text-align: right;
}

.bike-name-chip {
  
}

.part-name {
  grid-area: 2 / 1 / 3 / -1;
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.part-brand-model {
  grid-area: 3 / 1 / 4 / -1;
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

