<template>
  <div class="chain-card draggable-card"
       :class="{
         'chain-card--active bg-primary text-white': isActive && part,
         'chain-card--draggable bg-secondary text-white': !isActive && part,
       }">
    <div class="chain-card__index">
      {{ index + 1 }}
    </div>
    <div class="chain-card__name">
      <div class="max-w-full">
        <OverflowTooltip :text="part.name" />
      </div>
    </div>
    <p class="chain-card__description">{{ part.description }}</p>
    <p class="chain-card__third-line" :style="thirdLineStyle">{{ thirdLineText }}</p>
    <q-menu touch-position>
      <q-list>
        <q-item clickable
                v-close-popup
                @click="handleFullDetails">
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label>To detailed page</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable
                v-close-popup
                @click="removeChainFromBike">
          <q-item-section avatar>
            <q-icon name="remove_circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Do not use on this bike</q-item-label>
            <q-item-label caption>{{ props.bikeContext.name }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
import {
  computed 
} from 'vue';
import { useLayout } from '@/composables/useLayout';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { formatDistance } from '@/utils/distance';
import type {
  Bike, BikePart 
} from '@/types';
import OverflowTooltip from '@/components/shared/OverflowTooltip.vue';

interface Props {
  part: BikePart;
  isActive: boolean;
  bikeContext: Bike;
  index: number;
  chainCycleId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  onSelectChain: [chainId: string, chainCycleId: string, index: number];
  fullDetails: [partId: string];
  onRemoveChainFromBike: [partId: string];
}>();

const userSettingsStore = useUserSettingsStore();
const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSuccess, showError, withAjaxBar 
} = useLayout();

const distanceUnit = computed(() => userSettingsStore.distanceUnit);

const thirdLineText = computed(() => {
  if (props.isActive) return 'Chain installed now';
  // Stub until swap-due metres are wired; still format via shared helper (ADR 0002 B-18).
  return `should install in ${formatDistance(metresBeforeInstallation.value, distanceUnit.value)}`;
});

const metresBeforeInstallation = computed(() => 0);

const thirdLineStyle = computed(() => {
  return {
    color: props.isActive ? 'var(--q-warning)' : '#fff',
    fontWeight: props.isActive ? 'bold' : 'normal',
  };
});

const handleFullDetails = () => {
  emit('fullDetails', props.part?.id || '');
};

const removeChainFromBike = () => {
  emit('onRemoveChainFromBike', props.part.id);
};
</script>

<style scoped lang="css">
.chain-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: .5rem;
  grid-template-areas:
    "index name"
    "description description"
    "thirdline thirdline";
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.chain-card:first-child {
  anchor-name: --chain-card-first;
}

.chain-card--no-chain {
  background-color: #aaa;
}

.chain-card__index {
  grid-area: index;
  font-size: 2rem;
  line-height: 1;
  font-weight: 600;
}

.chain-card__name {
  display: flex;
  align-items: end;
  grid-area: name;
  font-size: 1.2rem;
  line-height: 1.2;
}

.chain-card__description {
  display: -webkit-box;
  grid-area: description;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
  margin-bottom: 0;
}

.chain-card__third-line {
  grid-area: thirdline;
  font-size: 0.8rem;
  margin-bottom: 0;
  text-align: center;
}
</style>
