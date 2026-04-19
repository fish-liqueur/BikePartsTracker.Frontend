<template>
  <q-dialog v-model="localShow" @update:model-value="handleDialogUpdate">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Add New Bike</div>
      </q-card-section>

      <q-card-section>
        <BikeForm
          ref="bikeFormRef"
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
        <q-btn flat
               label="Add Bike"
               color="primary"
               @click="() => bikeFormRef?.handleSubmit()"
               :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type { CreateBikeDto, BikeFormExposed } from '@/types';
import { BikeType } from '@/types';
import BikeForm from '@/components/forms/BikeForm.vue';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [bikeData: CreateBikeDto];
}>();

const localShow = ref(props.modelValue);
const isValid = ref(false);
const bikeFormRef = ref<ComponentPublicInstance & BikeFormExposed | null>(null);

const initialFormData = computed(() => {
  if (!props.modelValue) {
    return undefined;
  }
  return {
    name: '',
    type: BikeType.Other,
    description: '',
    totalDistance: 0,
    stravaDistance: 0,
  };
});

watch(() => props.modelValue, (newValue) => {
  localShow.value = newValue;
});

watch(localShow, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleDialogUpdate = (value: boolean) => {
  localShow.value = value;
};

const handleCancel = () => {
  localShow.value = false;
};

const handleSubmit = (bikeData: CreateBikeDto) => {
  emit('submit', { ...bikeData });
};
</script>
