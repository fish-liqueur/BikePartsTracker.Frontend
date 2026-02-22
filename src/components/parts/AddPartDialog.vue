<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Create Part</div>
      </q-card-section>

      <q-card-section>
        <PartForm
          ref="partFormRef"
          :initial-data="initialFormData"
          @update:isValid="(val) => isValid = val"
          @submit="handleSubmit"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="handleCancel" />
        <q-btn
          flat
          label="Create Part"
          color="primary"
          @click="() => partFormRef?.handleSubmit()"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import type { BikePart, CreatePartDto } from '@/types';
import { PartType } from '@/types';
import PartForm from './PartForm.vue';

interface Props {
  modelValue: boolean;
  targetBikeId?: string | null;
  basicPart?: BikePart | null;
}

const props = withDefaults(defineProps<Props>(), {
  targetBikeId: null,
  basicPart: null
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  create: [data: CreatePartDto];
  cancel: [];
}>();

const bikesStore = useBikesStore();

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
  if (props.targetBikeId) {
    const targetBike = bikesStore.bikes.find(bike => bike.id === props.targetBikeId);
    if (targetBike) {
      data.bikeId = props.targetBikeId;
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
</script>


