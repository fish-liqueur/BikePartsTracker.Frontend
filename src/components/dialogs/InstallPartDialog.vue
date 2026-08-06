<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Install Part on Bike</div>
      </q-card-section>

      <q-card-section v-if="warningMessage" class="q-pb-sm">
        <q-banner rounded class="bg-warning text-dark">
          {{ warningMessage }}
        </q-banner>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="installationDate"
          label="Installation Date"
          type="date"
          filled
          :rules="[(val: string) => !!val || 'Installation date is required']"
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover
                             transition-show="scale"
                             transition-hide="scale">
                <q-date v-model="installationDate" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup
                           label="Close"
                           color="primary"
                           flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-input
          v-model.number="mileageDisplay"
          :label="mileageLabel"
          type="number"
          filled
          :rules="[
            (val: number | null) => val !== null && val !== undefined && val >= 0 || 'Mileage must be a positive number'
          ]"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat
               label="Cancel"
               color="primary"
               @click="$emit('cancel')" />
        <q-btn
          flat
          label="Install"
          color="primary"
          @click="handleInstall"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  ref, computed, watch 
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import {
  metersToUnit, reconvertDistanceDraft, unitToMeters 
} from '@/utils/distance';
import type { DistanceUnit } from '@/types';

interface Props {
  modelValue: boolean;
  partName?: string;
  sourceBikeName?: string;
  targetBikeName?: string;
  /** Bike total distance in metres. */
  currentBikeMileage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  partName: '',
  sourceBikeName: '',
  targetBikeName: '',
  currentBikeMileage: 0
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  install: [data: { installationDate: string; mileageAtInstallation: number }];
  cancel: [];
}>();

const { t } = useI18n();
const userSettingsStore = useUserSettingsStore();
const distanceUnit = computed(() => userSettingsStore.distanceUnit);

const installationDate = ref<string>('');
const mileageDisplay = ref<number>(0);
const formUnit = ref<DistanceUnit>('km');

const mileageLabel = computed(() =>
  t('parts.mileageAtInstallation', { unit: t(distanceUnit.value === 'mi' ? 'units.mi' : 'units.km') }));

const syncMileageFromMetres = (metres: number) => {
  formUnit.value = distanceUnit.value;
  mileageDisplay.value = Math.round(metersToUnit(metres || 0, formUnit.value) * 100) / 100;
};

// Set default date to today
watch(
  () => props.modelValue, (isOpen) => {
    if (isOpen) {
      const today = new Date();
      installationDate.value = today.toISOString().split('T')[0];
      syncMileageFromMetres(props.currentBikeMileage || 0);
    }
  }, { immediate: true }
);

watch(distanceUnit, (next, prev) => {
  if (!props.modelValue || next === prev) return;
  const reconverted = reconvertDistanceDraft(
    mileageDisplay.value, formUnit.value, next
  );
  if (typeof reconverted === 'number') {
    mileageDisplay.value = Math.round(reconverted * 100) / 100;
  }
  formUnit.value = next;
});

const warningMessage = computed(() => {
  if (props.sourceBikeName && props.targetBikeName) {
    return `You are removing a part from bike "${props.sourceBikeName}" and installing it to bike "${props.targetBikeName}".`;
  }
  return '';
});

const isValid = computed(() => {
  return !!installationDate.value && 
         mileageDisplay.value !== null && 
         mileageDisplay.value >= 0;
});

const handleInstall = () => {
  if (isValid.value) {
    emit('install', {
      installationDate: installationDate.value,
      mileageAtInstallation: Math.round(unitToMeters(Number(mileageDisplay.value) || 0, formUnit.value)),
    });
  }
};
</script>
