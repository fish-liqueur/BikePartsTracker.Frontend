<template>
  <q-card class="part-card" :class="{
    'part-card--on-other-bike': isInstalledOnOtherBike
  }">
    <q-card-section>
      <div class="part-header">
        <div class="part-header__chip-wrapper">
          <q-chip :label="part.partType" color="primary" text-color="white" size="md" class="part-type-chip" />
          <q-chip v-if="part.bikeId" :label="bikesStore.getBikeById(part.bikeId)?.name" :color="bikeChipColor"
            text-color="white" size="md" class="bike-name-chip" />
        </div>
        <div class="chain-description" v-if="isChain && bikeContext" :style="chainCycleStatus.style">
          <ElementWithTooltipButton :tooltip-text="chainCycleStatus.tooltipText" show-always>
            <span>{{ chainCycleStatus.text }}</span>
          </ElementWithTooltipButton>
        </div>

        <h3 class="part-name">{{ part.name }}</h3>
        <div v-if="part.description" class="part-brand-model">
          {{ part.description }}
        </div>
        <div v-else="part.brand || part.model" class="part-brand-model">
          {{ part.brand }} {{ part.model }}
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="part-info">


      <!-- Total Mileage -->
      <div class="info-row">
        <span class="info-label">Total Mileage:</span>
        <span class="info-value">{{ totalMileage }} km</span>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Action Buttons -->
    <q-card-actions align="right" class="part-actions">
      <q-btn flat label="Full Details" color="primary" icon="info" size="sm" @click="handleFullDetails" />
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
          <q-item v-if="part.bike" clickable v-close-popup>
            <q-item-section avatar>
              <q-icon name="build" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Do maintenance!</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="part.bike" clickable v-close-popup @click="handleShowBike">
            <q-item-section avatar>
              <q-icon name="pedal_bike" />
            </q-item-section>
            <q-item-section>
              <q-item-label>To Bike page</q-item-label>
              <q-item-label caption>{{ part.bike.name }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="part.bike" clickable v-close-popup @click="handleRemoveFromBike">
            <q-item-section avatar>
              <q-icon name="archive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Remove from Bike</q-item-label>
              <q-item-label caption>and keep in the box</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="handlePutOnOtherBike">
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
          <q-item clickable v-close-popup @click="handleDelete">
            <q-item-section avatar>
              <q-icon name="delete" color="negative" />
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
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePartsStore } from '@/stores/partsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { PartType, type Bike, type BikePart } from '@/types';
import ElementWithTooltipButton from '@/components/shared/ElementWithTooltipButton.vue';

interface Props {
  part: BikePart;
  bikeContext?: Bike | null;
  currentBikeMileage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentBikeMileage: 0,
  bikeContext: null
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

const bikesStore = useBikesStore();

// Calculate total mileage
const totalMileage = computed((): number => {
  if (!props.currentBikeMileage || props.currentBikeMileage === 0 || !props.part.mileageAtInstallation) {
    return 0;
  }
  return Math.max(0, props.currentBikeMileage - props.part.mileageAtInstallation);
});

const remainingDays = computed((): number | null => {
  if (!props.part.installationDate) {
    return null;
  }

  return null;
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

const isInstalledOnOtherBike = computed((): boolean => {
  if (!props.part.bikeId || !props.bikeContext?.id) {
    return false;
  }
  return props.bikeContext?.id !== props.part.bikeId;
});

const isChain = computed((): boolean => {
  return props.part.partType === PartType.Chain;
});

const isChainInCycle = computed((): boolean => {
  if (props.bikeContext?.chainCycles?.length === 0) {
    return false;
  }
  return props.bikeContext?.chainCycles?.find(chainCycle => chainCycle.chains.includes(props.part.id)) !== undefined;
});

const isChainInCycleActive = computed((): boolean => {
  if (props.bikeContext?.chainCycles?.length === 0) {
    return false;
  }
  return props.bikeContext?.chainCycles?.find(chainCycle => chainCycle.activeChainId === props.part.id) !== undefined;
});

const bikeChipColor = computed((): string => {
  if (props.part.bikeId === props.bikeContext?.id) {
    return 'secondary';
  } else {
    return 'warning';
  }
});

const chainCycleStatus = computed(() => {
  const attributes: {
    text: string,
    tooltipText: string,
    style: {
      backgroundColor: string,
      color: string,
      borderColor: string
    }
  } = {
    text: 'Works without\nchain cycle',
    tooltipText: `No chain cycle is set for this bike (${props.bikeContext?.name}).
Mileage for this chain increases with every ride.
If you add more chains without setting a chain cycle, 
mileage form every ride will be recorded for all of them.`,
    style: {
      backgroundColor: 'transparent',
      color: 'var(--q-dark)',
      borderColor: 'var(--q-dark)'
    }
  };

  if (isChainInCycleActive.value) {
    attributes.text = `Chain in cycle \nand active`;
    attributes.tooltipText = `Chain is currently installed on the bike.\nThe bike's mileage will be added to the mileage of this chain.`;
    attributes.style.backgroundColor = 'var(--q-warning)';
    attributes.style.color = 'var(--q-white)';
    attributes.style.borderColor = 'var(--q-negative)';
  } else if (isChainInCycle.value) {
    attributes.text = `Chain in cycle,\nbut not active now`;
    attributes.tooltipText = `Chain in cycle, currently not active.\nThis chain is not currently installed on the bike and is waiting for its turn.\nUntil then, the bike's mileage will not be added to the mileage of this chain.`;
    attributes.style.color = 'var(--q-primary)';
    attributes.style.borderColor = 'var(--q-primary)';
  }
  return attributes;
});
</script>

<style scoped lang="css">
.part-card {
  min-width: 200px;
  max-width: 100%;
}

.part-header {
  display: flex;
  flex-direction: column;
}

.part-header__chip-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  margin-bottom: .5rem;
}

.part-type-chip {
  margin-bottom: 8px;
}

.bike-name-chip {
  max-width: 100%;
}

.bike-name-chip :deep(.q-chip__content) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-description {
  padding: 4px 8px;
  border-radius: .5rem;
  border: 1px solid var(--q-primary);
  white-space: pre-wrap;
  text-align: left;
}

.part-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.part-brand-model {
  grid-area: 3 / 1 / 4 / -1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
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
