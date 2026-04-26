<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Edit Ride: {{ initialData?.name }}</div>
      </q-card-section>

      <q-card-section>
        <template v-if="initialData">
          <RideForm
            ref="formRef"
            :initial-data="initialData"
            @update:isValid="(val) => isValid = val"
            @submit="handleSubmit"
          />
        </template>
        <template v-else>
          <div class="text-h6">No ride data available</div>
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat
               label="Cancel"
               color="primary"
               @click="handleCancel" />
        <q-btn
          primary
          label="Save Ride"
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
  initialData: Ride | null;
}

withDefaults(defineProps<Props>(), {
  initialData: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: CreateRideDto];
}>();

const formRef = ref<InstanceType<typeof RideForm>>();
const isValid = ref(false);
// const initialFormData = ref<CreateRideDto>({
//   name: '',
//   description: '',
//   bikeId: '',
//   distance: 0,
//   startDateLocal: new Date(),
// });

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