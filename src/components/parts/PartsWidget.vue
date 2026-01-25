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
          @add-to-container="handleAddToContainer"
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

    <!-- Install Part Dialog -->
    <InstallPartDialog
      v-model="showInstallDialog"
      :part-name="partName"
      :source-bike-name="sourceBikeName"
      :target-bike-name="targetBikeName"
      :current-bike-mileage="currentBikeMileage"
      @install="handleInstallPart"
      @cancel="handleInstallCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePartsStore } from '@/stores/partsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import PartsDragContainer from './PartsDragContainer.vue';
import PartsTableContainer from './PartsTableContainer.vue';
import InstallPartDialog from './InstallPartDialog.vue';
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
const $q = useQuasar();
const partsStore = usePartsStore();
const bikesStore = useBikesStore();
const { showSuccess, showError, withAjaxBar } = useLayout();

// Dialog state
const showInstallDialog = ref(false);
const pendingPartInstall = ref<{
  partId: string;
  sourceContainerId: string;
  targetContainerId: string;
  part: BikePart | null;
  removeFromTarget?: () => void;
} | null>(null);

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
  targetContainerId: string,
  options?: any
) => {
  const { part, removeFromTarget } = options || {};
  
  if (!part) {
    showError('Part not found');
    // Remove from target container if we can
    if (removeFromTarget) {
      removeFromTarget();
    }
    return;
  }

  // Extract bikeId from targetContainerId
  let targetBikeId: string | null = null;
  
  if (targetContainerId.startsWith('bike-')) {
    // Extract bike ID from container ID like "bike-123"
    targetBikeId = targetContainerId.replace('bike-', '');
  } else if (targetContainerId === 'available' || targetContainerId === 'all') {
    // Moving to available/uninstalled - show confirmation
    $q.dialog({
      title: 'Remove Part from Bike?',
      message: 'Are you sure you want to remove this part from the bike?',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      try {
        await withAjaxBar(
          partsStore.movePartToBike(partId, '', null, 0)
        );
        showSuccess('Part removed from bike');
        
        // Store update will automatically update computedContainers via reactivity
        emit('partsChanged', {
          type: 'moved',
          partId,
          data: { sourceContainerId, targetContainerId }
        });
      } catch (err: any) {
        console.error('Failed to remove part from bike:', err);
        showError(err.message || 'Failed to remove part from bike');
        // Remove from target on error
        if (removeFromTarget) {
          removeFromTarget();
        }
        // Add back to source container
        addPartToContainer(partId, sourceContainerId, part);
      }
    }).onCancel(() => {
      // Cancel: remove from target and add back to source
      if (removeFromTarget) {
        removeFromTarget();
      }
      addPartToContainer(partId, sourceContainerId, part);
    });
    return;
  }

  // If installing on a bike, show installation dialog
  if (targetBikeId) {
    // Store pending installation info
    pendingPartInstall.value = {
      partId,
      sourceContainerId,
      targetContainerId,
      part,
      removeFromTarget
    };
    showInstallDialog.value = true;
  }
};

// Helper to add part back to source container on cancel
const addPartToContainer = (partId: string, containerId: string, part: BikePart) => {
  // We'll need to emit an event that the container can listen to
  // For now, refresh from store which will reset everything
  // A better approach would be to use a ref to the container component
  partsStore.fetchParts();
};

// Handle add to container event from child
const handleAddToContainer = (partId: string, containerId: string, part: BikePart) => {
  // This is handled by refreshing from store
  // The container's watch on props.parts will update localParts
  partsStore.fetchParts();
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
  console.log('handleRemoveFromBike', partId);
  
  $q.dialog({
    title: 'Remove Part from Bike?',
    message: 'Are you sure you want to remove this part from the bike?',
    cancel: true,
    persistent: false
  }).onOk(async () => {
    try {
      await withAjaxBar(
        partsStore.movePartToBike(partId, '', null, 0)
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
  });
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

// Handle installation dialog
const handleInstallPart = async (data: { installationDate: string; mileageAtInstallation: number }) => {
  if (!pendingPartInstall.value) return;

  try {
    const { partId, sourceContainerId, targetContainerId, part } = pendingPartInstall.value;
    
    // Extract target bike ID
    let targetBikeId = '';
    if (targetContainerId.startsWith('bike-')) {
      targetBikeId = targetContainerId.replace('bike-', '');
    }

    const installationDateObj = new Date(data.installationDate);

    await withAjaxBar(
      partsStore.movePartToBike(
        partId,
        targetBikeId,
        installationDateObj,
        data.mileageAtInstallation
      )
    );

    showSuccess('Part installed successfully');
    showInstallDialog.value = false;
    
    // Store update will automatically update computedContainers via reactivity
    const savedPartId = partId;
    pendingPartInstall.value = null;

    emit('partsChanged', {
      type: 'moved',
      partId: savedPartId,
      data: { sourceContainerId, targetContainerId }
    });
  } catch (err: any) {
    console.error('Failed to install part:', err);
    showError(err.message || 'Failed to install part');
    // Remove from target on error and add back to source
    if (pendingPartInstall.value?.removeFromTarget) {
      pendingPartInstall.value.removeFromTarget();
    }
    if (pendingPartInstall.value?.part && pendingPartInstall.value?.partId) {
      addPartToContainer(pendingPartInstall.value.partId, pendingPartInstall.value.sourceContainerId, pendingPartInstall.value.part);
    }
  }
};

const handleInstallCancel = async () => {
  // Cancel: remove from target and add back to source
  if (pendingPartInstall.value?.removeFromTarget) {
    pendingPartInstall.value.removeFromTarget();
  }
  if (pendingPartInstall.value?.part) {
    addPartToContainer(
      pendingPartInstall.value.partId,
      pendingPartInstall.value.sourceContainerId,
      pendingPartInstall.value.part
    );
  }
  
  showInstallDialog.value = false;
  pendingPartInstall.value = null;
};

// Get bike names for dialog
const getBikeName = (bikeId: string | null): string => {
  if (!bikeId) return '';
  const bike = bikesStore.getBikeById(bikeId);
  return bike?.name || '';
};

const sourceBikeName = computed(() => {
  if (!pendingPartInstall.value?.part) return '';
  const sourceBikeId = pendingPartInstall.value.part.bikeId;
  return getBikeName(sourceBikeId);
});

const targetBikeName = computed(() => {
  if (!pendingPartInstall.value?.targetContainerId) return '';
  if (pendingPartInstall.value.targetContainerId.startsWith('bike-')) {
    const bikeId = pendingPartInstall.value.targetContainerId.replace('bike-', '');
    return getBikeName(bikeId);
  }
  return '';
});

const partName = computed(() => {
  return pendingPartInstall.value?.part?.name || '';
});
</script>

<style scoped lang="css">
.parts-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
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
  box-shadow:
    2px 1px .5rem rgba(49, 204, 236, 0.6), 
    2px 2px .4rem rgba(49, 204, 236, 0.5), 
    0 3px 1px -2px rgba(49, 204, 236, 0.5);
}

.containers-wrapper.containers-multiple .parts-drag-container:last-child :deep(.part-card.part-card--on-other-bike) {
  filter: grayscale(60%);
  /* background-color: rgba(193, 0, 21, 0.1); */
  box-shadow:
    2px 1px .5rem rgba(193, 0, 21, 0.4), 
    2px 2px .4rem rgba(193, 0, 21, 0.3), 
    0 3px 1px -2px rgba(193, 0, 21, 0.3);
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

