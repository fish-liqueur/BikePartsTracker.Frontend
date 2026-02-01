<template>
    <div class="chain-cycle-widget" flat>
        <div class="widget-header">
      <div class="header-left">
        <h2 class="widget-title">Chain cycle</h2>
      </div>
      <div class="header-right">
        <q-btn
        label="Do not use chain cycle"
        color="accent"
        icon="remove_circle_outline"
        @click="handleRemoveChainCycle"
      />
      </div>
    </div>
        <div class="chain-cycle-widget__layout">
            <div class="chain-cycle-widget__chains-visualizer">
                <VueDraggable
                v-model="draggableChains"
                :animation="200"
                :disabled="false"
                item-key="key"
                class="chains-draggable-container"
                @end="onChainReordered"
                draggable=".chain-card--draggable:not(.chain-card--active)"
                >
                <ChainCard
                        v-for="(chain, index) in draggableChains"
                        :key="chain?.id || `empty-${index}`"
                        :part="chain"
                        :is-active="chain?.id === bikeContext.activeChainId"
                        :bike-context="bikeContext"
                        :index="index"
                        :on-add-chain="handleAddChain"
                    />
                </VueDraggable>
            </div>
            <div class="chain-cycle-widget__data-container">
                <div class="chain-cycle-widget__data-container-item">
                    Swap chain in <span>300</span> km 
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Bike, BikePart } from '@/types';
import { computed, ref, onMounted, watch } from 'vue';
import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import ChainCard from '@/components/cards/ChainCard.vue';

interface Props {
  bikeContext: Bike;
}

const props = defineProps<Props>();
const partsStore = usePartsStore();
const bikesStore = useBikesStore();
const userSettingsStore = useUserSettingsStore();
const { showSuccess, showError, withAjaxBar } = useLayout();

const chainsInCycleDetailed = computed(() => props.bikeContext.chainsInCycle?.map(id => partsStore.parts.find(part => part.id === id)));
const draggableChains = ref<BikePart[]>([]);

const getDraggableChains = () => {
    if (!props.bikeContext.chainsInCycle) {
        throw new Error('Chains cycle not found for this bike');
    }

    const index = props.bikeContext.chainsInCycle?.findIndex(id => id === props.bikeContext.activeChainId);

    if (index === -1) {
        throw new Error('Active chain not found in chainsInCycle');
    }

    const rotatedChainIds = [ ...props.bikeContext.chainsInCycle?.slice(index), ...props.bikeContext.chainsInCycle?.slice(0, index)] as (string | null)[];
    return rotatedChainIds.map(id => partsStore.parts.find(part => part.id === id) || null) as (BikePart | null)[];
}

const updateDraggableChains = () => {
    draggableChains.value = getDraggableChains() as BikePart[];
}

const dropzoneOptions = {
    multipleDropzonesItemsDraggingEnabled: false,
    dropzoneSelector: ".chains-draggable-container",
    draggableSelector: ".chain-card--draggable"
}

const onChainReordered = (event: SortableEvent) => {
    console.log('Chain reordered:', event
    );
}

const updateDraggableTrigger = computed(() => JSON.stringify(props.bikeContext.chainsInCycle))

onMounted(() => {
  try {
    updateDraggableChains();
  } catch (error) {
    console.error('Failed to fetch bikes:', error);
  }
});

watch(updateDraggableTrigger, () => {
    updateDraggableChains();
});

const handleRemoveChainCycle = async () => {
    try {
        await withAjaxBar(
            bikesStore.updateBike(props.bikeContext.id, { 
                chainsInCycle: null  
            })
        );
        showSuccess('Chain cycle removed successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove chain cycle';
        showError(errorMessage);
    }
}

const handleAddChain = () => {
    console.log('Handle add chain');
}
</script>

<style scoped lang="css">
.chain-cycle-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 1rem;
  background-color: beige;
  border: 1px solid var(--q-primary);
}

.chain-cycle-widget__chains-visualizer {
  /* display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center; */
  border-radius: 1rem;
  border: 1px dashed var(--q-positive);
  background-color: rgba(33, 186, 69, 0.1);
  padding: 1rem;
}

.chains-draggable-container {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  gap: 1rem;
}

.chain-cycle-widget__layout {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}
</style>