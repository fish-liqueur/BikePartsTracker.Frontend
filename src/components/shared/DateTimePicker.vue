<template>
  <q-input
    :model-value="dateTimeString"
    @update:model-value="handleUpdate"
    :label="label"
    filled
    mask="##/##/#### ##:##"
    fill-mask="_"
    placeholder="DD/MM/YYYY HH:MM"
    :rules="[validateDateTime]"
    lazy-rules
  >
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale" ref="popupRef">
          <q-card>
            <div class="display-flex">
              <q-card-section>
              <q-date v-model="dateString" mask="YYYY-MM-DD" @update:model-value="handleDateChange">
              </q-date>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-time v-model="timeString" mask="HH:mm" format24h @update:model-value="handleTimeChange">
              
              </q-time>
            </q-card-section>
            </div>
            <q-card-section>
              <div class="display-flex flex-justify-between w-100">
                <q-btn label="set to now" color="secondary" @click="setToNow" />
                <div class="display-flex gap-2">
                  <q-btn v-close-popup label="Cancel" color="primary" flat />
                  <q-btn v-close-popup label="OK" color="primary" @click="handleConfirm" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: Date | undefined | null;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Date & Time'
});

const emit = defineEmits<{
  'update:modelValue': [value: Date | undefined];
}>();

const popupRef = ref();

// Internal state for date and time strings
const dateString = ref<string>('');
const timeString = ref<string>('');

// Computed property to format the full datetime string for display
const dateTimeString = computed(() => {
  if (!props.modelValue) {
    return '';
  }
  const date = props.modelValue instanceof Date 
    ? props.modelValue 
    : new Date(props.modelValue);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Format as DD/MM/YYYY HH:mm to match the input mask
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
});

// Initialize date and time strings from modelValue
const initializeFromModelValue = () => {
  if (!props.modelValue) {
    // If no value, set to current date/time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateString.value = `${year}-${month}-${day}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeString.value = `${hours}:${minutes}`;
    return;
  }
  
  const date = props.modelValue instanceof Date 
    ? props.modelValue 
    : new Date(props.modelValue);
  
  if (isNaN(date.getTime())) {
    dateString.value = '';
    timeString.value = '';
    return;
  }
  
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  dateString.value = `${year}-${month}-${day}`;
  
  // Format time as HH:mm
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  timeString.value = `${hours}:${minutes}`;
};

// Watch for changes in modelValue from parent
watch(() => props.modelValue, () => {
  initializeFromModelValue();
}, { immediate: true });

const setToNow = () => {
  emit('update:modelValue', new Date());
};

// Handle date change - update immediately
const handleDateChange = () => {
  updateDateTime();
};

// Handle time change - update immediately
const handleTimeChange = () => {
  updateDateTime();
};

// Handle confirmation (when OK is clicked)
const handleConfirm = () => {
  updateDateTime();
};

// Update the datetime by combining date and time strings
const updateDateTime = () => {
  // Use current date/time if strings are empty
  if (!dateString.value) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateString.value = `${year}-${month}-${day}`;
  }
  
  if (!timeString.value) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeString.value = `${hours}:${minutes}`;
  }
  
  const [year, month, day] = dateString.value.split('-').map(Number);
  const [hours, minutes] = timeString.value.split(':').map(Number);
  
  const newDate = new Date(year, month - 1, day, hours, minutes);
  emit('update:modelValue', newDate);
};

const validateDateTime = (value: string | number | null): true | string => {
  if (!value || typeof value !== 'string') return 'true';

  // Still typing — don't show an error yet
  // if (value.includes('_')) return true;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return 'Invalid date format (DD/MM/YYYY HH:MM)';

  const [, day, month, year, hours, minutes] = match.map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);

  // Round-trip check catches rolled-over values like 31/02 → 03/03
  if (
    isNaN(date.getTime()) ||
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return 'Invalid date';
  }

  return true;
};

// Handle direct keyboard input changes
const handleUpdate = (value: string | number | null): void => {
  if (value === null || value === undefined || value === '') {
    emit('update:modelValue', undefined);
    return;
  }
  
  const stringValue = typeof value === 'number' ? String(value) : value;
  
  // Don't parse until the mask is fully filled (no remaining '_' placeholders)
  if (stringValue.includes('_')) {
    return;
  }
  
  // Parse masked format: DD/MM/YYYY HH:mm
  const match = stringValue.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return;
  
  const [, day, month, year, hours, minutes] = match.map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  
  if (!isNaN(date.getTime())) {
    emit('update:modelValue', date);
  }
};
</script>
