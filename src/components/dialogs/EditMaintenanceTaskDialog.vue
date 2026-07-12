<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Edit Work: {{ maintenanceTask?.name }}</div>
      </q-card-section>
      <q-card-section>
        <template v-if="maintenanceTask">
          <MaintenanceTaskForm
            ref="formRef"
            :initial-data="maintenanceTask"
            @update:isValid="(val: boolean) => isValid = val"
            @submit="handleSubmit"
          />
        </template>
        <template v-else>
          <div class="text-h6">No work data available</div>
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
import type { CreateMaintenanceTaskDto, UpdateMaintenanceTaskDto, MaintenanceTask } from '@/types';
import MaintenanceTaskForm from '@/components/forms/MaintenanceTaskForm.vue';

interface Props {
  modelValue: boolean;
  maintenanceTask: MaintenanceTask | null;
}

withDefaults(defineProps<Props>(), {
  maintenanceTask: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: UpdateMaintenanceTaskDto];
}>();

const formRef = ref<InstanceType<typeof MaintenanceTaskForm>>();
const isValid = ref(false);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = (formData: CreateMaintenanceTaskDto) => {
  const createData: UpdateMaintenanceTaskDto = {
    name: formData.name,
    description: formData.description || undefined,
    parentId: formData.parentId || undefined,
    triggerValue: formData.triggerValue,
    isActive: formData.isActive || undefined,
  };
  emit('submit', createData);
};
</script>
