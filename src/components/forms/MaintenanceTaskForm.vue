<template>
  <q-form @submit.prevent="handleSubmit" class="form-general">
    <q-input v-model="formData.name"
             label="Name *"
             filled
             standout
             clearable
             :rules="[(val: string) => !!val || 'Name is required']"
             class="m-0 p-0" />

    <q-input v-model="formData.description"
             label="Description"
             type="textarea"
             filled
             rows="2"
             class="m-0 p-0" />

    <!-- <q-select v-model="formData.parentType"
              :options="parentTypeOptions"
              label="Parent Type"
              filled
              :rules="[(val: string | null) => !!val || 'Please select type']"
              class="m-0 p-0" />

    <q-select 
      v-if="formData.parentType === 'Part'"
      v-model="formData.parentId"
      :options="partOptions"
      label="Select Part"
      emit-value
      map-options
      option-label="name"
      option-value="id"
      filled
      :rules="[(val: string | null) => !!val || 'Please pick a part']"
      class="m-0 p-0" />
    <q-select 
      v-else-if="formData.parentType === 'Bike'"
      v-model="formData.parentId"
      :options="bikeOptions"
      label="Select Bike"
      emit-value
      map-options
      option-label="name"
      option-value="id"
      filled
      :rules="[(val: string | null) => !!val || 'Please pick a bike']"
      class="m-0 p-0" /> -->
    <DateTimePicker v-model="formData.startDate" label="Start Time" />

    <q-card flat
            bordered
            class="my-card">
      <q-card-section>
        <div class="text-h6">Trigger</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="flex gap-4">
          <q-btn-toggle v-model="formData.triggerType"
                        :options="triggerTypeOptions"
                        spread 
                        class="flex-1" />
          <q-btn-toggle v-model="formData.type"
                        :options="maintenanceTaskTypeOptions"
                        spread 
                        class="flex-1" />

        </div>
    
      </q-card-section>

      <q-separator inset />

      <q-card-section>
        <template v-if="formData.triggerType === 'Distance'">
          <q-input 
            v-model="triggerDistanceValue"
            :label="`${formData.type === 'OneTime' ? 'in' : 'every'} * ${settings.distanceUnit === 'mi' ? t('units.mi') : t('units.km')}`"
            type="number"
            filled
            standout
            clearable
            :rules="[(val: string) => !!val || 'Name is required']"
            class="m-0 p-0" />
        </template>
        <template v-else>
          <q-input 
            v-model="formData.triggerValue"
            :label="`${formData.type === 'OneTime' ? 'in' : 'every'} * days`"
            type="number"
            filled
            standout
            clearable
            class="m-0 p-0" />
          <div v-if="nextTriggerDate" class="m-t-2">{{  `Will trigger ${formData.type === 'OneTime' ? 'on' : 'first time on'} ${nextTriggerDate}` }}</div>
        </template>
      </q-card-section>
    </q-card>
  </q-form>
</template>

<script setup lang="ts">
import type { CreateMaintenanceTaskDto, MaintenanceTask } from '@/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { metersToUnit, unitToMeters } from '@/utils/distance';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import DateTimePicker from '@/components/shared/DateTimePicker.vue';

interface Props {
  initialData?: Partial<MaintenanceTask>;
  
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  lockType: null
});

const emit = defineEmits<{
  submit: [data: CreateMaintenanceTaskDto];
  'update:isValid': [value: boolean];
}>();

const { t } = useI18n();
const settings = useUserSettingsStore();

// const bikesStore = useBikesStore();
// const partsStore = usePartsStore();

const formData = ref<Partial<MaintenanceTask>>({
  name: '',
  description: '',
  type: 'OneTime',
  triggerType: 'Distance',
  parentType: 'Part',
  parentId: '',
  triggerValue: 0,
  startDate: new Date(),
});

const triggerTypeOptions = ref([
  { label: 'Distance', value: 'Distance' },
  { label: 'Time', value: 'Time' },
]);

const maintenanceTaskTypeOptions = ref([
  { label: 'Once', value: 'OneTime' },
  { label: 'Repeating', value: 'Repeating' },
]);
// const parentTypeOptions = ref(['Part', 'Bike']);

// const bikeOptions = computed(() => bikesStore.bikes);
// const partOptions = computed(() => partsStore.parts);



// Initialize form from initialData prop
const initializeForm = () => {
  formData.value = {
    name: props.initialData?.name || '',
    description: props.initialData?.description || '',
    type: props.initialData?.type || 'OneTime',
    triggerType: props.initialData?.triggerType || 'Distance',
    parentType: props.initialData?.parentType || 'Part',
    parentId: props.initialData?.parentId || '',
    triggerValue: props.initialData?.triggerValue || 0,
    startDate: props.initialData?.startDate || new Date(),
  };
};

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const nextTriggerDate = computed(() => {
  if (formData.value.triggerType === 'Time' && formData.value.startDate && formData.value.triggerValue) {
    const date = new Date(formData.value.startDate);
    date.setDate(date.getDate() + parseInt(formData.value.triggerValue.toString()));
    return date.toLocaleDateString(undefined, options);
  } else {
    return '';
  }
});

const triggerDistanceValue = computed<number | null>({
  get() {
    const m = formData.value.triggerValue;
    return m == null ? null : Math.round(metersToUnit(m, settings.distanceUnit) * 100) / 100;
  },
  set(val) {
    formData.value.triggerValue = val == null ? 0 : Math.round(unitToMeters(val, settings.distanceUnit));
  },
});

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

watch(() => formData.value.parentType, () => {
  formData.value.parentId = '';
});

const isValid = computed(() => {
  return !!formData.value.name &&
    !!formData.value.parentType &&
    !!formData.value.parentId &&
    !!formData.value.startDate &&
    !!formData.value.type &&
    !!formData.value.triggerType &&
    !!formData.value.triggerValue;
});

// Handle form submit
const handleSubmit = () => {
  if (isValid.value) {
    emit('submit', formData.value as CreateMaintenanceTaskDto);
  }
};

defineExpose({
  formData,
  reset: initializeForm,
  handleSubmit
});
</script>
