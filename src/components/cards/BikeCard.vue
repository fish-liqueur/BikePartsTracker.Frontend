<template>
  <q-card :class="bikeCardClass">
    <q-card-section>
      <div class="bike-header">
        <h3 class="bike-name">{{ bike.name }}</h3>
        <q-chip :label="bike.type" color="primary" text-color="white" size="sm" />
      </div>
    </q-card-section>

    <q-separator />

    <!-- Parts Section -->
    <q-expansion-item
      v-if="bike.parts && bike.parts.length > 0"
      expand-separator
      icon="hardware"
      label="Parts"
      :caption="`${bike.parts.length} part${bike.parts.length !== 1 ? 's' : ''}`"
      header-class="text-primary"
    >
      <q-card>
        <q-card-section>
          <q-list separator>
            <q-item
              v-for="part in bike.parts"
              :key="part.id"
              class="part-item"
            >
              <q-item-section>
                <q-item-label>{{ part.name }}</q-item-label>
                <q-item-label caption>
                  {{ part.partType }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="mileage-info">
                  <span v-if="currentMaintenanceCycleMileage(part) !== null">
                    {{ currentMaintenanceCycleMileage(part) }} /
                  </span>
                  {{ totalMileage(part) }} km
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-separator v-if="bike.parts && bike.parts.length > 0" />

    <!-- Last Rides Section -->
    <q-card-section v-if="displayedRides && displayedRides.length > 0">
      <div class="rides-section">
        <div class="section-title">Recent Rides</div>
        <q-list separator>
          <q-item
            v-for="(ride, index) in displayedRides"
            :key="index"
            class="ride-item"
          >
            <q-item-section>
              <q-item-label>{{ formatRide(ride) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Action Buttons -->
    <q-card-actions align="right">
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
        <q-item
            clickable
            v-close-popup
            @click="handleParts"
          >
            <q-item-section avatar>
              <q-icon name="pedal_bike" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Manage Parts</q-item-label>
              <q-item-label caption>{{ bike.parts.length }} parts installed</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-close-popup
            @click="handleRides"
          >
            <q-item-section avatar>
              <q-icon name="build" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Rides history</q-item-label>
            </q-item-section>
          </q-item>

        <q-item clickable v-close-popup @click="handleFullDetails">
          <q-item-section avatar>
            <q-icon name="dashboard_2_gear" />
          </q-item-section>
          <q-item-section>
            <q-item-label>To detailed page</q-item-label>
            <!-- <q-item-label caption>February 22, 2016</q-item-label> -->
          </q-item-section>
        </q-item>

          <q-item
          v-if="props.bike.isActive"
            clickable
            v-close-popup
            @click="handleRetire"
          >
            <q-item-section avatar>
              <q-icon name="archive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Retire Bike</q-item-label>
              <q-item-label caption>for the bikes you won't use anymore</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            v-if="!props.bike.isActive"
            clickable
            v-close-popup
            @click="handleActivate"
            color="positive"
          >
            <q-item-section avatar>
              <q-icon name="archive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Activate Bike</q-item-label>
              <q-item-label caption>If you changed your mind and want it back</q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            clickable
            v-close-popup
            @click="handleDelete"
          >
            <q-item-section avatar>
              <q-icon name="delete" color="negative"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>Delete Bike</q-item-label>
              <q-item-label caption>for the bikes created by mistake</q-item-label>
            </q-item-section>
          </q-item>
      </q-list>
    </q-btn-dropdown>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Bike, BikePart } from '@/types';

// Basic Ride interface - can be extended when Ride type is defined
interface Ride {
  id?: string;
  date: Date | string;
  mileage?: number;
  distance?: number;
  duration?: number;
  notes?: string;
  [key: string]: any;
}

interface Props {
  bike: Bike;
  recentRides?: Ride[];
  currentBikeMileage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  recentRides: () => [],
  currentBikeMileage: 0
});

const emit = defineEmits<{
  fullDetails: [bikeId: string];
  rides: [bikeId: string];
  parts: [bikeId: string];
  configure: [bikeId: string];
  delete: [bikeId: string];
  retire: [bikeId: string];
  activate: [bikeId: string];
}>();

const router = useRouter();

// Get last 3 rides
const displayedRides = computed(() => {
  if (!props.recentRides || props.recentRides.length === 0) {
    return [];
  }
  return props.recentRides.slice(0, 3);
});

// Calculate total mileage for a part
const totalMileage = (part: BikePart): number => {
  if (!props.currentBikeMileage || props.currentBikeMileage === 0) {
    return 0;
  }
  return Math.max(0, props.currentBikeMileage - part.mileageAtInstallation);
};

// Calculate mileage in current maintenance cycle
// This assumes maintenance cycles are tracked via PartUsageHistory
const currentMaintenanceCycleMileage = (part: BikePart): number | null => {
  if (!part.usageHistory || part.usageHistory.length === 0) {
    return null;
  }
  
  // Get the most recent usage history entry (last maintenance)
  const lastMaintenance = part.usageHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  if (!lastMaintenance || !props.currentBikeMileage) {
    return null;
  }
  
  return Math.max(0, props.currentBikeMileage - lastMaintenance.mileage);
};

// Format ride for display
const formatRide = (ride: Ride): string => {
  const date = typeof ride.date === 'string' ? new Date(ride.date) : ride.date;
  const dateStr = date.toLocaleDateString();
  const mileage = ride.mileage || ride.distance || 0;
  
  if (mileage > 0) {
    return `${dateStr} - ${mileage} km`;
  }
  return dateStr;
};

// Event handlers
const handleFullDetails = () => {
  emit('fullDetails', props.bike.id);
  router.push(`/bikes/${props.bike.id}`);
};

const handleRides = () => {
  emit('rides', props.bike.id);
  router.push(`/bikes/${props.bike.id}/rides`);
};

const handleParts = () => {
  emit('parts', props.bike.id);
  router.push(`/bikes/${props.bike.id}/parts`);
};

const handleConfigure = () => {
  emit('configure', props.bike.id);
  router.push(`/bikes/${props.bike.id}/configure`);
};

const handleDelete = () => {
  emit('delete', props.bike.id);
};

const handleRetire = () => {
  emit('retire', props.bike.id);
};

const handleActivate = () => {
  emit('activate', props.bike.id);
};

const bikeCardClass = computed(() => {
  return {
    'bike-card': true,
    'bike-card--retired': !props.bike.isActive,
  } satisfies Record<string, boolean>;
});
</script>

<style scoped lang="css">
.bike-card {
  min-width: 300px;
  max-width: 100%;
}

.bike-card--retired {
  opacity: 0.8;
  filter: grayscale(100%);
}

.bike-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bike-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.part-item {
  padding: 8px 0;
}

.mileage-info {
  font-weight: 500;
  color: #4a5568;
  text-align: right;
}

.rides-section {
  margin-top: 8px;
}

.section-title {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ride-item {
  padding: 4px 0;
}

.ride-item :deep(.q-item__label) {
  font-size: 0.875rem;
  color: #718096;
}
</style>

