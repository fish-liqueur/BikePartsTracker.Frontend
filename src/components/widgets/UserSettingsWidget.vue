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
            v-model="formData.defaultChainCycleIntervalKm"
            :label="t('settings.defaultChainCycleInterval')"
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
import type { UserSettingsDto } from '@/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useLocale } from '@/composables/useLocale';
import type { SupportedLocale } from '@/i18n';
import ElementWithTooltipButton from '@/components/shared/ElementWithTooltipButton.vue';

const userSettingsStore = useUserSettingsStore();
const { t } = useI18n();
const {
  currentLocale, availableLocales, setLocale 
} = useLocale();

// Bound to the shared useLocale source, so this control and the header switcher always agree.
const languageOptions = computed(() =>
  availableLocales.map(locale => ({ value: locale, label: t(`language.${locale}`) })));

const onLanguageChange = (locale: SupportedLocale) => {
  setLocale(locale);
};

const formData = ref<UserSettingsDto>({
  defaultChainCycleLength: 0,
  defaultChainCycleIntervalKm: 0,
  defaultUseChainCycle: false,
  showTips: false,
});

const initializeForm = () => {
  formData.value = {
    defaultChainCycleLength: userSettingsStore.userSettings?.defaultChainCycleLength || 3,
    defaultChainCycleIntervalKm: userSettingsStore.userSettings?.defaultChainCycleIntervalKm || 777,
    defaultUseChainCycle: userSettingsStore.userSettings?.defaultUseChainCycle ?? true,
    showTips: userSettingsStore.userSettings?.showTips ?? true,
  };
};

const saveSettings = async () => {
  await userSettingsStore.updateSettings(formData.value);
};

watch(
  () => userSettingsStore.userSettings, () => {
    initializeForm();
  }, { immediate: true, deep: true }
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
