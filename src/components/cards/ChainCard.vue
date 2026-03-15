<template>
  <template>
    <q-card class="chain-card" :class="{
      'chain-card--active bg-primary text-white': isActive && part,
      'chain-card--draggable bg-secondary text-white': !isActive && part,
    }">
      <div class="chain-card__index">
        {{ index + 1 }}
      </div>
      <h4 class="chain-card__name">{{ part.name }}</h4>
      <p class="chain-card__description">{{ part.description }}</p>
      <p class="chain-card__third-line" :style="thirdLineStyle">{{ thirdLineText }}</p>
      <q-menu touch-position>
        <q-list>
          <q-item clickable v-close-popup @click="handleFullDetails">
            <q-item-section avatar>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>To detailed page</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="handleRemoveFromCycle">
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
    </q-card>
  </template>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { usePartsStore } from '@/stores/partsStore';
import { useLayout } from '@/composables/useLayout';
import type { Bike, BikePart, CreatePartDto } from '@/types';

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
  removeFromCycle: [partId: string];
}>();

const partsStore = usePartsStore();
const { showSuccess, showError, withAjaxBar } = useLayout();

const showMenu = ref(false);

const thirdLineText = computed(() => {
  return props.isActive ? 'Active chain' : `should install in ${kmsBeforeInstallation.value} km`;
});

const kmsBeforeInstallation = computed(() => {
  return 0;
});
const thirdLineStyle = computed(() => {
  return {
    color: props.isActive ? 'var(--q-warning)' : '#fff',
    fontWeight: props.isActive ? 'bold' : 'normal',
  };
});

const handleClickCard = () => {
  showMenu.value = !showMenu.value;
}

const handleFullDetails = () => {
  emit('fullDetails', props.part?.id || '');
  // router.push(`/parts/${props.part?.id}`);
};

const handleRemoveFromCycle = () => {
  emit('removeFromCycle', props.part?.id || '');
};

const handleCreateChain = async (data: CreatePartDto, index: number) => {
  try {
    const newChain = await withAjaxBar(
      partsStore.createPart(data)
    );
    showSuccess('Chain created successfully');
    if (newChain) {
      emit('onSelectChain', newChain.id, props.chainCycleId, props.index);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create chain';
    showError(errorMessage);
  }
}

const handleSelectChain = async (chain: BikePart) => {
  emit('onSelectChain', chain.id, props.chainCycleId, props.index);
}
</script>

<style scoped lang="css">
.chain-card {
  flex: 1 1 50%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: .5rem;
  grid-template-areas:
    "index name"
    "index description"
    "thirdline thirdline";
  padding: .5rem;
  transition: box-shadow 0.2s ease;
}

.chain-card:hover {
  cursor: grab;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chain-card:active {
  cursor: grabbing;
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
  grid-area: name;
  text-align: end;
  font-size: 1.4rem;
  line-height: 1.4;
}

.chain-card__description {
  display: -webkit-box;
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
