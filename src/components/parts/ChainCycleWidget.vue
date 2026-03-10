<template>
    <div class="chain-cycle-widget">
      <div class="widget-header">
        <div class="header-left">
        <h2 class="widget-title">Chain cycle</h2>
        <span v-if="chainCyclesDetailed.length === 0" class="widget-no-cycles-text">- no chain cycles configured</span>
      </div>
      <div class="header-right">
        <ElementWithTooltipButton 
        v-if="chainCyclesDetailed.length > 0"
        tooltip-text="remove chain cycle">
          <q-btn
          label="Do not use chain cycle"
          color="accent"
          icon="remove_circle_outline"
          @click="handleRemoveChainCycle"
        />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton 
        v-else
        tooltip-text="add chain cycle">
        <q-btn
          label="Use chain cycle"
          color="primary"
          icon="add_circle_outline"
          @click="handleAddChainCycle"
        />
        </ElementWithTooltipButton>
      </div>
    </div>
    <div v-if="chainCyclesDetailed.length > 0" class="chain-cycle-widget__layout">
      <div v-for="chainCycle in chainCyclesDetailed" 
      :key="chainCycle.id" 
      class="chain-cycle-widget__chain-cycle-container">
        <div class="chain-cycle-widget__chains-visualizer">
            <ChainCard
                    v-for="(chain, index) in chainCycle.chains"
                    :key="chain?.id || `empty-${index}`"
                    :part="chain"
                    :is-active="chain?.id === chainCycle.activeChainId"
                    :bike-context="bikeContext"
                    :index="index"
                    :chain-cycle-id="chainCycle.id"
                    @on-select-chain="updateBikeChainCycle"
                />
        </div>
        <div class="chain-cycle-widget__data-container">
            <div class="chain-cycle-widget__data-container-item">
                Swap chain in <span>300</span> km 
            </div>
        </div>
      </div>    
    </div>
</div>
</template>

<script setup lang="ts">
// ---- Imports ----
import type { Bike, BikePart, ChainCycle, CreateChainCycleDto, CreatePartDto, UpdateBikeDto } from '@/types';
import { computed, ref, onMounted, watch } from 'vue';
import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import ChainCard from '@/components/cards/ChainCard.vue';
import AddChainDialog from '@/components/parts/AddСhainDialog.vue';
import ElementWithTooltipButton from '@/components/shared/ElementWithTooltipButton.vue';

// ---- Types / Interfaces ----
interface Props {
  bikeContext: Bike;
}

// ---- Props & Emits ----
const props = defineProps<Props>();

// ---- Stores & Composables ----
const bikesStore = useBikesStore();
const partsStore = usePartsStore();
const userSettingsStore = useUserSettingsStore();
const { showSuccess, showError, withAjaxBar } = useLayout();

// ---- State ----
const draggableChains = ref<BikePart[]>([]);
const showAddChainDialog = ref(false);

// ---- Computed ----
const chainCyclesDetailed = computed(() => {
  return props.bikeContext.chainCycles?.map(chainCycle => ({
  ...chainCycle,
  chains: chainCycle.chains?.map(id => partsStore.parts.find(part => part.id === id) as BikePart || null)
  })) || [];
});



// ---- Lifecycle ----

// ---- Methods ----
// const getDraggableChains = () => {
//     if (props.bikeContext.chainCycles.length === 0) {
//         throw new Error('Chains cycle not found for this bike');
//     }

//     if (activeChainIndex.value === -1) {
//         throw new Error('Active chain not found in chainsInCycle');
//     }

//     return props.bikeContext.chainsInCycle.map(id => partsStore.parts.find(part => part.id === id) || null) as (BikePart | null)[];
// }

const getNewChainCycles = (): CreateChainCycleDto[] => {
  const length = userSettingsStore?.userSettings?.defaultChainCycleLength || 3;
  const newChainCycles = [{
    chains: new Array(length).fill(null),
    activeChainId: null,
    intervalKm: userSettingsStore?.userSettings?.defaultChainCycleIntervalKm || 700,
    cycleLength: length,
  }] as CreateChainCycleDto[];
  
  return newChainCycles;
}



const handleRemoveChainCycle = async () => {
    try {
        await withAjaxBar(
            bikesStore.updateBike(props.bikeContext.id, { 
                chainCycles: []  
            })
        );
        showSuccess('Chain cycle removed successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove chain cycle';
        showError(errorMessage);
    }
}

const handleAddChainCycle = async () => {
  try {
    await withAjaxBar(
        bikesStore.updateBike(props.bikeContext.id, { 
            chainCycles: getNewChainCycles()  
        })
    );
    showSuccess('Chain cycle added successfully! Now you can add chains to the cycle.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add chain cycle';
    showError(errorMessage);
  }
}


const updateBikeChainCycle = async (newChainId: string, chainCycleId: string, index: number) => {
  try {


          const newChainCycles: ChainCycle[] = [ ...props.bikeContext.chainCycles ];
          const targetCycle = newChainCycles.find(chainCycle => chainCycle.id === chainCycleId);
          if (!targetCycle) {
            throw new Error('Chain cycle not found');
          }
          targetCycle.chains[index] = newChainId;


 
            
            await withAjaxBar(
              bikesStore.updateBike(props.bikeContext.id, { chainCycles: newChainCycles })
          );
          showSuccess('Chain added to cycle successfully');
          
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update bike with new chain';
    showError(errorMessage);
  }
}



// ---- Watchers ----


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

.header-left {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: flex-start;
  gap: 1rem;
}

.widget-no-cycles-text {
  
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