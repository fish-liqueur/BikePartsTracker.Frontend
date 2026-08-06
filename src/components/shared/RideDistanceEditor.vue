<template>
  <div class="ride-distance-editor column q-gutter-y-sm">
    <div class="row items-center justify-between no-wrap p-x-2">
      <div>
        <div class="text-caption text-grey-7">Recorded distance</div>
        <div class="text-body1">{{ formatDistance(recordedDistance, distanceUnit) }}</div>
      </div>
      <div class="text-right">
        <div
          class="text-body1"
          :class="deltaClass"
        >
          {{ formatSignedDistance(deltaRecordedMinusDistance, distanceUnit) }}
        </div>
      </div>
    </div>
    <q-input
      :model-value="distanceDisplayString"
      type="number"
      :label="distanceLabel"
      outlined
      step="any"
      :rules="[(val: string) => (val !== null && val !== '' && Number.parseFloat(val) > 0) || 'Enter a distance greater than 0']"
      hide-bottom-space
      @update:model-value="onNumericInput"
    />
    <q-slider
      :model-value="distanceDisplayNum"
      :min="sliderMinDisplay"
      :max="sliderMaxDisplay"
      :step="resolvedSliderStep"
      label
      color="primary"
      @update:model-value="onSliderChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import {
  formatDistance,
  formatSignedDistance,
  metersToUnit,
  unitToMeters,
} from '@/utils/distance';

interface Props {
  modelValue: number;
  recordedDistance: number;
  sliderStep?: number;
}

const props = withDefaults(defineProps<Props>(), {
  sliderStep: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const { t } = useI18n();
const userSettingsStore = useUserSettingsStore();
const distanceUnit = computed(() => userSettingsStore.distanceUnit);

const sliderMinMetres = ref(0);
const sliderMaxMetres = ref(0);

const distanceNum = computed(() =>
  typeof props.modelValue === 'number' && !Number.isNaN(props.modelValue)
    ? props.modelValue
    : 0);

const distanceDisplayNum = computed(() =>
  metersToUnit(distanceNum.value, distanceUnit.value));

const distanceDisplayString = computed(() =>
  String(Math.round(distanceDisplayNum.value * 1000) / 1000));

const distanceLabel = computed(() =>
  t('rides.distanceLabel', { unit: t(distanceUnit.value === 'mi' ? 'units.mi' : 'units.km') }));

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

const sliderMinDisplay = computed(() =>
  metersToUnit(sliderMinMetres.value, distanceUnit.value));
const sliderMaxDisplay = computed(() =>
  metersToUnit(sliderMaxMetres.value, distanceUnit.value));

const resolvedSliderStep = computed(() => {
  if (props.sliderStep != null && props.sliderStep > 0) {
    return metersToUnit(props.sliderStep, distanceUnit.value);
  }
  const span = Math.max(sliderMaxDisplay.value - sliderMinDisplay.value, 0);
  if (span <= 0) return 0.1;
  return Math.max(0.1, Math.round((span / 200) * 10) / 10);
});

function updateSliderExtremums(): void {
  sliderMinMetres.value = 0;
  sliderMaxMetres.value = Math.max(
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
  emit('update:modelValue', Math.max(0, unitToMeters(n, distanceUnit.value)));
}

function onSliderChange(value: number | null): void {
  if (value === null || Number.isNaN(value)) return;
  emit('update:modelValue', Math.max(0, unitToMeters(value, distanceUnit.value)));
}

onMounted(() => {
  updateSliderExtremums();
});

watch(() => [props.modelValue, props.recordedDistance], () => {
  updateSliderExtremums();
});
</script>

<style scoped lang="scss">
.ride-distance-editor {
  width: 100%;
}
</style>
