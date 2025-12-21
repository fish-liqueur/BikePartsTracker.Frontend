<template>
  <div class="bikes-widget">
    <!-- View Mode Toggle -->
    <div class="widget-header">
      <div class="header-left">
        <h2 v-if="title" class="widget-title">{{ title }}</h2>
      </div>
      <div class="header-right">
        <q-btn
          label="Add New Bike"
          color="primary"
          icon="add"
          @click="showAddBikeDialog = true"
          class="action-button"
        />
        <q-btn
          label="Import Bikes"
          color="secondary"
          icon="upload"
          @click="handleImportBikes"
          class="action-button"
        />
        <q-btn-toggle
          v-model="localViewMode"
          :options="viewModeOptions"
          toggle-color="primary"
          @update:model-value="handleViewModeChange"
        />
      </div>
    </div>

    <!-- Cards View -->
    <div v-if="localViewMode === 'cards'" class="cards-view">
      <div v-if="bikes && bikes.length > 0" class="bikes-grid">
        <BikeCard
          v-for="bike in bikes"
          :key="bike.id"
          :bike="bike"
          @full-details="handleFullDetails"
          @rides="handleRides"
          @parts="handleParts"
          @configure="handleConfigure"
        />
      </div>
      <div v-else class="no-bikes">
        <q-icon name="directions_bike" size="64px" color="grey-5" />
        <p>No bikes available</p>
        <q-btn
          label="Add Your First Bike"
          color="primary"
          icon="add"
          @click="showAddBikeDialog = true"
          class="add-first-button"
        />
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="table-view">
      <BikesTableContainer
        :bikes="bikes"
        :loading="isLoading"
        :columns="tableColumns"
        @bike-selected="handleBikeSelected"
        @full-details="handleFullDetails"
        @rides="handleRides"
        @parts="handleParts"
        @configure="handleConfigure"
        @delete="handleDelete"
      />
    </div>

    <!-- Add Bike Dialog -->
    <AddBikeDialog
      v-model="showAddBikeDialog"
      @submit="handleAddBike"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import BikeCard from '@/components/cards/BikeCard.vue';
import BikesTableContainer from '@/components/bikes/BikesTableContainer.vue';
import AddBikeDialog from '@/components/bikes/AddBikeDialog.vue';
import type { Bike, CreateBikeDto } from '@/types';

export interface TableColumn {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (val: any, row: any) => string;
}

interface Props {
  title?: string;
  tableColumns?: TableColumn[];
}

const props = withDefaults(defineProps<Props>(), {
  tableColumns: () => [
    {
      name: 'name',
      label: 'Name',
      field: 'name',
      align: 'left',
      sortable: true,
    },
    {
      name: 'brand',
      label: 'Brand',
      field: 'brand',
      align: 'left',
      sortable: true,
    },
    {
      name: 'model',
      label: 'Model',
      field: 'model',
      align: 'left',
      sortable: true,
    },
    {
      name: 'year',
      label: 'Year',
      field: 'year',
      align: 'center',
      sortable: true,
    },
    {
      name: 'parts',
      label: 'Parts',
      field: 'parts',
      align: 'center',
      sortable: false,
    },
    {
      name: 'actions',
      label: 'Actions',
      field: 'actions',
      align: 'center',
      sortable: false,
    },
  ]
});

const emit = defineEmits<{
  bikesChanged: [event: { type: string; bikeId: string; data?: any }];
}>();

const router = useRouter();
const bikesStore = useBikesStore();
const { showSuccess, showError, withAjaxBar } = useLayout();

const localViewMode = ref<'cards' | 'table'>('cards');
const showAddBikeDialog = ref(false);

const viewModeOptions = [
  { label: 'Cards', value: 'cards', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'table_view' }
];

const isLoading = computed(() => bikesStore.isLoading);
const bikes = computed(() => bikesStore.bikes);
const tableColumns = computed(() => props.tableColumns);

const handleViewModeChange = (mode: 'cards' | 'table') => {
  localViewMode.value = mode;
};

const handleAddBike = async (bikeData: CreateBikeDto) => {
  try {
    const newBike = await withAjaxBar(
      bikesStore.createBike(bikeData)
    );
    
    showSuccess('Bike added successfully');
    showAddBikeDialog.value = false;
    
    emit('bikesChanged', {
      type: 'created',
      bikeId: newBike?.id || '',
      data: { bike: newBike }
    });
  } catch (err: any) {
    console.error('Failed to add bike:', err);
    showError(err.message || 'Failed to add bike');
  }
};

const handleImportBikes = () => {
  // TODO: Implement bike import functionality
  showError('Import bikes functionality coming soon');
};

const handleBikeSelected = (bike: Bike) => {
  emit('bikesChanged', {
    type: 'selected',
    bikeId: bike.id,
    data: { bike }
  });
};

const handleFullDetails = (bikeId: string) => {
  emit('bikesChanged', {
    type: 'fullDetails',
    bikeId
  });
  router.push(`/bikes/${bikeId}`);
};

const handleRides = (bikeId: string) => {
  emit('bikesChanged', {
    type: 'rides',
    bikeId
  });
  router.push(`/bikes/${bikeId}/rides`);
};

const handleParts = (bikeId: string) => {
  emit('bikesChanged', {
    type: 'parts',
    bikeId
  });
  router.push(`/bikes/${bikeId}/parts`);
};

const handleConfigure = (bikeId: string) => {
  emit('bikesChanged', {
    type: 'configure',
    bikeId
  });
  router.push(`/bikes/${bikeId}/configure`);
};

const handleDelete = async (bikeId: string) => {
  if (!confirm('Are you sure you want to delete this bike? This action cannot be undone.')) {
    return;
  }

  try {
    await withAjaxBar(
      bikesStore.deleteBike(bikeId)
    );
    showSuccess('Bike deleted successfully');
    emit('bikesChanged', {
      type: 'deleted',
      bikeId
    });
  } catch (err: any) {
    console.error('Failed to delete bike:', err);
    showError(err.message || 'Failed to delete bike');
  }
};

// Fetch bikes when component mounts
onMounted(async () => {
  try {
    await bikesStore.fetchBikes();
  } catch (error) {
    console.error('Failed to fetch bikes:', error);
  }
});
</script>

<style scoped lang="css">
.bikes-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  flex: 1;
}

.widget-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-button {
  margin-right: 8px;
}

.cards-view {
  width: 100%;
  flex: 1 1 auto;
  overflow-y: auto;
}

.bikes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.no-bikes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  text-align: center;
  color: #718096;
}

.no-bikes p {
  margin: 16px 0 24px 0;
  font-size: 1.125rem;
}

.add-first-button {
  margin-top: 8px;
}

.table-view {
  flex: 1 1 auto;
  overflow-y: auto;
  width: 100%;
}

@media (max-width: 1024px) {
  .bikes-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .action-button {
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .bikes-grid {
    grid-template-columns: 1fr;
  }
}
</style>

