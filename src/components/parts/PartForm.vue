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

    <q-select v-model="formData.partType"
              :options="partTypeOptions"
              label="Part Type"
              emit-value
              map-options
              filled
              :rules="[(val: PartType | null) => !!val || 'Part type is required']"
              :disable="!!lockType"
              class="m-0 p-0" />
    <div class="display-flex gap-2">
      <q-input v-model="formData.brand"
               label="Brand"
               filled
               class="flex-1" />

      <q-input v-model="formData.model"
               label="Model"
               filled
               class="flex-1" />
    </div>
    <q-select v-model="formData.bikeId"
              :options="bikeOptions"
              label="Bike"
              emit-value
              map-options
              option-label="name"
              option-value="id"
              filled
              clearable
              class="m-0 p-0" />

    <!-- <q-input
      v-model.number="formData.mileageAtInstallation"
      label="Mileage at Installation"
      type="number"
      filled
      :rules="[
        (val: number | null) => val !== null && val !== undefined && val >= 0 || 'Mileage must be a positive number'
      ]"
      class="q-mt-md"
    /> -->
    <!-- <ElementWithTooltipButton :tooltip-text="installationDateTooltip">
      <DateTimePicker
        v-model="formData.installationDate"
        label="Installation Date & Time"
      />
    </ElementWithTooltipButton> -->
  </q-form>
</template>

<script setup lang="ts">
import {
  ref, computed, watch 
} from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import type { CreatePartDto } from '@/types';
import { PartType } from '@/types';
// import ElementWithTooltipButton from '@/components/shared/ElementWithTooltipButton.vue';
// import DateTimePicker from '@/components/shared/DateTimePicker.vue';

interface Props {
  initialData?: Partial<FormData>;
  lockType?: PartType | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  lockType: null
});

const emit = defineEmits<{
  submit: [data: FormData];
  'update:isValid': [value: boolean];
}>();

interface FormData extends Omit<CreatePartDto, 'description'> {
  description: string;
}

const bikesStore = useBikesStore();

const formData = ref<FormData>({
  name: '',
  description: '',
  partType: PartType.Other,
  brand: '',
  model: '',
  bikeId: '',
  mileageAtInstallation: 0,
  installationDate: new Date()
});

const partTypeOptions = [
  { label: 'Chain', value: PartType.Chain },
  { label: 'Cassette', value: PartType.Cassette },
  { label: 'Chainring', value: PartType.Chainring },
  { label: 'Brake Pads', value: PartType.BrakePads },
  { label: 'Tyre', value: PartType.Tyre },
  { label: 'Battery', value: PartType.Battery },
  { label: 'Bottom Bracket', value: PartType.BottomBracket },
  { label: 'Headset', value: PartType.Headset },
  { label: 'Hub', value: PartType.Hub },
  { label: 'Pedals', value: PartType.Pedals },
  { label: 'Other', value: PartType.Other }
];

const bikeOptions = computed(() => bikesStore.bikes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const installationDateTooltip = `The date and time when the part was physically installed on the bike.
This is used to match your rides history with the part.
No need to be exact with the time, just put it between the last ride without the part and the first ride with it.`;

// Initialize form from initialData prop
const initializeForm = () => {
  const initialPartType = props.lockType || props.initialData?.partType || PartType.Other;
  formData.value = {
    name: props.initialData?.name || '',
    description: props.initialData?.description || '',
    partType: initialPartType,
    brand: props.initialData?.brand || '',
    model: props.initialData?.model || '',
    bikeId: props.initialData?.bikeId || '',
    mileageAtInstallation: props.initialData?.mileageAtInstallation || 0,
    installationDate: props.initialData?.installationDate
      ? (props.initialData.installationDate instanceof Date
        ? props.initialData.installationDate
        : new Date(props.initialData.installationDate))
      : new Date()
  };
};

// Watch for initialData changes (when parent wants to reset/update form)
watch(
  () => props.initialData, () => {
    initializeForm();
  }, { immediate: true, deep: true }
);

// Watch for lockType changes
watch(
  () => props.lockType, (newLockType) => {
    if (newLockType) {
      formData.value.partType = newLockType;
    }
  }, { immediate: true }
);

// Watch formData changes and emit validation updates
watch(
  formData, () => {
    emit('update:isValid', isValid.value);
  }, { deep: true }
);

const isValid = computed(() => {
  return !!formData.value.name &&
    !!formData.value.partType &&
    formData.value.mileageAtInstallation !== null &&
    formData.value.mileageAtInstallation !== undefined &&
    formData.value.mileageAtInstallation >= 0;
});

// Handle form submit
const handleSubmit = () => {
  if (isValid.value) {
    emit('submit', { ...formData.value });
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
