<template>
  <q-card class="history-card"
          bordered
          :flat="false">
    <q-card-section class="history-card__header">
      <div class="history-card__header-item">
        <h4>Dates</h4>
        <div class="history-card__header-item-value">{{ dateString }}</div>
      </div>
      <div class="history-card__header-item">
        <h4>Bike</h4>
        <div class="history-card__header-item-value">{{ bikeName }}</div>
      </div>
      <div class="history-card__header-item">
        <h4>Distance</h4>
        <div class="history-card__header-item-value">{{ distanceString }}</div>
      </div>
    </q-card-section>
    <q-card-actions>
      <q-btn color="negative" @click="handleDelete">Delete</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import type { PartUsageHistory } from '@/types';
import { formatDate } from '@/utils/date';
import { formatDistance } from '@/utils/distance';
import { computed } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';

interface Props {
  history: PartUsageHistory;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  delete: [historyId: string];
}>();

const bikesStore = useBikesStore();
const userSettingsStore = useUserSettingsStore();

const dateString = computed(() => {
  return `${formatDate(props.history.startDate)} - ${props.history.endDate ? formatDate(props.history.endDate) : 'Present'}`;
});
const bikeName = computed(() => {
  return bikesStore.getBikeById(props.history.bikeId)?.name;
});
const distanceString = computed(() => {
  return formatDistance(props.history.distance, userSettingsStore.distanceUnit);
});

const handleDelete = () => {
  emit('delete', props.history.id);
};
</script>

<style scoped lang="scss">
.history-card {
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
}
</style>