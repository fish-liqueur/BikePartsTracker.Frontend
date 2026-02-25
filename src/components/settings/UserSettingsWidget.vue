<template>
 <q-card>
      <q-card-section>
        <h5 class="text-h5">User Settings</h5>
        <q-form @submit.prevent="handleSubmit" class="form-general pt-2">
            <ElementWithTooltipButton tooltip-text="New chain cycles will have this number of chains">
            <q-select
            v-model="formData.defaultChainCycleLength"
            :options="[2, 3]"
            label="Default chain cycle length"
            filled
            class="m-0 p-0"
            />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton tooltip-text="How many kilometers you'd like to ride between chain swaps">
            <q-input
            v-model="formData.defaultChainCycleIntervalKm"
            label="Default chain cycle interval (km)"
            filled
            class="m-0 p-0"
            type="number"
            :rules="[
              (val: number | null) => val !== null && val !== undefined && val >= 0 || 'Interval must be a positive number'
            ]"
            />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton tooltip-text="Use chain cycle on new bikes">
            <q-checkbox v-model="formData.defaultUseChainCycle" label="Use chain cycle by default" />
        </ElementWithTooltipButton>
        <ElementWithTooltipButton :tooltip-text="showTipsString" show-always>
            <q-checkbox v-model="formData.showTips" label="Show UI tips" />
        </ElementWithTooltipButton>
        </q-form>
        
      </q-card-section>

      <q-card-actions align="stretch">
        <q-btn flat label="Cancel" color="primary" @click="initializeForm" />
        <q-btn
          label="Save User Settings"
          color="primary"
          @click="saveSettings"
        />
      </q-card-actions>
    </q-card>
</template>

<script setup lang="ts">
import type { UserSettingsDto } from '@/types';
import { ref, watch } from 'vue';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import ElementWithTooltipButton from '@/components/shared/ElementWithTooltipButton.vue';

const userSettingsStore = useUserSettingsStore();

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

watch(() => userSettingsStore.userSettings, () => {
  initializeForm();
}, { immediate: true, deep: true });

const showTipsString = `Hide or show tooltips explaining the UI features
(this tooltip is always shown)`;

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