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
          :rules="[val => !!val || 'Installation date is required']"
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="installationDate" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-input
          v-model.number="mileageAtInstallation"
          label="Mileage at Installation"
          type="number"
          filled
          :rules="[
            val => val !== null && val !== undefined && val >= 0 || 'Mileage must be a positive number'
          ]"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="$emit('cancel')" />
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
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: boolean;
  partName?: string;
  sourceBikeName?: string;
  targetBikeName?: string;
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

const installationDate = ref<string>('');
const mileageAtInstallation = ref<number>(props.currentBikeMileage || 0);

// Set default date to today
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    const today = new Date();
    installationDate.value = today.toISOString().split('T')[0];
    mileageAtInstallation.value = props.currentBikeMileage || 0;
  }
}, { immediate: true });

const warningMessage = computed(() => {
  if (props.sourceBikeName && props.targetBikeName) {
    return `You are removing a part from bike "${props.sourceBikeName}" and installing it to bike "${props.targetBikeName}".`;
  }
  return '';
});

const isValid = computed(() => {
  return !!installationDate.value && 
         mileageAtInstallation.value !== null && 
         mileageAtInstallation.value >= 0;
});

const handleInstall = () => {
  if (isValid.value) {
    emit('install', {
      installationDate: installationDate.value,
      mileageAtInstallation: mileageAtInstallation.value
    });
  }
};
</script>

