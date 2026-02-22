<template>
  <q-form @submit.prevent="handleSubmit" class="part-form">
    <q-input
      v-model="formData.name"
      label="Name *"
      filled
      :rules="[(val: string) => !!val || 'Name is required']"
    />

    <q-input
      v-model="formData.description"
      label="Description"
      type="textarea"
      filled
      rows="3"
      class="q-mt-md"
    />

    <q-select
      v-model="formData.partType"
      :options="partTypeOptions"
      label="Part Type *"
      emit-value
      map-options
      filled
      :rules="[(val: PartType | null) => !!val || 'Part type is required']"
      :disable="!!lockType"
      class="q-mt-md"
    />

    <q-input
      v-model="formData.brand"
      label="Brand"
      filled
      class="q-mt-md"
    />

    <q-input
      v-model="formData.model"
      label="Model"
      filled
      class="q-mt-md"
    />

    <q-select
      v-model="formData.bikeId"
      :options="bikeOptions"
      label="Bike"
      emit-value
      map-options
      option-label="name"
      option-value="id"
      filled
      clearable
      class="q-mt-md"
    />

    <q-input
      v-model.number="formData.mileageAtInstallation"
      label="Mileage at Installation *"
      type="number"
      filled
      :rules="[
        (val: number | null) => val !== null && val !== undefined && val >= 0 || 'Mileage must be a positive number'
      ]"
      class="q-mt-md"
    />
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import type { CreatePartDto } from '@/types';
import { PartType } from '@/types';

interface Props {
  initialData?: Partial<FormData>;
  lockType?: PartType | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  lockType: null
});

const emit = defineEmits<{
  submit: [data: FormData];
  'update:isValid': [value: boolean];
}>();

interface FormData extends Omit<CreatePartDto, 'description'> {
  description: string;
}

const bikesStore = useBikesStore();

const formData = ref<FormData>({
  name: '',
  description: '',
  partType: PartType.Other,
  brand: '',
  model: '',
  bikeId: '',
  mileageAtInstallation: 0
});

const partTypeOptions = [
  { label: 'Chain', value: PartType.Chain },
  { label: 'Cassette', value: PartType.Cassette },
  { label: 'Chainring', value: PartType.Chainring },
  { label: 'Brake Pads', value: PartType.BrakePads },
  { label: 'Tyres', value: PartType.Tyres },
  { label: 'Battery', value: PartType.Battery },
  { label: 'Bottom Bracket', value: PartType.BottomBracket },
  { label: 'Headset', value: PartType.Headset },
  { label: 'Hub', value: PartType.Hub },
  { label: 'Pedals', value: PartType.Pedals },
  { label: 'Other', value: PartType.Other }
];

const bikeOptions = computed(() => bikesStore.bikes);

// Initialize form from initialData prop
const initializeForm = () => {
  const initialPartType = props.lockType || props.initialData?.partType || PartType.Other;
  formData.value = {
    name: props.initialData?.name || '',
    description: props.initialData?.description || '',
    partType: initialPartType,
    brand: props.initialData?.brand || '',
    model: props.initialData?.model || '',
    bikeId: props.initialData?.bikeId || '',
    mileageAtInstallation: props.initialData?.mileageAtInstallation || 0
  };
};

// Watch for initialData changes (when parent wants to reset/update form)
watch(() => props.initialData, () => {
  initializeForm();
}, { immediate: true, deep: true });

// Watch for lockType changes
watch(() => props.lockType, (newLockType) => {
  if (newLockType) {
    formData.value.partType = newLockType;
  }
}, { immediate: true });

// Watch formData changes and emit validation updates
watch(formData, () => {
  emit('update:isValid', isValid.value);
}, { deep: true });

const isValid = computed(() => {
  return !!formData.value.name && 
         !!formData.value.partType &&
         formData.value.mileageAtInstallation !== null && 
         formData.value.mileageAtInstallation !== undefined &&
         formData.value.mileageAtInstallation >= 0;
});

// Handle form submit
const handleSubmit = () => {
  if (isValid.value) {
    emit('submit', { ...formData.value });
  }
};

// Expose methods and state for parent component access
defineExpose({
  formData,
  isValid,
  reset: initializeForm,
  handleSubmit
});
</script>

<style scoped lang="css">
.part-form {
  display: flex;
  flex-direction: column;
}
</style>

