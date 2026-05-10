<template>
  <q-form @submit.prevent="handleSubmit" class="form-general">
    <q-input v-model="formData.name"
             label="Name *"
             filled
             standout
             :rules="[(val: string) => !!val || 'Name is required']"
             class="m-0 p-0" />

    <q-input v-model="formData.description"
             label="Description"
             type="textarea"
             filled
             rows="2"
             class="m-0 p-0" />

    <q-select v-model="formData.bikeId"
              :options="bikeOptions"
              label="Bike"
              emit-value
              map-options
              option-label="name"
              option-value="id"
              filled
              :rules="[(val: string | null) => !!val || 'Please pick a bike']"
              class="m-0 p-0" />
    <DateTimePicker v-model="formData.startDateLocal" label="Start Time" />
    <RideDistanceEditor v-if="formData.distance !== null && formData.distance !== undefined" 
                        v-model="formData.distance"
                        :recorded-distance="props.initialData?.recordedDistance ?? 0" />
    <!-- <q-input v-model="formData.distance"
             label="Distance *"
             type="number"
             filled
             :rules="[(val: number | null) => val !== null && val !== undefined && val >= 0 || 'Distance must be a positive number']"
             class="m-0 p-0" /> -->
  </q-form>
</template>

<script setup lang="ts">
import type { Ride } from '@/types';
import { computed, ref, watch } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import DateTimePicker from '@/components/shared/DateTimePicker.vue';
import RideDistanceEditor from '@/components/shared/RideDistanceEditor.vue';

interface Props {
  initialData?: Partial<Ride>;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  lockType: null
});

const emit = defineEmits<{
  submit: [data: Ride];
  'update:isValid': [value: boolean];
}>();

const bikesStore = useBikesStore();

const formData = ref<Partial<Ride>>({
  name: '',
  description: '',
  bikeId: '',
  distance: 0,
  startDateLocal: new Date(),
});

const bikeOptions = computed(() => bikesStore.bikes);

// Initialize form from initialData prop
const initializeForm = () => {
  formData.value = {
    name: props.initialData?.name || '',
    description: props.initialData?.description || '',
    bikeId: props.initialData?.bikeId || '',
    distance: props.initialData?.distance || 0,
    startDateLocal: props.initialData?.startDateLocal || new Date(),
  };
};

// Watch for initialData changes (when parent wants to reset/update form)
watch(
  () => props.initialData, () => {
    initializeForm();
  }, { immediate: true, deep: true }
);


// Watch formData changes and emit validation updates
watch(
  formData, () => {
    emit('update:isValid', isValid.value);
  }, { deep: true }
);

const isValid = computed(() => {
  return !!formData.value.name &&
    formData.value.distance !== 0 &&
    formData.value.bikeId !== '' &&
    formData.value.startDateLocal !== null;
});

// Handle form submit
const handleSubmit = () => {
  if (isValid.value) {
    emit('submit', formData.value as Ride);
  }
};

// Expose methods and state for parent component access
defineExpose({
  formData,
  isValid,
  reset: initializeForm,
  handleSubmit
});
</script>
