<template>
  <div class="ride-distance-editor column q-gutter-y-sm">
    <div class="row items-center justify-between no-wrap p-x-2">
      <div>
        <div class="text-caption text-grey-7">Recorded distance</div>
        <div class="text-body1">{{ formatMeters(recordedDistance) }}</div>
      </div>
      <div class="text-right">
        <div
          class="text-body1"
          :class="deltaClass"
        >
          {{ formatSignedMeters(deltaRecordedMinusDistance) }}
        </div>
      </div>
    </div>
    <q-input
      :model-value="distanceString"
      type="number"
      label="Distance (m) *"
      outlined
      step="any"
      :rules="[(val: string) => (val !== null && val !== '' && Number.parseFloat(val) > 0) || 'Enter a distance greater than 0']"
      hide-bottom-space
      @update:model-value="onNumericInput"
    />
    <q-slider
      :model-value="distanceNum"
      :min="sliderMin"
      :max="sliderMax"
      :step="resolvedSliderStep"
      label
      color="primary"
      @update:model-value="onSliderChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { formatMeters, formatSignedMeters } from '@/utils/distance';

interface Props {
  modelValue: number;
  recordedDistance: number;
  /** Slider step in meters */
  sliderStep?: number;
}

const props = withDefaults(defineProps<Props>(), {
  sliderStep: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const sliderMin = ref(0);
const sliderMax = ref(0);

const distanceNum = computed(() =>
  typeof props.modelValue === 'number' && !Number.isNaN(props.modelValue)
    ? props.modelValue
    : 0);

const distanceString = computed(() =>
  String(distanceNum.value));

const recordedNum = computed(() =>
  typeof props.recordedDistance === 'number' &&
  !Number.isNaN(props.recordedDistance)
    ? props.recordedDistance
    : 0);

const deltaRecordedMinusDistance = computed(() => distanceNum.value - recordedNum.value);

const deltaClass = computed(() => {
  const d = deltaRecordedMinusDistance.value;
  if (d > 0) return 'text-positive';
  if (d < 0) return 'text-negative';
  return '';
});

const resolvedSliderStep = computed(() => {
  if (props.sliderStep != null && props.sliderStep > 0) {
    return props.sliderStep;
  }
  const span = Math.max(sliderMax.value - sliderMin.value, 0);
  if (span <= 0) return 1;
  const auto = Math.max(1, Math.round(span / 200));
  return auto;
});

function updateSliderExtremums(): void {
  sliderMin.value = 0;
  sliderMax.value = Math.max(
    props.modelValue * 2, props.recordedDistance * 2, 50000
  );
}

function onNumericInput(raw: string | number | null): void {
  if (raw === null || raw === '') {
    emit('update:modelValue', 0);
    return;
  }
  const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
  if (Number.isNaN(n)) return;
  const next = Math.max(0, n);
  emit('update:modelValue', next);
}

function onSliderChange(value: number | null): void {
  if (value === null || Number.isNaN(value)) return;
  emit('update:modelValue', value);
}

onMounted(() => {
  updateSliderExtremums();
});
</script>

<style scoped lang="scss">
.ride-distance-editor {
  width: 100%;
}
</style>
