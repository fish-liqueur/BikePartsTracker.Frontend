<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Create Ride</div>
      </q-card-section>

      <q-card-section>
      
        <RideForm
          ref="formRef"
          :initial-data="initialFormData"
          @update:isValid="(val) => isValid = val"
          @submit="handleSubmit"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat
               label="Cancel"
               color="primary"
               @click="handleCancel" />
        <q-btn
          flat
          label="Create Part"
          color="primary"
          @click="() => formRef?.handleSubmit()"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CreateRideDto, Ride } from '@/types';
import RideForm from '@/components/forms/RideForm.vue';

interface Props {
  modelValue: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: CreateRideDto];
}>();

const formRef = ref<InstanceType<typeof RideForm>>();
const isValid = ref(false);
const initialFormData = ref<Partial<Ride>>({
  name: '',
  description: '',
  bikeId: '',
  distance: 0,
  startDateLocal: new Date(),
});

const handleCancel = () => {
  console.log('handleCancel');
  emit('update:modelValue', false);
};

const handleSubmit = (formData: CreateRideDto) => {
  const createData: CreateRideDto = {
    name: formData.name,
    description: formData.description || undefined,
    bikeId: formData.bikeId || undefined,
    distance: formData.distance,
    startDateLocal: formData.startDateLocal,
  };
  emit('submit', createData);
};
</script>