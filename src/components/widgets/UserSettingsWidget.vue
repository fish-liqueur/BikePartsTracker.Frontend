<template>
  <q-card>
    <q-card-section>
      <h5 class="text-h5">{{ t('settings.title') }}</h5>
      <q-form @submit.prevent="handleSubmit" class="form-general pt-2">
        <ElementWithTooltipButton :tooltip-text="t('settings.languageHint')">
          <q-select
            :model-value="currentLocale"
            :options="languageOptions"
            :label="t('settings.language')"
            emit-value
            map-options
            filled
            class="m-0 p-0"
            @update:model-value="onLanguageChange"
          />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton :tooltip-text="t('settings.distanceUnitHint')">
          <q-select
            :model-value="distanceUnitSelection"
            :options="distanceUnitOptions"
            :label="t('settings.distanceUnit')"
            emit-value
            map-options
            filled
            class="m-0 p-0"
            @update:model-value="onDistanceUnitChange"
          />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton :tooltip-text="t('settings.defaultChainCycleLengthHint')">
          <q-select
            v-model="formData.defaultChainCycleLength"
            :options="[2, 3]"
            :label="t('settings.defaultChainCycleLength')"
            filled
            class="m-0 p-0"
          />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton :tooltip-text="t('settings.defaultChainCycleIntervalHint')">
          <q-input
            v-model.number="intervalDisplay"
            :label="t('settings.defaultChainCycleInterval', { unit: unitLabel })"
            filled
            class="m-0 p-0"
            type="number"
            :rules="[
              (val: number | null) => val !== null && val !== undefined && val >= 0 || t('settings.intervalRule')
            ]"
          />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton :tooltip-text="t('settings.useChainCycleHint')">
          <q-checkbox v-model="formData.defaultUseChainCycle" :label="t('settings.useChainCycle')" />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton :tooltip-text="t('settings.showTipsHint')" show-always>
          <q-checkbox v-model="formData.showTips" :label="t('settings.showTips')" />
        </ElementWithTooltipButton>
      </q-form>
        
    </q-card-section>

    <q-card-actions align="stretch">
      <q-btn flat
             :label="t('common.cancel')"
             color="primary"
             @click="initializeForm" />
      <q-btn
        :label="t('settings.save')"
        color="primary"
        @click="saveSettings"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import type { DistanceUnit, UserSettingsDto } from '@/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useLocale } from '@/composables/useLocale';
import type { SupportedLocale } from '@/i18n';
import ElementWithTooltipButton from '@/components/shared/ElementWithTooltipButton.vue';
import {
  metersToUnit, reconvertDistanceDraft, unitToMeters 
} from '@/utils/distance';

const DEFAULT_INTERVAL_METRES = 700_000;

const userSettingsStore = useUserSettingsStore();
const { t } = useI18n();
const {
  currentLocale, availableLocales, setLocale 
} = useLocale();

const languageOptions = computed(() =>
  availableLocales.map(locale => ({ value: locale, label: t(`language.${locale}`) })));

const distanceUnitOptions = computed(() => [
  { value: 'km' as DistanceUnit, label: t('settings.distanceUnitKm') },
  { value: 'mi' as DistanceUnit, label: t('settings.distanceUnitMi') },
]);

const onLanguageChange = (locale: SupportedLocale) => {
  setLocale(locale);
};

/** Explicit selection for the control; falls back to effective unit for display when unset. */
const distanceUnitSelection = computed(() =>
  userSettingsStore.savedDistanceUnit ?? userSettingsStore.distanceUnit);

const unitLabel = computed(() =>
  userSettingsStore.distanceUnit === 'mi' ? t('units.mi') : t('units.km'));

const formData = ref<UserSettingsDto>({
  defaultChainCycleLength: 0,
  defaultUseChainCycle: false,
  showTips: false,
});

const intervalDisplay = ref(0);
const formUnit = ref<DistanceUnit>('km');

const initializeForm = () => {
  const settings = userSettingsStore.userSettings;
  const unit = userSettingsStore.distanceUnit;
  formUnit.value = unit;
  formData.value = {
    defaultChainCycleLength: settings?.defaultChainCycleLength || 3,
    defaultUseChainCycle: settings?.defaultUseChainCycle ?? true,
    showTips: settings?.showTips ?? true,
  };
  const metres = settings?.defaultChainCycleIntervalMetres ?? DEFAULT_INTERVAL_METRES;
  intervalDisplay.value = Math.round(metersToUnit(metres, unit) * 100) / 100;
};

const onDistanceUnitChange = async (next: DistanceUnit) => {
  const prev = formUnit.value;
  const reconverted = reconvertDistanceDraft(
    intervalDisplay.value, prev, next
  );
  if (typeof reconverted === 'number') {
    intervalDisplay.value = Math.round(reconverted * 100) / 100;
  }
  formUnit.value = next;
  // Persist immediately so the whole app reformats (E6).
  await userSettingsStore.updateSettings({ distanceUnit: next });
};

const saveSettings = async () => {
  const metres = Math.round(unitToMeters(Number(intervalDisplay.value) || 0, formUnit.value));
  await userSettingsStore.updateSettings({
    ...formData.value,
    defaultChainCycleIntervalMetres: metres,
    distanceUnit: distanceUnitSelection.value,
  });
};

watch(
  () => [userSettingsStore.userSettings, userSettingsStore.distanceUnit] as const,
  () => {
    initializeForm();
  },
  { immediate: true, deep: true }
);

const handleSubmit = () => {
  saveSettings();
};
</script>

<style scoped lang="css">
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
