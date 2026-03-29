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
                       @on-select-chain="updateBikeChainCycle"
                       @on-remove-chain-from-bike="handleRemoveChainFromBike" />
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
            <div class="display-flex flex-row flex-align-center gap-2">
              <span>Chains:</span>
              <q-radio
                v-for="option in chainCycleLengthOptions"
                :key="option"
                :value="option"
                :val="option"
                :model-value="chainCycle.chains?.length ?? 2"
                @update:model-value="(val) => handleUpdateChainCycleLength(val, chainCycle.id)"
              >
                {{ option }}
              </q-radio>
            </div>
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
  Bike, BikePart, CreatePartDto
} from '@/types';
import { EMPTY_GUID } from '@/types';
import {
  computed
} from 'vue';
import { useQuasar } from 'quasar';
// import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useChainCyclesStore } from '@/stores/chainCyclesStore';
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
const chainCyclesStore = useChainCyclesStore();
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
const chainCycleLengthOptions = [2, 3];

function mergePartIntoChainsSlots(
  chainIds: (string | null)[],
  partId: string,
  index: number
): (string | null)[] {
  const next = [...chainIds].map(id =>
    id != null && String(id) === String(partId) ? null : id
  );
  while (next.length <= index) next.push(null);
  next[index] = partId;
  return next;
}

// ---- Computed ----
const chainCycles = computed(() => chainCyclesStore.getChainCyclesForBike(props.bikeContext.id));

/** Resolve chain slot IDs to BikePart for display. */
const chainCyclesDetailed = computed(() => {
  const cycles = chainCycles.value;
  if (!cycles.length) return [];

  return cycles.map(chainCycle => {
    const chainsResolved: (BikePart | null)[] = (chainCycle.chains ?? []).map(id =>
      id ? partsStore.parts.find(p => p.id === id) ?? null : null
    );
    return { ...chainCycle, chains: chainsResolved };
  });
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
    const part = partsStore.getPartById(newChainId);
    if (part && part.bikeId !== props.bikeContext.id) {
      await withAjaxBar(
        partsStore.updatePart(newChainId, { bikeId: props.bikeContext.id })
      );
    }
    const targetCycle = chainCyclesStore.getChainCyclesForBike(props.bikeContext.id)
      .find(c => c.id === chainCycleId);
    if (!targetCycle) throw new Error('Chain cycle not found');
    const newChains = mergePartIntoChainsSlots(targetCycle.chains ?? [], newChainId, index);
    await withAjaxBar(
      chainCyclesStore.updateChainCycle(chainCycleId, props.bikeContext.id, { chains: newChains })
    );
    showSuccess('Chain added to cycle successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update bike with new chain';
    showError(errorMessage);
  }
};

const defaultSlotCount = () => userSettingsStore?.userSettings?.defaultChainCycleLength || 3;

const handleAddMoreChainCycle = async () => {
  $q.dialog({
    title: 'Add one extra chain cycle?',
    message: 'In case of multiple chain cycles, each ride of this bike will add mileage for each active chain in every cycle. Is that what you want?',
    cancel: true,
    persistent: false,
  }).onOk(async () => {
    try {
      const n = defaultSlotCount();
      await withAjaxBar(chainCyclesStore.createChainCycle({
        bikeId: props.bikeContext.id,
        chains: Array(n).fill(null),
        intervalKm: userSettingsStore?.userSettings?.defaultChainCycleIntervalKm || 700
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
      const cycles = chainCycles.value;
      await withAjaxBar(Promise.all(cycles.map(c => chainCyclesStore.deleteChainCycle(c.id, props.bikeContext.id))));
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
      await withAjaxBar(chainCyclesStore.deleteChainCycle(chainCycleId, props.bikeContext.id));
      showSuccess('Chain cycle removed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove chain cycle';
      showError(errorMessage);
    }
  });
};

const handleAddChainCycle = async () => {
  try {
    const n = defaultSlotCount();
    await withAjaxBar(chainCyclesStore.createChainCycle({
      bikeId: props.bikeContext.id,
      chains: Array(n).fill(null),
      intervalKm: userSettingsStore?.userSettings?.defaultChainCycleIntervalKm || 700
    }));
    showSuccess('Chain cycle added successfully! Now you can add chains to the cycle.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add chain cycle';
    showError(errorMessage);
  }
};

const handleUpdateChainCycleLength = async (length: number, chainCycleId: string) => {
  try {
    const targetCycle = chainCycles.value.find(c => c.id === chainCycleId);
    if (!targetCycle) throw new Error('Chain cycle not found');

    const cur = [...(targetCycle.chains ?? [])];
    let newChains = [...cur];
    let activeChainId = targetCycle.activeChainId ?? null;

    if (length < newChains.length) {
      const dropped = newChains.slice(length);
      newChains = newChains.slice(0, length);
      const droppedIds = dropped.filter((id): id is string => id != null);
      if (activeChainId && droppedIds.includes(activeChainId)) {
        activeChainId = null;
      }
    } else {
      while (newChains.length < length) newChains.push(null);
    }

    const dto: { chains: (string | null)[]; activeChainId?: string } = { chains: newChains };
    const prevActive = targetCycle.activeChainId ?? null;
    if (activeChainId !== prevActive) {
      dto.activeChainId = activeChainId === null ? EMPTY_GUID : activeChainId;
    }

    await withAjaxBar(
      chainCyclesStore.updateChainCycle(chainCycleId, props.bikeContext.id, dto)
    );
    showSuccess('Chain cycle length updated successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update chain cycle length';
    showError(errorMessage);
  }
};

const handleUserCreateChain = async (
  chain: CreatePartDto, chainCycleId: string, index: number
) => {
  try {
    const newChain = await withAjaxBar(partsStore.createPart({
      ...chain,
      bikeId: props.bikeContext.id
    }));
    showSuccess('Chain created successfully');
    if (newChain) {
      const targetCycle = chainCyclesStore.getChainCyclesForBike(props.bikeContext.id)
        .find(c => c.id === chainCycleId);
      if (targetCycle) {
        const newChains = mergePartIntoChainsSlots(targetCycle.chains ?? [], newChain.id, index);
        await withAjaxBar(
          chainCyclesStore.updateChainCycle(chainCycleId, props.bikeContext.id, { chains: newChains })
        );
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create chain';
    showError(errorMessage);
  }
};

const handleRemoveChainFromBike = async (chainId: string) => {
  try {
    await withAjaxBar(partsStore.movePartToBike(chainId, null));
    showSuccess('Chain removed from bike successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove chain from bike';
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
  align-items: normal;
  justify-content: center;
  gap: 1rem;
  width: 600px;
  max-width: 100%;
  border-radius: 1rem;
  border: 1px solid var(--q-positive);
  background-color: rgba(33, 186, 69, 0.1);
  padding: 1rem;
}

.chain-cycle-item__chains-visualizer > div {
  flex: 1 1 50%;
}

.chain-cycle-item__data-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>