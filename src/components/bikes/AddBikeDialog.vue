<template>
  <q-dialog v-model="localShow" @update:model-value="handleDialogUpdate">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Add New Bike</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="bike-form">
          <q-input
            v-model="newBike.name"
            label="Bike Name *"
            placeholder="e.g., Road Bike, Mountain Bike"
            :rules="[val => !!val || 'Bike name is required']"
            outlined
            dense
          />
          <q-select
            v-model="newBike.type"
            :options="bikeTypeOptions"
            label="Bike Type *"
            emit-value
            map-options
            :rules="[val => !!val || 'Bike type is required']"
            outlined
            dense
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat
               label="Cancel"
               color="primary"
               @click="handleCancel" />
        <q-btn flat
               label="Add Bike"
               color="primary"
               @click="handleSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { CreateBikeDto } from '@/types';
import { BikeType } from '@/types';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [bikeData: CreateBikeDto];
}>();

const localShow = ref(props.modelValue);
const newBike = ref<CreateBikeDto>({
  name: '',
  type: BikeType.Other,
  description: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  parts: [],
  totalDistance: 0,
  stravaDistance: 0,
});

const bikeTypeOptions = [
  { label: 'Road', value: BikeType.Road },
  { label: 'Mountain', value: BikeType.Mountain },
  { label: 'Gravel', value: BikeType.Gravel },
  { label: 'E-Bike', value: BikeType.EBike },
  { label: 'City', value: BikeType.City },
  { label: 'Touring', value: BikeType.Touring },
  { label: 'Cargo', value: BikeType.Cargo },
  { label: 'Fixed', value: BikeType.Fixed },
  { label: 'Rat', value: BikeType.Rat },
  { label: 'Other', value: BikeType.Other },
];

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  localShow.value = newValue;
  if (newValue) {
    // Reset form when dialog opens
    resetForm();
  }
});

// Watch for internal changes to localShow
watch(localShow, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleDialogUpdate = (value: boolean) => {
  localShow.value = value;
  if (!value) {
    resetForm();
  }
};

const resetForm = () => {
  newBike.value = {
    name: '',
    type: BikeType.Other,
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    parts: [],
    totalDistance: 0,
    stravaDistance: 0,
  };
};

const handleCancel = () => {
  localShow.value = false;
  resetForm();
};

const handleSubmit = () => {
  // Validate form
  if (!newBike.value.name || !newBike.value.type) {
    return;
  }

  emit('submit', { ...newBike.value });
  resetForm();
};
</script>

<style scoped lang="css">
.bike-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

