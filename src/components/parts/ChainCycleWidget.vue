<template>
  <div class="chain-cycle-widget">
    <div class="chain-cycle-widget__header">
      <div class="header-left">
        <h2 class="widget-title">Chain cycle</h2>
        <span v-if="chainCyclesDetailed.length === 0" class="widget-no-cycles-text">- no chain cycles configured</span>
      </div>
      <div class="header-right">
        <ElementWithTooltipButton v-if="chainCyclesDetailed.length > 0" tooltip-text="remove chain cycle">
          <q-btn label="Delete all chain cycles"
                 color="accent"
                 icon="remove_circle_outline"
                 @click="handleRemoveAllChainCycles" />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton v-else tooltip-text="add chain cycle">
          <q-btn label="Use chain cycle"
                 color="primary"
                 icon="add_circle_outline"
                 @click="handleAddChainCycle" />
        </ElementWithTooltipButton>
      </div>
    </div>
    <div v-if="chainCyclesDetailed.length > 0" class="chain-cycle-widget__layout">
      <div v-for="(chainCycle, index) in chainCyclesDetailed"
           :key="chainCycle.id"
           class="chain-cycle-item">
        <div class="chain-cycle-item__chains-visualizer">
          <template v-for="(chain, index) in chainCycle.chains" :key="chain?.id || `empty-${index}`">
            <ChainCard v-if="chain"
                       :key="chain?.id"
                       :part="chain"
                       :is-active="chain?.id === chainCycle.activeChainId"
                       :bike-context="bikeContext"
                       :index="index"
                       :chain-cycle-id="chainCycle.id"
                       @on-select-chain="updateBikeChainCycle" />
            <ChainCardEmpty v-else
                            :key="`empty-${index}`"
                            :index="index"
                            :chain-cycle-id="chainCycle.id"
                            :bike-context="bikeContext"
                            @on-select-chain="updateBikeChainCycle"
                            @on-create-chain="handleUserCreateChain" />
          </template>
        </div>
        <div class="chain-cycle-item__data-container">
          <div class="chain-cycle-item__data-container-item">
            Swap chain in <span>300</span> km
            <div class="display-flex flex-column align-center justify-center gap-2">
              <ElementWithTooltipButton :tooltip-text="deleteChainCycleTooltipText">
                <q-btn label="Delete chain cycle"
                       color="danger"
                       outline
                       @click="handleRemoveChainCycle(chainCycle.id)" />
              </ElementWithTooltipButton>

              <ElementWithTooltipButton v-if="index === chainCyclesDetailed.length - 1"
                                        :tooltip-text="addMoreChainCyclesTooltipText">
                <q-btn label="+1 chain cycle"
                       color="primary"
                       outline
                       @click="handleAddMoreChainCycle" />
              </ElementWithTooltipButton>

            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ---- Imports ----
import type {
  Bike, BikePart, ChainCycle, CreateChainCycleDto, CreatePartDto 
} from '@/types';
import {
  computed
} from 'vue';
import { useQuasar } from 'quasar';
// import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import ChainCard from '@/components/cards/ChainCard.vue';
import ChainCardEmpty from '@/components/cards/ChainCardEmpty.vue';
// import AddChainDialog from '@/components/parts/AddСhainDialog.vue';
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
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();
const $q = useQuasar();

// ---- State ----
const addMoreChainCyclesTooltipText = `You can add more that one chain cycle to a single bike.
Why may you possibly need it?
Maybe you have a tandem with several chains running at once. Or a crazy DIY tallbike? 
Anyway, you are the boss!
In case of multiple chain cycles, each ride of this bike will add mileage for each active 
chain in every cycle.`;
const deleteChainCycleTooltipText = `Remove this chain cycle from the bike.
Chains in this cycle will not be deleted, but the cycle configuration will be removed.`;

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
const updateBikeChainCycle = async (
  newChainId: string, chainCycleId: string, index: number
) => {
  try {
    const newChainCycles: ChainCycle[] = [...props.bikeContext.chainCycles];
    const targetCycle = newChainCycles.find(chainCycle => chainCycle.id === chainCycleId);
    if (!targetCycle) {
      throw new Error('Chain cycle not found');
    }
    targetCycle.chains[index] = newChainId;
    await withAjaxBar(bikesStore.updateBike(props.bikeContext.id, { chainCycles: newChainCycles }));
    showSuccess('Chain added to cycle successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update bike with new chain';
    showError(errorMessage);
  }
};

const getNewChainCycles = (): CreateChainCycleDto[] => {
  const length = userSettingsStore?.userSettings?.defaultChainCycleLength || 3;
  const newChainCycles = [{
    chains: new Array(length).fill(null),
    activeChainId: null,
    intervalKm: userSettingsStore?.userSettings?.defaultChainCycleIntervalKm || 700,
    cycleLength: length,
  }] as CreateChainCycleDto[];

  return newChainCycles;
};

const handleAddMoreChainCycle = async () => {
  $q.dialog({
    title: 'Add one extra chain cycle?',
    message: 'In case of multiple chain cycles, each ride of this bike will add mileage for each active chain in every cycle. Is that what you want?',
    cancel: true,
    persistent: false,
  }).onOk(async () => {
    try {
      await withAjaxBar(bikesStore.updateBike(props.bikeContext.id, {
        chainCycles: [...props.bikeContext.chainCycles, ...getNewChainCycles()]
      }));
      showSuccess('Extra chain cycle added successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add chain cycle';
      showError(errorMessage);
    }
  });
};

const handleRemoveAllChainCycles = async () => {
  $q.dialog({
    title: 'Delete all chain cycles?',
    message: 'All chain cycles will be deleted. The chains in these cycles will not be deleted, but the cycle configuration will be erased.',
    cancel: true,
    persistent: false,
  }).onOk(async () => {
    try {
      await withAjaxBar(bikesStore.updateBike(props.bikeContext.id, {
        chainCycles: []
      }));
      showSuccess('Chain cycles removed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove chain cycle';
      showError(errorMessage);
    }
  });
};

const handleRemoveChainCycle = (chainCycleId: string) => {
  $q.dialog({
    title: 'Delete chain cycle?',
    cancel: true,
    persistent: false,
  }).onOk(async () => {
    try {
      await withAjaxBar(bikesStore.updateBike(props.bikeContext.id, {
        chainCycles: props.bikeContext.chainCycles?.filter(chainCycle => chainCycle.id !== chainCycleId)
      }));
      showSuccess('Chain cycle removed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove chain cycle';
      showError(errorMessage);
    }
  });
};

const handleAddChainCycle = async () => {
  try {
    await withAjaxBar(bikesStore.updateBike(props.bikeContext.id, {
      chainCycles: getNewChainCycles()
    }));
    showSuccess('Chain cycle added successfully! Now you can add chains to the cycle.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add chain cycle';
    showError(errorMessage);
  }
};

const handleUserCreateChain = async (
  chain: CreatePartDto, chainCycleId: string, index: number
) => {
  try {
    const newChain = await withAjaxBar(partsStore.createPart(chain));
    showSuccess('Chain created successfully');
    if (newChain) {
      await updateBikeChainCycle(
        newChain.id, chainCycleId, index
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create chain';
    showError(errorMessage);
  }
};

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

.chain-cycle-widget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.chain-cycle-widget__layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.chain-cycle-item {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: flex-start;
  gap: 1rem;
}

.widget-no-cycles-text {}

.chain-cycle-item__chains-visualizer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 600px;
  max-width: 100%;
  border-radius: 1rem;
  border: 1px solid var(--q-positive);
  background-color: rgba(33, 186, 69, 0.1);
  padding: 1rem;
}

.chain-cycle-item__data-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>