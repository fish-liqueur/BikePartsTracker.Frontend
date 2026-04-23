<template>
  <LayoutWidgetGeneral class="rides-widget">
    <template #header-left>
      <h2 v-if="title">{{ title }}</h2>
    </template>
    <template #header-right>
      <q-btn label="Sync Rides"
             color="primary"
             outline
             icon="sync"
             :loading="isLoading"
             @click="handleSyncRides" />
      <q-btn label="Add Ride"
             color="primary"
             icon="add"
             @click="handleAddRide" />
    </template>
    <template #default>
      <div class="rides-widget__table-view">
        <RidesTableContainer :rides="rides"
                             :loading="isLoading"
                             :columns="rideColumns"
                             :show-count="true" />
      </div>
    </template>
  </LayoutWidgetGeneral>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRidesStore } from '@/stores/ridesStore';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import RidesTableContainer from '@/components/rides/RidesTableContainer.vue';
import { defaultRideColumns } from '@/components/rides/ridesTableColumns';
import type { Bike } from '@/types';

interface Props {
  bikeContext?: Bike | null;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  bikeContext: null,
  title: '',
});

const ridesStore = useRidesStore();
const { ridesSorted, isLoading } = storeToRefs(ridesStore);

const rideColumns = defaultRideColumns;

const rides = computed(() => {
  const list = ridesSorted.value;
  if (!props.bikeContext) {
    return list;
  }
  const bikeId = String(props.bikeContext.id);
  return list.filter((r) => r.bikeId != null && String(r.bikeId) === bikeId);
});

onMounted(() => {
  void ridesStore.ensureRides();
});

const handleSyncRides = () => {
  void ridesStore.fetchRides();
};

const handleAddRide = () => {
  // Placeholder until add-ride flow exists
};
</script>

<style scoped lang="scss">
.rides-widget {
  &__table-view {
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
    align-self: stretch;
  }
}
</style>
