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
             @click="handleClickSyncRides" />
      <q-btn label="Add Ride"
             color="primary"
             icon="add"
             @click="handleClickAddRide" />
    </template>
    <template #default>
      <div class="rides-widget__table-view">
        <RidesTableContainer :rides="ridesToShow"
                             :loading="isLoading"
                             :columns="rideColumns"
                             :show-count="true" 
                             @edit="handleEditRide" 
                             @changeActivityState="handleChangeActivityState"
                             @deleteRide="handleDeleteRide" />
      </div>
    </template>
  </LayoutWidgetGeneral>

  <!-- Dialogs -->
  <AddRideDialog v-model="showAddRideDialog"
                 @submit="handleAddRideSubmit" />
  <EditRideDialog v-model="showEditRideDialog"
                  :initial-data="currentRide"
                  @submit="handleEditRideSubmit" />
  <SyncRidesDialog v-model="showSyncRidesDialog"
                   :date-from="dateFrom"
                   @submit="handleSyncRides" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRidesStore } from '@/stores/ridesStore';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import RidesTableContainer from '@/components/tables/RidesTableContainer.vue';
import { defaultRideColumns } from '@/components/tables/ridesTableColumns';
import AddRideDialog from '@/components/dialogs/AddRideDialog.vue';
import EditRideDialog from '@/components/dialogs/EditRideDialog.vue';
import SyncRidesDialog from '@/components/dialogs/SyncRidesDialog.vue';
import type { Bike, CreateRideDto, ImportStravaRidesRequestDto, Ride, UpdateRideDto } from '@/types';
import { useLayout } from '@/composables/useLayout';
import { useQuasar } from 'quasar';

interface Props {
  bikeContext?: Bike | null;
  title?: string;
  dateFrom?: Date | null;
}

const props = withDefaults(defineProps<Props>(), {
  bikeContext: null,
  title: '',
  dateFrom: null,
});

const ridesStore = useRidesStore();
const { ridesSorted, isLoading } = storeToRefs(ridesStore);
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();
const $q = useQuasar();

const currentRide = ref<Ride | null>(null);
const rideColumns = defaultRideColumns;
const showAddRideDialog = ref(false);
const showEditRideDialog = ref(false);
const showSyncRidesDialog = ref(false);

const ridesToShow = computed(() => {
  // Could use a sequential reassignment for each filtering property,
  // but like this way because it applies all the filters at a single pass. 
  const predicates: Array<(r: Ride) => boolean> = [];

  if (props.bikeContext) {
    const bikeId = props.bikeContext.id;
    predicates.push((r) => r.bikeId === bikeId);
  }
  if (props.dateFrom) {
    const fromTime = props.dateFrom.getTime();
    predicates.push((r) => new Date(r.startDateLocal).getTime() >= fromTime);
  }
  
  return ridesSorted.value.filter((r) => predicates.every((p) => p(r)));
});

onMounted(() => {
  void ridesStore.ensureRides();
});

const handleClickAddRide = () => {
  showAddRideDialog.value = true;
};

const handleClickSyncRides = () => {
  showSyncRidesDialog.value = true;
};

const handleSyncRides = async (importData: ImportStravaRidesRequestDto) => {
  try {
    await withAjaxBar(ridesStore.importFromStrava(importData));
    showSyncRidesDialog.value = false;
    showSuccess(`Rides synced successfully from ${importData.startDate} to ${importData.endDate}`);

  } catch (err: unknown) {
    showError((err as Error)?.message || 'Failed to sync rides');
  }
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

const handleEditRide = (ride: Ride) => {
  currentRide.value = ride;
  showEditRideDialog.value = true;
};

const handleEditRideSubmit = async (ride: UpdateRideDto) => {
  try {
    const updatedRide = await withAjaxBar(ridesStore.updateRide(currentRide.value?.id ?? '', ride));
    showSuccess(`Ride ${updatedRide?.name ?? ride.name} updated successfully`);
  } catch (err: unknown) {
    console.error('Failed to update ride:', err);
    showError((err as Error)?.message || 'Failed to update ride');
  } finally {
    showEditRideDialog.value = false;
  }
};

const handleChangeActivityState = async (ride: Ride, newActivityState: boolean) => {
  try {
    const updatedRide = await withAjaxBar(ridesStore.updateRide(ride.id, { isActive: newActivityState }));
    showSuccess(`Ride ${updatedRide?.name ?? ride.name} ${newActivityState ? 'is now active again' : 'will be ignored from now on'}`);
  } catch (err: unknown) {
    console.error('Failed to update ride:', err);
    showError((err as Error)?.message || 'Failed to update ride');
  }
};

const handleDeleteRide = async (ride: Ride) => {
  try {
    const {
      name, id, stravaActivityId 
    } = ride;
    const message = stravaActivityId ? 
      'This ride is imported from Strava. We never change any data in your Strava, just importing them. So, deleting this ride will erase it from our database. But as long it remains in your Strava, it still can be auto-imported again.' :
      'This action cannot be undone. All data will be lost for good.';
    $q.dialog({
      title: `Do you want to delete ride "${name}"?`,
      message,
      cancel: true,
      persistent: false
    }).onOk(async () => {
      console.log('Deleting ride:', id);
      await withAjaxBar(ridesStore.deleteRide(id));
      showSuccess(`Ride ${name} deleted successfully`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete the ride';
    showError(message);
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
