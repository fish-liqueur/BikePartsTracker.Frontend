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
        <q-form @submit.prevent="handleCreate" class="part-form">
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
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="handleCancel" />
        <q-btn
          flat
          label="Create Part"
          color="primary"
          @click="handleCreate"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import type { BikePart, CreatePartDto } from '@/types';
import { PartType } from '@/types';

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

// Initialize form when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm();
    
    // If basicPart is provided, fill form with its values
    if (props.basicPart) {
      formData.value = {
        name: props.basicPart.name || '',
        description: props.basicPart.description || '',
        partType: props.basicPart.partType || PartType.Other,
        brand: props.basicPart.brand || '',
        model: props.basicPart.model || '',
        bikeId: props.basicPart.bikeId || '',
        mileageAtInstallation: props.basicPart.mileageAtInstallation || 0
      };
    }
    
    // If targetBikeId is provided and matches a bike, set it (overrides basicPart.bikeId if both are provided)
    if (props.targetBikeId) {
      const targetBike = bikesStore.bikes.find(bike => bike.id === props.targetBikeId);
      if (targetBike) {
        formData.value.bikeId = props.targetBikeId;
      }
    }
  }
}, { immediate: true });

const isValid = computed(() => {
  return !!formData.value.name && 
         !!formData.value.partType &&
         formData.value.mileageAtInstallation !== null && 
         formData.value.mileageAtInstallation !== undefined &&
         formData.value.mileageAtInstallation >= 0;
});

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    partType: PartType.Other,
    brand: '',
    model: '',
    bikeId: '',
    mileageAtInstallation: 0
  };
};

const handleCancel = () => {
  resetForm();
  emit('update:modelValue', false);
};

const handleCreate = () => {
  if (isValid.value) {
    // Create CreatePartDto - include all form fields
    // Note: description is included even though not in CreatePartDto type
    // as BikePart requires it and backend may accept it
    const createData: CreatePartDto = {
      name: formData.value.name,
      partType: formData.value.partType,
      brand: formData.value.brand || undefined,
      model: formData.value.model || undefined,
      bikeId: formData.value.bikeId || undefined,
      mileageAtInstallation: formData.value.mileageAtInstallation
    };
    // Include description if provided (backend may accept it)
    const dataWithDescription = formData.value.description 
      ? { ...createData, description: formData.value.description } as any
      : createData;
    emit('create', dataWithDescription);
    resetForm();
  }
};
</script>

<style scoped lang="css">
.part-form {
  display: flex;
  flex-direction: column;
}
</style>

