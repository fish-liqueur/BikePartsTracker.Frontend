<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 420px; max-width: 520px">
      <q-card-section>
        <div class="text-h6">Fill empty slots</div>
        <div class="text-subtitle2 text-grey-8 q-mt-sm">
          New chains will be created for empty slots on {{ bikeName }}.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-subtitle2 q-mb-sm">Chains to create</div>
        <ul class="fill-empty-preview">
          <li v-for="slot in emptySlots" :key="slot.index">
            {{ slot.name }}
          </li>
        </ul>

        <div class="text-subtitle2 q-mt-md q-mb-sm">Which new chain is on the bike now?</div>
        <q-option-group
          v-model="activeChoice"
          :options="activeOptions"
          type="radio"
          color="primary"
        />

        <div v-if="activeChoice !== 'none'" class="q-mt-md">
          <DateTimePicker v-model="installationTime" label="Installation date & time" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat
               label="Cancel"
               color="grey"
               @click="handleCancel" />
        <q-btn
          unelevated
          label="Confirm"
          color="primary"
          :loading="submitting"
          @click="handleConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  computed, ref, watch 
} from 'vue';
import DateTimePicker from '@/components/shared/DateTimePicker.vue';

interface Props {
  modelValue: boolean;
  bikeName: string;
  /** 0-based indices of currently empty slots */
  emptySlotIndices: number[];
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [payload: { activeNewSlotIndex: number | null; installationDate: Date | null }];
  cancel: [];
}>();

const activeChoice = ref<string>('none');
const installationTime = ref<Date>(new Date());

const emptySlots = computed(() =>
  props.emptySlotIndices.map(index => ({
    index,
    name: `${props.bikeName} chain ${index + 1}`,
  })));

const activeOptions = computed(() => [
  ...emptySlots.value.map(slot => ({
    label: slot.name,
    value: String(slot.index),
  })),
  { label: 'None yet', value: 'none' },
]);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      const first = props.emptySlotIndices[0];
      activeChoice.value = first !== undefined ? String(first) : 'none';
      installationTime.value = new Date();
    }
  },
  { immediate: true }
);

const handleCancel = () => {
  emit('update:modelValue', false);
  emit('cancel');
};

const handleConfirm = () => {
  if (activeChoice.value === 'none') {
    emit('confirm', { activeNewSlotIndex: null, installationDate: null });
    return;
  }
  emit('confirm', {
    activeNewSlotIndex: Number(activeChoice.value),
    installationDate: installationTime.value,
  });
};
</script>

<style scoped>
.fill-empty-preview {
  margin: 0;
  padding-left: 1.25rem;
}
</style>
