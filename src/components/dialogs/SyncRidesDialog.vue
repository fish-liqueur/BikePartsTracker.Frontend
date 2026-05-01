<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6">Sync Rides from Strava</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="form-general">
          <DateTimePicker
            label="Start Date"
            :model-value="formData.startDate as Date"
            @update:model-value="handleStartDateChange"
          />
          <DateTimePicker
            label="End Date"
            :model-value="formData.endDate as Date"
            @update:model-value="handleEndDateChange"
          />
        </q-form>
        
      </q-card-section>
      <q-card-actions align="right">
        <q-btn outline
               label="Cancel"
               color="primary"
               @click="handleCancel" />
        <q-btn
          label="Sync Rides"
          color="primary"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { ImportStravaRidesRequestDto } from '@/types';
import { onMounted, ref } from 'vue';
import DateTimePicker from '@/components/shared/DateTimePicker.vue';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [value: ImportStravaRidesRequestDto];
}>();

const startDate = ref<Date | undefined>(undefined);
const endDate = ref<Date | undefined>(undefined);
const formData = ref<Partial<ImportStravaRidesRequestDto>>({
  startDate: new Date(),
  endDate: new Date(),
});

onMounted(() => {
  formData.value.startDate = new Date(new Date().setDate(new Date().getDate() - 30));
  formData.value.endDate = new Date();
});

const handleStartDateChange = (value: Date | undefined) => {
  startDate.value = value;
};

const handleEndDateChange = (value: Date | undefined) => {
  endDate.value = value;
};

const handleSubmit = () => {
  emit('submit', formData.value as ImportStravaRidesRequestDto);
};

const handleCancel = () => {
  emit('update:modelValue', false);
};
</script>