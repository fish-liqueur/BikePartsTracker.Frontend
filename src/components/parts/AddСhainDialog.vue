<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Add Chain to Cycle</div>
      </q-card-section>

      <q-tabs
        v-model="activeTab"
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="existing" label="Select existing chain" icon="" />
        <q-tab name="new" label="Add new chain" icon="" />
      </q-tabs>
      <q-tab-panels v-model="activeTab" animated class="tab-panels">
      <q-tab-panel name="existing">
        <q-card-section>
        <q-toggle
          v-model="showInstalledToOtherBikes"
          label="Show chains equipped to other bikes"
          color="primary"
          class="toggle-filter"
        />
        <q-select
          v-model="selectedChain"
          :options="availableChains"
          label="Select chain"
          map-options
          filled
          class="q-mt-md"
          option-label="name"
          option-value="id">
          <template v-slot:option="scope">
          <q-item v-bind="getItemAttrs(scope)" :class="getChainOptionClass(scope.opt)">
            <div class="chain-option__inner-container" >
              <q-item-section avatar>
                <q-icon :name="scope.opt.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label lines="1">{{ scope.opt.name }}</q-item-label>
                <q-item-label caption lines="1">{{ scope.opt.description }}</q-item-label>
                <q-item-label v-if="isEquippedToOtherBike(scope.opt)" overline lines="1">
                  {{ getOtherBikeString(scope.opt.bikeId) }}
                </q-item-label>
                <q-item-label v-else-if="isChainInCycle(scope.opt.id)" overline lines="1">
                  This chain is already in the cycle
                </q-item-label>
              </q-item-section>

            </div>
     
          </q-item>
        </template>
          </q-select>
      </q-card-section>
      </q-tab-panel>
      <q-tab-panel name="new">
        <PartForm
          ref="partFormRef"
          :initial-data="initialFormData"
          :lock-type="PartType.Chain"
          @update:isValid="(val) => isValid = val"
          @submit="handleSubmit"
        />
      </q-tab-panel>
    </q-tab-panels>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="handleCancel" />
        <q-btn
        v-if="activeTab === 'new'"
          flat
          label="Add chain"
          color="primary"
          @click="() => partFormRef?.handleSubmit()"
          :disable="!isValid"
        />
        <q-btn
        v-if="activeTab === 'existing'"
          flat
          label="Select chain"
          color="primary"
          @click="selectChain"
          :disable="!selectedChain"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import { usePartsStore } from '@/stores/partsStore';
import { useLayout } from '@/composables/useLayout';
import type { Bike, BikePart, CreatePartDto } from '@/types';
import { PartType } from '@/types';
import PartForm from './PartForm.vue';

interface Props {
  modelValue: boolean;
  basicPart?: BikePart | null;
  bikeContext: Bike;
}

const props = withDefaults(defineProps<Props>(), {
  targetBikeId: null,
  basicPart: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  create: [data: CreatePartDto,];
  select: [chain: BikePart];
  cancel: [];
}>();

const { showSuccess, showError, withAjaxBar } = useLayout();

const bikesStore = useBikesStore();
const partsStore = usePartsStore();
interface FormData extends Omit<CreatePartDto, 'description'> {
  description: string;
}

const isValid = ref(false);
const partFormRef = ref<ComponentPublicInstance & { handleSubmit: () => void } | null>(null);

// Compute initial form data when dialog opens
const initialFormData = computed(() => {
  if (!props.modelValue) {
    return undefined;
  }

  const data: Partial<FormData> = {
    name: '',
    description: '',
    partType: PartType.Other,
    brand: '',
    model: '',
    bikeId: '',
    mileageAtInstallation: 0
  };
  
  // If basicPart is provided, fill form with its values
  if (props.basicPart) {
    data.name = props.basicPart.name || '';
    data.description = props.basicPart.description || '';
    data.partType = props.basicPart.partType || PartType.Other;
    data.brand = props.basicPart.brand || '';
    data.model = props.basicPart.model || '';
    data.bikeId = props.basicPart.bikeId || '';
    data.mileageAtInstallation = props.basicPart.mileageAtInstallation || 0;
  }
  
  // If targetBikeId is provided and matches a bike, set it (overrides basicPart.bikeId if both are provided)
  if (props.bikeContext.id) {
    const targetBike = bikesStore.bikes.find(bike => bike.id === props.bikeContext.id);
    if (targetBike) {
      data.bikeId = props.bikeContext.id;
    }
  }
  
  return data;
});

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = (formData: FormData) => {
  // Create CreatePartDto - include all form fields
  // Note: description is included even though not in CreatePartDto type
  // as BikePart requires it and backend may accept it
  const createData: CreatePartDto = {
    name: formData.name,
    partType: formData.partType,
    brand: formData.brand || undefined,
    model: formData.model || undefined,
    bikeId: formData.bikeId || undefined,
    mileageAtInstallation: formData.mileageAtInstallation
  };
  // Include description if provided (backend may accept it)
  const dataWithDescription = formData.description 
    ? { ...createData, description: formData.description } as any
    : createData;
  emit('create', dataWithDescription);
  emit('update:modelValue', false);
};

const createNewChain = ref(false);
const showInstalledToOtherBikes = ref(false);
const selectedChain = ref<BikePart | null>(null);
const availableChains = computed(() => {
  const chains = partsStore.getPartsByPartType(PartType.Chain);
  if (!showInstalledToOtherBikes.value) {
    return chains.filter(chain => !chain.bikeId || chain.bikeId === props.bikeContext.id);
  }
  return chains.sort(availableChainsSortFunction);
});
const activeTab = ref('existing');
const getChainOptionClass = (chain: BikePart) => {
  return {
    'chain-option': true,
    'chain-option--on-this-bike': !!chain.bikeId && chain.bikeId === props.bikeContext.id,
    'chain-option--on-other-bike': isEquippedToOtherBike(chain),
    'chain-option--in-cycle': isChainInCycle(chain.id)
  };
};

interface QSelectOptionScope {
  itemProps: Record<string, any>;
  opt: BikePart;
  index: number;
  selected?: boolean;
}

const getItemAttrs = (itemScope: QSelectOptionScope) => {
  const { itemProps, opt } = itemScope;
  const attrs = { 
    ...itemProps,
    disable: isChainInCycle(opt.id),
      };
  return attrs;
};

const selectChain = () => {
  if (!selectedChain.value) {
    showError('Please select a chain');
    return;
  }
  console.log('selectChain', selectedChain.value, typeof selectedChain.value);
    emit('select', selectedChain.value as BikePart);
    emit('update:modelValue', false);
  };

  const isEquippedToOtherBike = (chain: BikePart) => {
    return chain.bikeId && chain.bikeId !== props.bikeContext.id;
  };

  const isChainInCycle = (chainId: string): boolean => {
    return props.bikeContext.chainsInCycle?.includes(chainId) || false;
  };

  const getOtherBikeString = (id: string) => {
    const bike = bikesStore.getBikeById(id);
    return bike ? `Equipped to other bike: ${bike.name}`  : 'Equipped to other bike';
  };

  const availableChainsSortFunction = (a: BikePart, b: BikePart) => {
    const aOnOtherBike = isEquippedToOtherBike(a);
    const bOnOtherBike = isEquippedToOtherBike(b);
    if (aOnOtherBike && !bOnOtherBike) {
      return 1;
    } else if (!aOnOtherBike && bOnOtherBike) {
      return -1;
    } else {
      return a.name.localeCompare(b.name);
    }
  };
</script>

<style scoped lang="css">
.chain-option {
 max-width: 30rem;
}
.chain-option--on-this-bike {
  background-color: rgba(33, 186, 69, 0.3);
}
.chain-option--on-other-bike {
  background-color: rgba(193, 0, 21, 0.2);
}
.chain-option--in-cycle {
  background-color: rgba(100, 100, 100, 0.4);
}

.chain-option__inner-container {
  width: 100%;
}
</style>


