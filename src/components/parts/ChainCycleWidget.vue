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
                        @on-add-chain="onUserAddChain"
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

    <AddChainDialog
      v-model="showAddChainDialog"
      :bike-context="bikeContext"
      @select="handleSelectChain"
      @create="handleCreateChain"
    />
</template>

<script setup lang="ts">
import type { Bike, BikePart, CreatePartDto, UpdateBikeDto } from '@/types';
import { computed, ref, onMounted, watch } from 'vue';
import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import ChainCard from '@/components/cards/ChainCard.vue';
import AddChainDialog from '@/components/parts/AddСhainDialog.vue';

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

const activeChainIndex = computed(() => {
 return props.bikeContext.chainsInCycle?.findIndex(id => id === props.bikeContext.activeChainId);
});

const getDraggableChains = () => {
    if (!props.bikeContext.chainsInCycle) {
        throw new Error('Chains cycle not found for this bike');
    }

    if (activeChainIndex.value === -1) {
        throw new Error('Active chain not found in chainsInCycle');
    }

    const rotatedChainIds = [ 
      ...props.bikeContext.chainsInCycle?.slice(activeChainIndex.value), 
      ...props.bikeContext.chainsInCycle?.slice(0, activeChainIndex.value)
    ] as (string | null)[];
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
const selectedChainIndex = ref(-1);
const onUserAddChain = (index: number) => {
    selectedChainIndex.value = index;
    showAddChainDialog.value = true;
}

const showAddChainDialog = ref(false);

const handleSelectChain = async (chain: BikePart) => {
    console.log('Handle select chain', chain, typeof chain);
    try {
        updateBikeWithNewChain(chain.id);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create chain';
        showError(errorMessage);
    }
}

const handleCreateChain = async (data: CreatePartDto) => {
    console.log('Handle create chain', data);
    try {
        const newChain = await withAjaxBar(
            partsStore.createPart(data)
        );
        console.log('Handle create chain 2:', data);
        showSuccess('Chain created successfully');
        if (newChain) {
          updateBikeWithNewChain(newChain.id);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create chain';
        showError(errorMessage);
    }
}

const updateBikeWithNewChain = async (newChainId: string) => {
  if (selectedChainIndex.value >= 0) {
          const newChainsInCycle = props.bikeContext.chainsInCycle == null 
            ? getNewChainsCycle() 
            : [ ...props.bikeContext.chainsInCycle ];
            const updateBikePayload: UpdateBikeDto = {
              chainsInCycle: [
                ...newChainsInCycle.slice(0, selectedChainIndex.value),
                newChainId,
                ...newChainsInCycle.slice(selectedChainIndex.value + 1)
              ]
            };

            if (selectedChainIndex.value === activeChainIndex.value) {
              updateBikePayload.activeChainId = newChainId;
            }
            
            await withAjaxBar(
              bikesStore.updateBike(props.bikeContext.id, updateBikePayload)
          );
          showSuccess('Chain added to cycle successfully');
          }
}

const getNewChainsCycle = (): (string | null)[] => {
  const chainCycleLength = props.bikeContext.chainsCycleLength || userSettingsStore?.userSettings?.defaultChainCycleLength || 3;
  return new Array(chainCycleLength).fill(null);
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