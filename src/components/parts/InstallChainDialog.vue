<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6 mb-2">{{ `Adding Chain to ${props.targetBike?.name || ''}` }}</div>
        <div class="text-subtitle1">{{ currentStatusText }}</div>
      </q-card-section>
      <q-tabs v-model="activeTab"
              class="text-grey"
              active-color="primary"
              indicator-color="primary">
        <q-tab name="with-chain-cycle"
               label="Chain Cycle"
               icon="" />
        <q-tab name="without-chain-cycle"
               label="Without Chain Cycle"
               icon=""
               :disable="isAlreadyInstalled" />
      </q-tabs>
      <q-tab-panels v-model="activeTab"
                    animated
                    class="tab-panels">
        <q-tab-panel name="with-chain-cycle">
          <div v-if="formChainCycles.length === 0">
            <div class="q-mb-md">This bike has no chain cycle, add one?</div>
            <q-btn
              label="Add chain cycle"
              color="primary"
              unelevated
              @click="handleAddChainCycleToForm"
            />
          </div>
          <div v-else>
          <div class="q-mb-md">Add chain into Chain Cycle</div>

          <div
            v-for="cycle in formChainCycles"
            :key="cycle._key"
            class="chain-cycle-install-section"
          >
            <div class="chain-cycle-install-section__radios">
              <q-radio
                v-for="(slotChainId, slotIndex) in cycle.chains"
                :key="`${cycle._key}-${slotIndex}`"
                :model-value="getSelectedSlotIndexForCycle(cycle._key)"
                :val="slotIndex"
                @update:model-value="(val: number) => handleSlotSelect(cycle._key, val)"
              >
                <div class="chain-cycle-install-slot-label">
                  <span v-if="slotChainId">
                    <span
                      v-if="slotChainId === cycle.activeChainId"
                      class="chain-cycle-install-slot-label--active"
                    >
                      {{ getChainName(slotChainId) }} (installed now)
                    </span>
                    <span v-else>
                      {{ getChainName(slotChainId) }}
                    </span>
                  </span>
                  <span v-else-if="slotIndex === selectedSlot?.slotIndex" class="chain-cycle-install-slot-label--new">
                    {{ chain?.name }} (new)
                  </span>
                  <span v-else class="chain-cycle-install-slot-label--empty">
                    empty!
                  </span>
                </div>
              </q-radio>
            </div>
          </div>

          <!-- Section 1.2 -->
          <div class="q-mt-md">
            <q-toggle
              v-model="setAsActive"
              color="primary"
              label="set as active (you are physically installing chain to the bike)"
            />

            <!-- Section 1.2.1 -->
            <div v-if="setAsActive" class="q-mt-md">
              <DateTimePicker v-model="installationTime" label="installation time" />
            </div>
          </div>
        </div>
        </q-tab-panel>
        <q-tab-panel name="without-chain-cycle">
          <DateTimePicker v-model="installationTime" label="installation time" />
        </q-tab-panel>
      </q-tab-panels>
      <q-card-section>
        <q-input
          v-model.number="mileageAtInstallation"
          label="Mileage at Installation"
          type="number"
          filled
          :rules="[
            (val: number | null) => val !== null && val !== undefined && val >= 0 || 'Mileage must be a positive number'
          ]"
          class="q-mt-md"
        />
        
      </q-card-section>

      <!-- Section 2 -->


      <q-card-actions align="between">
        <!-- Section 3 -->
         <div class="row justify-between gap-2">
          <q-btn flat label="Cancel" color="primary" @click="$emit('cancel')" />
          <q-btn flat label="Reset" color="primary" @click="handleReset" />
         </div>
        <q-btn          
          label="Add chain"
          color="primary"
          :disable="isAddButtonDisabled"
          @click="handleClickAddButton"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Bike, BikePart, ChainCycle } from '@/types';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useChainCyclesStore } from '@/stores/chainCyclesStore';
import DateTimePicker from '@/components/shared/DateTimePicker.vue';

type ChainCycleWithNulls = {
  id?: string;
  chains: Array<string | null>;
  activeChainId: string | null;
  intervalKm?: number;
  cycleLength?: number;
};

interface FormChainCycle extends ChainCycleWithNulls {
  _key: string;
}

interface Props {
  modelValue: boolean;
  chain: BikePart | null;
  targetBike: Bike | null;
  currentBikeMileage?: number;
  preselectedChainCycleId?: string | null;
  preselectedSlotIndex?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentBikeMileage: 0,
  targetBike: null,
  preselectedChainCycleId: null,
  preselectedSlotIndex: null
});

export interface DisplacedChainInfo {
  chainId: string;
  chainName: string;
  fromIndex: number;
  toIndex: number | null;
}

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  cancel: [];
  'install-without-chain-cycle': [
    data: { installationDate: Date; mileageAtInstallation: number }
  ];
  'install-within-chain-cycle': [
    data: {
      chainCycleId: string;
      position: number;
      setAsActive: boolean;
      installationTime?: Date;
      displacedChain?: DisplacedChainInfo | null;
    }
  ];
}>();

const partsStore = usePartsStore();
const userSettingsStore = useUserSettingsStore();
const chainCyclesStore = useChainCyclesStore();

const activeTab = ref('with-chain-cycle');
const formChainCycles = ref<FormChainCycle[]>([]);
const selectedSlot = ref<{ chainCycleKey: string; slotIndex: number } | null>(null);
const setAsActive = ref(false);
const installationTime = ref<Date | undefined>(new Date());
const mileageAtInstallation = ref<number>(props.currentBikeMileage || 0);
const originalChainsMap = ref<Map<string, Array<string | null>>>(new Map());
const displacedChain = ref<DisplacedChainInfo | null>(null);

const currentStatusText = computed(() => {
  if (activeTab.value !== 'with-chain-cycle') {
    return `Adding chain ${props.chain?.name} without a chain cycle (as an ordinary part)`;
  }

  let text = `Adding chain ${props.chain?.name} into Chain Cycle`;
  if (selectedSlot.value?.slotIndex !== undefined) {
    text += ` into slot ${selectedSlot.value.slotIndex + 1}`;
  }
  if (setAsActive.value) {
    text += ' and setting it as active';
  }2
  if (displacedChain.value) {
    if (displacedChain.value.toIndex !== null) {
      text += `, moving ${displacedChain.value.chainName} to slot ${displacedChain.value.toIndex + 1}`;
    } else {
      text += `, removing ${displacedChain.value.chainName} from the chain cycle`;
    }
  }

  return text;
});
const isAddButtonDisabled = computed(() => {
  if (activeTab.value === 'without-chain-cycle') return false;
  if (formChainCycles.value.length === 0) return true;
  if (!selectedSlot.value) return true;
  if (setAsActive.value && !installationTime.value) return true;
  return false;
});
const isAlreadyInstalled = computed(() => {
  return props.chain?.bikeId === props.targetBike?.id;
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      if (props.targetBike?.id) {
        await chainCyclesStore.fetchChainCycles(props.targetBike.id);
      }
      initForm();
    }
  },
  { immediate: true }
);

/** Build FormChainCycle[] from API chain cycles. */
const chainCyclesNormalized = (bike: Bike | null, cycles: ChainCycle[]): FormChainCycle[] => {
  if (!bike?.id || !cycles?.length) return [];

  return cycles.map((cycle, index) => {
    const chains = (cycle.chains ?? []).map((c) =>
      c == null ? null : String(c)
    ) as Array<string | null>;
    return {
      id: cycle.id,
      _key: cycle.id || `cycle-${index}`,
      chains,
      activeChainId: cycle.activeChainId == null ? null : String(cycle.activeChainId),
      intervalKm: cycle.intervalKm ?? undefined,
      cycleLength: chains.length
    };
  });
};

const createEmptyChainCycle = (): FormChainCycle => {
  const length = userSettingsStore.userSettings?.defaultChainCycleLength ?? 3;
  const intervalKm = userSettingsStore.userSettings?.defaultChainCycleIntervalKm ?? 700;

  return {
    _key: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: undefined,
    chains: new Array(length).fill(null),
    activeChainId: null,
    intervalKm,
    cycleLength: length
  };
};

const findEmptySlot = (chains: Array<string | null>, fromIndex: number): number | null => {
  const len = chains.length;
  for (let i = 1; i < len; i++) {
    const idx = (fromIndex + i) % len;
    if (chains[idx] === null) return idx;
  }
  return null;
};

const getChainName = (chainId: string): string => {
  const chain = partsStore.getPartById(chainId) as BikePart | undefined;
  return chain?.name || chainId;
};

const getSelectedSlotIndexForCycle = (cycleKey: string): number | null => {
  if (!selectedSlot.value) return null;
  return selectedSlot.value.chainCycleKey === cycleKey ? selectedSlot.value.slotIndex : null;
};


const initForm = () => {
  const cycles = props.targetBike?.id
    ? chainCyclesStore.getChainCyclesForBike(props.targetBike.id)
    : [];
  formChainCycles.value = chainCyclesNormalized(props.targetBike, cycles);
  setAsActive.value = true;
  installationTime.value = new Date();
  displacedChain.value = null;

  originalChainsMap.value = new Map(
    formChainCycles.value.map(c => [c._key, [...c.chains]])
  );

  if (props.preselectedSlotIndex != null && formChainCycles.value.length > 0) {
    const cycle = props.preselectedChainCycleId
      ? formChainCycles.value.find(c => c.id === props.preselectedChainCycleId)
      : formChainCycles.value[0];
    if (cycle && props.preselectedSlotIndex < cycle.chains.length) {
      handleSlotSelect(cycle._key, props.preselectedSlotIndex);
      return;
    }
  }
  selectedSlot.value = null;
};

const handleAddChainCycleToForm = async () => {
  if (formChainCycles.value.length > 0 || !props.targetBike?.id) return;
  const intervalKm = userSettingsStore.userSettings?.defaultChainCycleIntervalKm ?? 700;
  const n = userSettingsStore.userSettings?.defaultChainCycleLength ?? 3;
  const newCycle = await chainCyclesStore.createChainCycle({
    bikeId: props.targetBike.id,
    chains: Array(n).fill(null),
    intervalKm
  });
  if (newCycle) {
    formChainCycles.value = [{
      id: newCycle.id,
      _key: newCycle.id,
      chains: (newCycle.chains ?? []).map(c => (c == null ? null : String(c))) as Array<string | null>,
      activeChainId: newCycle.activeChainId == null ? null : String(newCycle.activeChainId),
      intervalKm: newCycle.intervalKm ?? undefined,
      cycleLength: (newCycle.chains ?? []).length
    }];
  }
};

const handleSlotSelect = (cycleKey: string, slotIndex: number) => {
  for (const cycle of formChainCycles.value) {
    const original = originalChainsMap.value.get(cycle._key);
    if (original) {
      cycle.chains = [...original];
    }
  }
  displacedChain.value = null;

  const cycle = formChainCycles.value.find(c => c._key === cycleKey);
  if (!cycle) return;

  const existingChainId = cycle.chains[slotIndex];
  if (existingChainId) {
    const emptyIndex = findEmptySlot(cycle.chains, slotIndex);

    if (emptyIndex !== null) {
      cycle.chains[emptyIndex] = existingChainId;
    }
    cycle.chains[slotIndex] = null;

    displacedChain.value = {
      chainId: existingChainId,
      chainName: getChainName(existingChainId),
      fromIndex: slotIndex,
      toIndex: emptyIndex,
    };
  }

  selectedSlot.value = { chainCycleKey: cycleKey, slotIndex };
};

const handleReset = () => {
  initForm();
};

const handleAddWithoutChainCycle = () => {
  emit('install-without-chain-cycle', {
    installationDate: new Date(),
    mileageAtInstallation: props.currentBikeMileage
  });
};

const handleAddWithinChainCycle = () => {
  if (!selectedSlot.value) return;

  const partId = props.chain?.id;
  if (!partId) return;

  const cycle = formChainCycles.value.find((c) => c._key === selectedSlot.value?.chainCycleKey);
  if (!cycle?.id) return;

  emit('install-within-chain-cycle', {
    chainCycleId: cycle.id,
    position: selectedSlot.value.slotIndex,
    setAsActive: setAsActive.value,
    installationTime: setAsActive.value && installationTime.value ? installationTime.value : undefined,
    displacedChain: displacedChain.value ?? null
  });
};

const handleClickAddButton = () => {
  if (activeTab.value === 'with-chain-cycle') {
    handleAddWithinChainCycle();
  } else {
    handleAddWithoutChainCycle();
  }
};
</script>

<style scoped lang="css">
.chain-cycle-install-section__radios {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.chain-cycle-install-slot-label {
  display: inline-block;
  padding-left: 4px;
}

.chain-cycle-install-slot-label--active {
  font-weight: 700;
}

.chain-cycle-install-slot-label--empty {
  color: var(--q-primary);
  font-weight: 600;
}
</style>

