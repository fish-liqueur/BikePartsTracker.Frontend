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
        <WorkForm
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
import type { CreateWorkDto, Work } from '@/types';
import WorkForm from '@/components/forms/WorkForm.vue';

interface Props {
  modelValue: boolean;
  basicWork?: Partial<Work>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: CreateWorkDto];
}>();

const formRef = ref<InstanceType<typeof WorkForm>>();
const isValid = ref(false);
const initialFormData = computed<Partial<Work> | undefined>(() => {
  if (!props.modelValue) {
    return undefined;
  }
  const data: Partial<Work> = {
    name: '',
    description: '',
    type: 'OneTime',
    triggerType: 'Distance',
    parentType: 'Part',
    parentId: '',
    triggerValue: 0,
    startDate: new Date(),
  };

  if (props.basicWork) {
    data.name = props.basicWork.name || '';
    data.description = props.basicWork.description || '';
    data.type = props.basicWork.type || 'OneTime';
    data.triggerType = props.basicWork.triggerType || 'Distance';
    data.parentType = props.basicWork.parentType || 'Part';
    data.parentId = props.basicWork.parentId || '';
    data.triggerValue = props.basicWork.triggerValue || 0;
    data.startDate = props.basicWork.startDate || new Date();
  }
  return data;
});

const handleCancel = () => {
  console.log('handleCancel');
  emit('update:modelValue', false);
};

const handleSubmit = (formData: CreateWorkDto) => {
  const createData: CreateWorkDto = {
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