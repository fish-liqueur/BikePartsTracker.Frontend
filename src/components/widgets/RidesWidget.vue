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
             @click="handleClickAddRide" />
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

  <!-- Dialogs -->
  <AddRideDialog v-model="showAddRideDialog"
                 @submit="handleAddRideSubmit" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRidesStore } from '@/stores/ridesStore';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import RidesTableContainer from '@/components/tables/RidesTableContainer.vue';
import { defaultRideColumns } from '@/components/tables/ridesTableColumns';
import AddRideDialog from '@/components/dialogs/AddRideDialog.vue';
import type { Bike, CreateRideDto } from '@/types';
import { useLayout } from '@/composables/useLayout';

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
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();

const rideColumns = defaultRideColumns;
const showAddRideDialog = ref(false);

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

const handleClickAddRide = () => {
  showAddRideDialog.value = true;
};

const handleSyncRides = () => {
  void ridesStore.fetchRides();
};

const handleAddRideSubmit = async (ride: CreateRideDto) => {
  try {
    const createdRide = await withAjaxBar(ridesStore.createRide(ride));
    showSuccess(`Ride ${createdRide?.name} created successfully`);

  } catch (err: unknown) {
    console.error('Failed to create ride:', err);
    showError((err as Error)?.message || 'Failed to create ride');
  } finally {
    showAddRideDialog.value = false;
  }
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
