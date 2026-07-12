<template>
  <q-card class="maintenance-task-card"
          :class="{
            'maintenance-task-card--needs-attention': maintenanceTask.needsAttention
          }"
          bordered
          :flat="false">
    <q-card-section class="maintenance-task-card__header">
      <h4> 
        <span v-if="maintenanceTask.needsAttention">
          Time to do it:
        </span>
        {{ maintenanceTask.name }}</h4>
      <div class="flex gap-1">
        <q-chip v-if="maintenanceTask.parentType === 'Part'" 
                :label="relatedPart?.partType"
                color="primary"
                text-color="white"
                size="md"
                class="part-card__chip" />
        <q-chip v-if="relatedBike"
                :label="relatedBike.name"
                color="secondary"
                text-color="white"
                size="md"
                class="part-card__bike-name-chip" />
      </div>
    </q-card-section>
    <q-card-section v-if="maintenanceTask.description">
      <p>{{ maintenanceTask.description }}</p>
    </q-card-section>
    <q-card-section>
      <div class="">
        {{ valuesString }}
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions align="right">
      <q-btn color="negative"
             outline
             @click="handleDelete">Delete</q-btn>
      <q-btn color="primary"
             outline
             @click="handleEdit">Edit</q-btn>
      <q-btn color="primary"
             :outline="!maintenanceTask.needsAttention"
             @click="handleDoMaintenanceTask">{{ maintenanceTask.needsAttention ? 'I did it!' : 'Do it now' }}</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useBikesStore } from '@/stores/bikesStore';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import type { MaintenanceTask } from '@/types';
import { metersToUnit } from '@/utils/distance';
import { computed } from 'vue';

interface Props {
  maintenanceTask: MaintenanceTask;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  delete: [maintenanceTask: MaintenanceTask];
  doMaintenanceTask: [maintenanceTask: MaintenanceTask];
  edit: [maintenanceTask: MaintenanceTask];
}>();

const partsStore = usePartsStore();
const bikesStore = useBikesStore();
const settingsStore = useUserSettingsStore();

const relatedBike = computed(() => {
  const bikeId = relatedPart.value?.bikeId ?? props.maintenanceTask.parentId;
  return bikesStore.getBikeById(bikeId) ?? null;
});

const relatedPart = computed(() => {
  if (props.maintenanceTask.parentType !== 'Part') {
    return null;
  }
  return partsStore.getPartById(props.maintenanceTask.parentId);
});

const valuesString = computed(() => {
  if (props.maintenanceTask.triggerType === 'Distance') {
    const consumed = props.maintenanceTask.triggerValue - props.maintenanceTask.remainingValue;
    return `${metersToUnit(consumed, settingsStore.distanceUnit)} / ${metersToUnit(props.maintenanceTask.triggerValue, settingsStore.distanceUnit)} ${settingsStore.distanceUnit}`;
  } else {
    return `${props.maintenanceTask.remainingValue} / ${props.maintenanceTask.triggerValue} days`;
  }
});

const handleDelete = () => {
  emit('delete', props.maintenanceTask);
};

const handleDoMaintenanceTask = () => {
  emit('doMaintenanceTask', props.maintenanceTask);
};

const handleEdit = () => {
  emit('edit', props.maintenanceTask);
};
</script>

<style scoped lang="scss">
.maintenance-task-card {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  &__header-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    & h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
  }
  &__header-item-value {
    font-size: 1.25rem;
  }
  &--needs-attention {
    border: 2px solid var(--q-warning);
  }
  h4 {
    font-size: 1.5rem;

    span {
      color: var(--q-negative);
    }
  }
}
</style>
