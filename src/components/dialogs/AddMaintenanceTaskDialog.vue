<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Create Work</div>
      </q-card-section>
      <q-card-section>
        <MaintenanceTaskForm
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
          label="Add Ride"
          color="primary"
          @click="() => formRef?.handleSubmit()"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CreateMaintenanceTaskDto, MaintenanceTask } from '@/types';
import MaintenanceTaskForm from '@/components/forms/MaintenanceTaskForm.vue';

interface Props {
  modelValue: boolean;
  basicMaintenanceTask?: Partial<MaintenanceTask>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: CreateMaintenanceTaskDto];
}>();

const formRef = ref<InstanceType<typeof MaintenanceTaskForm>>();
const isValid = ref(false);
const initialFormData = computed<Partial<MaintenanceTask> | undefined>(() => {
  if (!props.modelValue) {
    return undefined;
  }
  const data: Partial<MaintenanceTask> = {
    name: '',
    description: '',
    type: 'OneTime',
    triggerType: 'Distance',
    parentType: 'Part',
    parentId: '',
    triggerValue: 0,
    startDate: new Date(),
  };

  if (props.basicMaintenanceTask) {
    data.name = props.basicMaintenanceTask.name || '';
    data.description = props.basicMaintenanceTask.description || '';
    data.type = props.basicMaintenanceTask.type || 'OneTime';
    data.triggerType = props.basicMaintenanceTask.triggerType || 'Distance';
    data.parentType = props.basicMaintenanceTask.parentType || 'Part';
    data.parentId = props.basicMaintenanceTask.parentId || '';
    data.triggerValue = props.basicMaintenanceTask.triggerValue || 0;
    data.startDate = props.basicMaintenanceTask.startDate || new Date();
  }
  return data;
});

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = (formData: CreateMaintenanceTaskDto) => {
  const createData: CreateMaintenanceTaskDto = {
    name: formData.name,
    description: formData.description || undefined,
    type: formData.type || 'OneTime',
    triggerType: formData.triggerType || 'Distance',
    parentType: formData.parentType || 'Part',
    parentId: formData.parentId || '',
    triggerValue: formData.triggerValue || 0,
    startDate: formData.startDate || new Date(),
  };
  emit('submit', createData);
};
</script>
