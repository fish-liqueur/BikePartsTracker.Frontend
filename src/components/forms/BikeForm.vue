<template>
  <q-form @submit.prevent="handleSubmit" class="form-general">
    <q-input
      v-model="formData.name"
      label="Bike Name *"
      placeholder="e.g., Road Bike, Mountain Bike"
      filled
      standout
      :rules="[(val: string) => !!val || 'Bike name is required']"
      class="m-0 p-0"
    />

    <q-select
      v-model="formData.type"
      :options="bikeTypeOptions"
      label="Bike Type *"
      emit-value
      map-options
      filled
      :rules="[(val: BikeType | null | undefined) => !!val || 'Bike type is required']"
      class="m-0 p-0"
    />
  </q-form>
</template>

<script setup lang="ts">
import {
  ref, computed, watch 
} from 'vue';
import type { CreateBikeDto } from '@/types';
import { BikeType } from '@/types';
import { bikeTypeOptions } from '@/components/shared/bikeTypeOptions';

interface Props {
  initialData?: Partial<CreateBikeDto>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: CreateBikeDto];
  'update:isValid': [value: boolean];
}>();

const formData = ref<CreateBikeDto>({
  name: '',
  type: BikeType.Other,
  description: '',
  totalDistance: 0,
  stravaDistance: 0,
});

const initializeForm = () => {
  formData.value = {
    name: props.initialData?.name ?? '',
    type: props.initialData?.type ?? BikeType.Other,
    description: props.initialData?.description ?? '',
    totalDistance: props.initialData?.totalDistance ?? 0,
    stravaDistance: props.initialData?.stravaDistance ?? 0,
  };
};

watch(
  () => props.initialData,
  () => {
    initializeForm();
  },
  { immediate: true, deep: true }
);

watch(
  formData,
  () => {
    emit('update:isValid', isValid.value);
  },
  { deep: true }
);

const isValid = computed(() => {
  return !!formData.value.name && !!formData.value.type;
});

const handleSubmit = () => {
  if (isValid.value) {
    emit('submit', { ...formData.value });
  }
};

defineExpose({
  formData,
  isValid,
  reset: initializeForm,
  handleSubmit
});
</script>
