<template>
  <div class="parts-widget">
    <!-- View Mode Toggle -->
    <div class="widget-header">
      <div class="header-left">
        <h2 v-if="title" class="widget-title">{{ title }}</h2>
      </div>
      <div class="header-right">
        <q-btn
        label="Add part"
        color="primary"
        icon="add"
        
        @click="addPart"
      />
        <q-toggle
          v-model="showInstalledToOtherBikes"
          label="Show parts equipped to other bikes"
          color="primary"
          class="toggle-filter"
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
      <div
        v-if="computedContainers && computedContainers.length > 0"
        class="containers-wrapper"
        :class="{
          'containers-single': computedContainers.length === 1,
          'containers-multiple': computedContainers.length > 1
        }"
      >
        <PartsDragContainer
          v-for="container in computedContainers"
          :key="container.id"
          :parts="container.parts"
          :container-id="container.id"
          :title="container.title"
          :show-count="showCount"
          :current-bike-mileage="currentBikeMileage"
          @part-dropped="handlePartDropped"
          @part-moved="handlePartMoved"
          @full-details="handleFullDetails"
          @rides-history="handleRidesHistory"
          @show-bike="handleShowBike"
          @remove-from-bike="handleRemoveFromBike"
          @put-on-other-bike="handlePutOnOtherBike"
          @pass-to-other-user="handlePassToOtherUser"
          @delete="handleDelete"
          @configure="handleConfigure"
        />
      </div>
      <div v-else class="no-containers">
        <q-icon name="error_outline" size="48px" color="grey-5" />
        <p>No parts available</p>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="table-view">
      <PartsTableContainer
        v-for="container in computedContainers"
        :key="container.id"
        :parts="container.parts"
        :container-id="container.id"
        :title="container.title"
        :show-count="showCount"
        :current-bike-mileage="currentBikeMileage"
        :loading="isLoading"
        :columns="tableColumns"
        @part-selected="handlePartSelected"
        @full-details="handleFullDetails"
        @rides-history="handleRidesHistory"
        @show-bike="handleShowBike"
        @remove-from-bike="handleRemoveFromBike"
        @put-on-other-bike="handlePutOnOtherBike"
        @pass-to-other-user="handlePassToOtherUser"
        @delete="handleDelete"
        @configure="handleConfigure"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePartsStore } from '@/stores/partsStore';
import { useLayout } from '@/composables/useLayout';
import PartsDragContainer from './PartsDragContainer.vue';
import PartsTableContainer from './PartsTableContainer.vue';
import type { Bike, BikePart } from '@/types';
import type { TableColumn } from './PartsTableContainer.vue';

export interface ContainerConfig {
  id: string;
  title?: string;
  parts: BikePart[];
}

interface Props {
  viewMode?: 'cards' | 'table';
  bikeContext?: Bike | null;
  title?: string;
  showCount?: boolean;
  currentBikeMileage?: number;
  tableColumns?: TableColumn[];
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'cards',
  bikeContext: null,
  showCount: true,
  currentBikeMileage: 0,
  tableColumns: () => [
    {
      name: 'partType',
      label: 'Type',
      field: 'partType',
      align: 'left',
      sortable: true,
    },
    {
      name: 'name',
      label: 'Name',
      field: 'name',
      align: 'left',
      sortable: true,
    },
    {
      name: 'bike',
      label: 'Bike',
      field: 'bikeId',
      align: 'left',
      sortable: true,
    },
    {
      name: 'mileage',
      label: 'Total Mileage',
      field: 'mileage',
      align: 'right',
      sortable: true,
    },
    {
      name: 'remaining',
      label: 'Remaining',
      field: 'remaining',
      align: 'right',
      sortable: true,
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

// Default table columns - defined after props to avoid hoisting issue
const defaultTableColumns: TableColumn[] = [
  {
    name: 'partType',
    label: 'Type',
    field: 'partType',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'bike',
    label: 'Bike',
    field: 'bikeId',
    align: 'left',
    sortable: true,
  },
  {
    name: 'mileage',
    label: 'Total Mileage',
    field: 'mileage',
    align: 'right',
    sortable: true,
  },
  {
    name: 'remaining',
    label: 'Remaining',
    field: 'remaining',
    align: 'right',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center',
    sortable: false,
  },
];

// Computed columns - use provided columns or defaults
const tableColumns = computed(() => {
  return props.tableColumns && props.tableColumns.length > 0 
    ? props.tableColumns 
    : defaultTableColumns;
});

const emit = defineEmits<{
  'update:viewMode': [value: 'cards' | 'table'];
  partsChanged: [event: { type: string; partId: string; data?: any }];
  viewModeChanged: [mode: 'cards' | 'table'];
}>();

const router = useRouter();
const partsStore = usePartsStore();
const { showSuccess, showError, withAjaxBar } = useLayout();

const localViewMode = ref<'cards' | 'table'>(props.viewMode);
// Default: true if no bikeContext, false if bikeContext is set
const showInstalledToOtherBikes = ref<boolean>(props.bikeContext === null);

const viewModeOptions = [
  { label: 'Cards', value: 'cards', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'table_view' }
];

const isLoading = computed(() => partsStore.isLoading);

// Get all parts from store
const allParts = computed(() => partsStore.parts);

// Compute containers based on bikeContext
const computedContainers = computed<ContainerConfig[]>(() => {
  if (props.bikeContext) {
    // Two containers: parts on this bike, and parts not on this bike
    // Parts on bike: always show all parts installed on this bike
    const partsOnBike = allParts.value.filter(
      part => part.bikeId === props.bikeContext?.id
    );
    
    let partsNotOnBike = allParts.value.filter(
      part => part.bikeId !== props.bikeContext?.id
    );
    
    if (!showInstalledToOtherBikes.value) {
      // Filter to show only parts installed to nothing (no bikeId)
      partsNotOnBike = partsNotOnBike.filter(part => 
        part.bikeId === '' || part.bikeId === null || !part.bikeId
      );
    }
    
    return [
      {
        id: `bike-${props.bikeContext.id}`,
        title: `Installed on this Bike (${props.bikeContext.name})`,
        parts: partsOnBike
      },
      {
        id: 'available',
        title: 'Available Parts',
        parts: partsNotOnBike
      }
    ];
  } else {
    // Single container: all parts (or filtered if toggle is off)
    let parts = allParts.value;
    
    if (!showInstalledToOtherBikes.value) {
      // Filter to show only parts installed to nothing (no bikeId)
      parts = parts.filter(part => 
        part.bikeId === '' || part.bikeId === null || !part.bikeId
      );
    }
    
    return [
      {
        id: 'all',
        title: 'All Parts',
        parts: parts
      }
    ];
  }
});

const handleViewModeChange = (mode: 'cards' | 'table') => {
  localViewMode.value = mode;
  emit('update:viewMode', mode);
  emit('viewModeChanged', mode);
};

// Watch for external viewMode changes
watch(() => props.viewMode, (newMode) => {
  localViewMode.value = newMode;
});

const handlePartDropped = async (
  partId: string,
  sourceContainerId: string,
  targetContainerId: string
) => {
  try {
    // Extract bikeId from targetContainerId
    let targetBikeId: string | null = null;
    
    if (targetContainerId.startsWith('bike-')) {
      // Extract bike ID from container ID like "bike-123"
      targetBikeId = targetContainerId.replace('bike-', '');
    } else if (targetContainerId === 'available' || targetContainerId === 'all') {
      // Moving to available/uninstalled
      targetBikeId = null;
    }

    await withAjaxBar(
      partsStore.movePartToBike(partId, targetBikeId || '')
    );

    showSuccess('Part moved successfully');
    
    emit('partsChanged', {
      type: 'moved',
      partId,
      data: { sourceContainerId, targetContainerId }
    });
  } catch (err: any) {
    console.error('Failed to move part:', err);
    showError(err.message || 'Failed to move part');
  }
};

const handlePartMoved = (
  partId: string,
  sourceContainerId: string,
  targetContainerId: string
) => {
  // This is handled by handlePartDropped
  // But we emit it separately if needed
  emit('partsChanged', {
    type: 'moved',
    partId,
    data: { sourceContainerId, targetContainerId }
  });
};

const handlePartSelected = (part: BikePart) => {
  emit('partsChanged', {
    type: 'selected',
    partId: part.id,
    data: { part }
  });
};

const handleFullDetails = (partId: string) => {
  emit('partsChanged', {
    type: 'fullDetails',
    partId
  });
  router.push(`/parts/${partId}`);
};

const handleRidesHistory = (partId: string) => {
  emit('partsChanged', {
    type: 'ridesHistory',
    partId
  });
  router.push(`/parts/${partId}/rides`);
};

const handleShowBike = (bikeId: string) => {
  emit('partsChanged', {
    type: 'showBike',
    partId: '',
    data: { bikeId }
  });
  router.push(`/bikes/${bikeId}`);
};

const handleRemoveFromBike = async (partId: string) => {
  try {
    await withAjaxBar(
      partsStore.movePartToBike(partId, '')
    );
    showSuccess('Part removed from bike');
    emit('partsChanged', {
      type: 'removedFromBike',
      partId
    });
  } catch (err: any) {
    console.error('Failed to remove part from bike:', err);
    showError(err.message || 'Failed to remove part from bike');
  }
};

const handlePutOnOtherBike = (partId: string) => {
  emit('partsChanged', {
    type: 'putOnOtherBike',
    partId
  });
  // TODO: Implement bike selection dialog/modal
};

const handlePassToOtherUser = (partId: string) => {
  emit('partsChanged', {
    type: 'passToOtherUser',
    partId
  });
  // TODO: Implement user selection dialog/modal
};

const handleDelete = async (partId: string) => {
  if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
    return;
  }

  try {
    await withAjaxBar(
      partsStore.deletePart(partId)
    );
    showSuccess('Part deleted successfully');
    emit('partsChanged', {
      type: 'deleted',
      partId
    });
  } catch (err: any) {
    console.error('Failed to delete part:', err);
    showError(err.message || 'Failed to delete part');
  }
};

const handleConfigure = (partId: string) => {
  emit('partsChanged', {
    type: 'configure',
    partId
  });
  router.push(`/parts/${partId}/configure`);
};

const addPart = () => {
  // TODO: Implement add part dialog/modal
};
</script>

<style scoped lang="css">
.parts-widget {
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

.toggle-filter {
  margin-right: 8px;
}

.cards-view {
  width: 100%;
  flex: 1 1 auto;
  overflow-y: auto;
}

.containers-wrapper {
  display: flex;
  gap: 24px;
  flex-direction: column;
}

.containers-wrapper.containers-multiple {
  flex-direction: row;
  height: 100%;
}

.containers-wrapper.containers-multiple .parts-drag-container {
  display: flex;
  flex-direction: column;
  width: calc(50% - 12px);
  height: 100%;
  overflow-y: auto;
}

.containers-wrapper.containers-multiple .parts-drag-container:first-child {
  background-color: rgba(33, 186, 69, 0.1);
}

.containers-wrapper.containers-multiple .parts-drag-container:first-child :deep(.part-card) {
    box-shadow:
    2px 1px .5rem rgba(33, 186, 69, 0.4), 
    2px 2px .4rem rgba(49, 204, 236, 0.3), 
    0 3px 1px -2px rgba(33, 186, 69, 0.3);
    transition: 0.3s;
}

.containers-wrapper.containers-multiple .parts-drag-container:first-child :deep(.part-card):hover {
    box-shadow:
    2px 1px .5rem rgba(33, 186, 69, 0.8), 
    2px 2px .4rem rgba(49, 204, 236, 0.6), 
    0 3px 1px -2px rgba(33, 186, 69, 0.6);
}

.containers-wrapper.containers-multiple .parts-drag-container:last-child {
  background-color: rgba(49, 204, 236, 0.1);
}

.containers-wrapper.containers-single {
  max-width: 100%;
}

.table-view {
  flex: 1 1 auto;
  overflow-y: auto;
  width: 100%;
}

.no-containers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  color: #718096;
}

.no-containers p {
  margin: 16px 0 0 0;
  font-size: 1rem;
}

@media (max-width: 1024px) {
  .containers-wrapper.containers-multiple {
    flex-direction: column;
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
    justify-content: flex-end;
  }
}
</style>

