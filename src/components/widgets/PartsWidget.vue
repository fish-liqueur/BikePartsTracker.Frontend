<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="parts-widget">
    <!-- View Mode Toggle -->
    <div class="widget-header">
      <div class="header-left">
        <h2 v-if="title" class="widget-title">{{ title }}</h2>
      </div>
      <div class="header-right">
        <q-btn label="Add part"
               color="primary"
               icon="add"
               @click="showAddPartDialog = true" />
        <q-toggle v-model="showInstalledToOtherBikes"
                  label="Show parts equipped to other bikes"
                  color="primary"
                  class="toggle-filter" />
        <q-btn-toggle v-model="localViewMode"
                      :options="viewModeOptions"
                      toggle-color="primary"
                      @update:model-value="handleViewModeChange" />
      </div>
    </div>

    <!-- Cards View -->
    <div v-if="localViewMode === 'cards'" class="cards-view">
      <div v-if="computedContainers && computedContainers.length > 0"
           class="containers-wrapper"
           :class="{
             'containers-single': computedContainers.length === 1,
             'containers-multiple': computedContainers.length > 1
           }">
        <PartsDragContainer v-for="container in computedContainers"
                            :key="container.id"
                            :parts="container.parts"
                            :container-id="container.id"
                            :title="container.title"
                            :show-count="showCount"
                            :current-bike-mileage="currentBikeMileage"
                            :empty-text="container.emptyText"
                            :bike-context="container.id === 'available' ? null : bikeContext"
                            @part-dropped="handlePartDropped"
                            @part-moved="handlePartMoved"
                            @full-details="handleFullDetails"
                            @rides-history="handleRidesHistory"
                            @show-bike="handleShowBike"
                            @remove-from-bike="handleRemoveFromBike"
                            @put-on-other-bike="handlePutOnOtherBike"
                            @pass-to-other-user="handlePassToOtherUser"
                            @delete="handleDelete"
                            @configure="handleConfigure" />
      </div>
      <div v-else class="no-containers">
        <q-icon name="error_outline"
                size="48px"
                color="grey-5" />
        <p>No parts available</p>
      </div>
    </div>
    <!-- Table View -->
    <div v-else class="table-view">
      <PartsTableContainer v-for="container in computedContainers" 
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
                           @configure="handleConfigure" />
    </div>

    <InstallPartDialog v-model="showInstallDialog"
                       :part-name="partName"
                       :source-bike-name="sourceBikeName"
                       :target-bike-name="targetBikeName"
                       :current-bike-mileage="currentBikeMileage"
                       @install="handleInstallPart"
                       @cancel="handleInstallCancel" />

    <InstallChainDialog v-model="showInstallChainDialog"
                        :chain="pendingPartInstall?.part || null"
                        :target-bike="targetBikeContext"
                        :current-bike-mileage="currentBikeMileage"
                        @install-without-chain-cycle="handleInstallChainWithoutChainCycle"
                        @install-within-chain-cycle="handleInstallChainWithinChainCycle"
                        @cancel="handleInstallCancel" />
  </div>

  <AddPartDialog v-model="showAddPartDialog"
                 :targetBikeId="bikeContext?.id"
                 @create="handleAddPart" />
</template>

<script setup lang="ts">
import {
  ref, computed, watch 
} from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePartsStore } from '@/stores/partsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useChainCyclesStore } from '@/stores/chainCyclesStore';
import { useLayout } from '@/composables/useLayout';
import PartsDragContainer from '@/components/parts/PartsDragContainer.vue';
import PartsTableContainer from '@/components/parts/PartsTableContainer.vue';
import InstallPartDialog from '@/components/dialogs/InstallPartDialog.vue';
import InstallChainDialog from '@/components/dialogs/InstallChainDialog.vue';
import AddPartDialog from '@/components/dialogs/AddPartDialog.vue';
import type { Bike, BikePart, CreatePartDto } from '@/types';
import { EMPTY_GUID } from '@/types';
import { PartType } from '@/types';
import { defaultPartColumns } from '../parts/partsTableColumns';
import type { TableColumn } from '../parts/partsTableColumns';

function mergePartIntoCycleChains(
  chainIds: (string | null)[],
  partId: string,
  index: number
): (string | null)[] {
  const next = [...chainIds].map(id =>
    id != null && String(id) === String(partId) ? null : id
  );
  while (next.length <= index) next.push(null);
  next[index] = partId;
  return next;
}

export interface ContainerConfig {
  id: string;
  title?: string;
  parts: BikePart[];
  emptyText: [string, string];
}
interface DropOptions {
  part?: BikePart;
}
type PartsChangedEvent =
  | { type: 'configure' | 'deleted' | 'fullDetails' | 'passToOtherUser' | 'putOnOtherBike' | 'removedFromBike' | 'ridesHistory'; partId: string }
  | { type: 'moved'; partId: string; data: { sourceContainerId: string; targetContainerId: string } }
  | { type: 'selected'; partId: string; data: { part: BikePart } }
  | { type: 'showBike'; partId: string; data: { bikeId: string } };
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
  tableColumns: () => defaultPartColumns
});
const emit = defineEmits<{
  'update:viewMode': [value: 'cards' | 'table'];
  partsChanged: [event: PartsChangedEvent];
  viewModeChanged: [mode: 'cards' | 'table'];
}>();

const router = useRouter();
const $q = useQuasar();
const partsStore = usePartsStore();
const bikesStore = useBikesStore();
const chainCyclesStore = useChainCyclesStore();
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();

// Dialog state
const showInstallDialog = ref(false);
const showInstallChainDialog = ref(false);
const showAddPartDialog = ref(false);
const pendingPartInstall = ref<{
  partId: string;
  sourceContainerId: string;
  targetContainerId: string;
  part: BikePart | null;
} | null>(null);
// Local view mode
const localViewMode = ref<'cards' | 'table'>(props.viewMode);
const viewModeOptions = [
  {
    label: 'Cards', value: 'cards', icon: 'grid_view' 
  },
  {
    label: 'Table', value: 'table', icon: 'table_view' 
  }
];
// Default: true if no bikeContext, false if bikeContext is set
// const showInstalledToOtherBikes = ref<boolean>(props.bikeContext === null);

const showInstalledToOtherBikes = ref(false);

const allParts = computed(() => partsStore.parts);
const isLoading = computed(() => partsStore.isLoading);
const partName = computed(() => {
  return pendingPartInstall.value?.part?.name || '';
});

const chainPartId = computed(() => pendingPartInstall.value?.partId || '');

const targetBikeContext = computed(() => {
  const targetBikeId = extractBikeId(pendingPartInstall.value?.targetContainerId || '');
  if (!targetBikeId) return null;
  return bikesStore.getBikeById(targetBikeId) ?? null;
});
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
const tableColumns = computed(() =>
  props.tableColumns.length > 0 ? props.tableColumns : defaultPartColumns);

// containers based on bikeContext
const computedContainers = computed<ContainerConfig[]>(() => {
  if (props.bikeContext) {
    // Two containers: parts on this bike, and parts not on this bike
    // Parts on bike: always show all parts installed on this bike
    const partsOnBike = allParts.value.filter(part => part.bikeId === props.bikeContext?.id);

    let partsNotOnBike = allParts.value.filter(part => part.bikeId !== props.bikeContext?.id);

    if (!showInstalledToOtherBikes.value) {
      // Filter to show only parts installed to nothing (no bikeId)
      partsNotOnBike = partsNotOnBike.filter(part =>
        part.bikeId === '' || part.bikeId === null || !part.bikeId);
    }

    return [
      {
        id: `bike-${props.bikeContext.id}`,
        title: `Installed on this Bike (${props.bikeContext.name})`,
        parts: partsOnBike,
        emptyText: ['No parts installed on this bike',
          partsNotOnBike.length > 0 ? 'Drag parts here or click ADD PART to install parts' : 'Click ADD PART button to add one'],
      },
      {
        id: 'available',
        title: 'Available Parts',
        parts: partsNotOnBike,
        emptyText: ['No parts available', 'Click ADD PART button to add one'],
      }
    ];
  } else {
    // Single container: all parts (or filtered if toggle is off)
    let parts = allParts.value;

    if (!showInstalledToOtherBikes.value) {
      // Filter to show only parts installed to nothing (no bikeId)
      parts = parts.filter(part =>
        part.bikeId === '' || part.bikeId === null || !part.bikeId);
    }

    return [
      {
        id: 'all',
        title: 'All Parts',
        parts: parts,
        emptyText: ['No parts available', 'Click ADD PART button to add one'],
      }
    ];
  }
});

// Watch for external viewMode changes
watch(() => props.viewMode, (newMode) => {
  localViewMode.value = newMode;
});

// ---- Methods ----
const resyncContainers = () => {
  partsStore.parts = [...partsStore.parts];
};

const confirmRemoveFromBike = (
  partId: string, onSuccess: () => void, onRollback?: () => void
) => {
  $q.dialog({
    title: 'Remove Part from Bike?',
    message: 'Are you sure you want to remove this part from the bike?',
    cancel: true,
    persistent: false,
  }).onOk(async () => {
    try {
      await withAjaxBar(partsStore.movePartToBike(
        partId, EMPTY_GUID, null, 0
      ));
      showSuccess('Part removed from bike');
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to remove part from bike:', err);
      showError((err as Error)?.message || 'Failed to remove part from bike');
      onRollback?.();
    }
  }).onCancel(() => onRollback?.());
};

const extractBikeId = (containerId: string): string | null =>
  containerId.startsWith('bike-') ? containerId.replace('bike-', '') : null;

const getBikeName = (bikeId: string | null): string => {
  if (!bikeId) return '';
  const bike = bikesStore.getBikeById(bikeId);
  return bike?.name || '';
};

const handleAddPart = async (part: CreatePartDto) => {
  try {
    await withAjaxBar(partsStore.createPart(part));
    showSuccess('Part created successfully');

  } catch (err: unknown) {
    console.error('Failed to create part:', err);
    showError((err as Error)?.message || 'Failed to create part');
  }
};

const handleConfigure = (partId: string) => {
  emit('partsChanged', {
    type: 'configure',
    partId
  });
  router.push(`/parts/${partId}/configure`);
};

const handleDelete = async (partId: string) => {
  if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
    return;
  }

  try {
    await withAjaxBar(partsStore.deletePart(partId));
    showSuccess('Part deleted successfully');
    emit('partsChanged', {
      type: 'deleted',
      partId
    });
  } catch (err: unknown) {
    console.error('Failed to delete part:', err);
    showError((err as Error)?.message || 'Failed to delete part');
  }
};

const handleFullDetails = (partId: string) => {
  emit('partsChanged', {
    type: 'fullDetails',
    partId
  });
  router.push(`/parts/${partId}`);
};

const handleInstallCancel = async () => {
  showInstallDialog.value = false;
  showInstallChainDialog.value = false;
  pendingPartInstall.value = null;
  resyncContainers();
};

const handleInstallPart = async (data: { installationDate: string; mileageAtInstallation: number }) => {
  if (!pendingPartInstall.value) return;

  try {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      partId, sourceContainerId, targetContainerId, part 
    } = pendingPartInstall.value;

    const targetBikeId = extractBikeId(targetContainerId) ?? '';

    const installationDateObj = new Date(data.installationDate);

    await withAjaxBar(partsStore.movePartToBike(
      partId,
      targetBikeId,
      installationDateObj,
      data.mileageAtInstallation
    ));

    showSuccess('Part installed successfully');
    showInstallDialog.value = false;
    showInstallChainDialog.value = false;

    // Store update will automatically update computedContainers via reactivity
    pendingPartInstall.value = null;

  } catch (err: unknown) {
    console.error('Failed to install part:', err);
    showError((err as Error)?.message || 'Failed to install part');
    resyncContainers();
  }
};

const handleInstallChainWithoutChainCycle = async (
  data: { installationDate: Date; mileageAtInstallation: number }
) => {
  if (!pendingPartInstall.value) return;

  try {
    const {
      partId, targetContainerId
    } = pendingPartInstall.value;

    const targetBikeId = extractBikeId(targetContainerId) ?? '';

    await withAjaxBar(partsStore.movePartToBike(
      partId,
      targetBikeId,
      data.installationDate,
      data.mileageAtInstallation
    ));

    showSuccess('Chain installed successfully');
    showInstallDialog.value = false;
    showInstallChainDialog.value = false;
    pendingPartInstall.value = null;
  } catch (err: unknown) {
    console.error('Failed to install chain:', err);
    showError((err as Error)?.message || 'Failed to install chain');
    resyncContainers();
  }
};

const handleInstallChainWithinChainCycle = async (
  data: {
    chainCycleId: string;
    position: number;
    setAsActive: boolean;
    installationTime?: Date;
  }
) => {
  if (!pendingPartInstall.value) return;

  const { partId, targetContainerId } = pendingPartInstall.value;
  const targetBikeId = extractBikeId(targetContainerId) ?? '';
  if (!targetBikeId) return;

  try {
    await withAjaxBar(partsStore.movePartToBike(
      partId,
      targetBikeId,
      data.setAsActive ? (data.installationTime ?? new Date()) : null,
      data.setAsActive ? (props.currentBikeMileage ?? null) : null
    ));

    const cycle = chainCyclesStore.getChainCyclesForBike(targetBikeId)
      .find(c => c.id === data.chainCycleId);
    if (!cycle) throw new Error('Chain cycle not found');

    const oldSlotId = (cycle.chains ?? [])[data.position] ?? null;
    let newChains = mergePartIntoCycleChains(cycle.chains ?? [], partId, data.position);

    let activeChainId = cycle.activeChainId ?? null;
    if (data.setAsActive) {
      activeChainId = partId;
    } else if (activeChainId != null && oldSlotId != null && String(activeChainId) === String(oldSlotId)) {
      activeChainId = null;
    }

    const prevActive = cycle.activeChainId == null ? null : String(cycle.activeChainId);
    const nextActive = activeChainId == null ? null : String(activeChainId);
    await withAjaxBar(chainCyclesStore.updateChainCycle(data.chainCycleId, targetBikeId, {
      chains: newChains,
      ...(nextActive !== prevActive
        ? { activeChainId: activeChainId === null ? EMPTY_GUID : activeChainId }
        : {})
    }));

    showSuccess('Chain installed into chain cycle successfully');
    showInstallDialog.value = false;
    showInstallChainDialog.value = false;
    pendingPartInstall.value = null;
  } catch (err: unknown) {
    console.error('Failed to install chain into chain cycle:', err);
    showError((err as Error)?.message || 'Failed to install chain into chain cycle');
    try {
      await partsStore.fetchParts();
      await chainCyclesStore.fetchChainCycles(targetBikeId);
    } catch {
      /* ignore */
    }
  }
};

const handlePartDropped = (
  partId: string,
  sourceContainerId: string,
  targetContainerId: string,
  options?: DropOptions
) => {
  const { part } = options ?? {};

  if (!part) {
    showError('Part not found');
    resyncContainers();
    return;
  }

  const targetBikeId = extractBikeId(targetContainerId);

  if (targetBikeId) {
    pendingPartInstall.value = {
      partId, sourceContainerId, targetContainerId, part
    };
    if (part.partType === PartType.Chain) {
      showInstallDialog.value = false;
      showInstallChainDialog.value = true;
    } else {
      showInstallChainDialog.value = false;
      showInstallDialog.value = true;
    }
    return;
  }

  if (targetContainerId === 'available' || targetContainerId === 'all') {
    confirmRemoveFromBike(
      partId,
      () => emit('partsChanged', {
        type: 'moved', partId, data: { sourceContainerId, targetContainerId } 
      }),
      () => resyncContainers(),
    );
  }
};

const handlePartMoved = (
  partId: string, sourceContainerId: string, targetContainerId: string
) => {
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

const handlePassToOtherUser = (partId: string) => {
  emit('partsChanged', {
    type: 'passToOtherUser',
    partId
  });
  // TODO: Implement user selection dialog/modal
};

const handlePutOnOtherBike = (partId: string) => {
  emit('partsChanged', {
    type: 'putOnOtherBike',
    partId
  });
  // TODO: Implement bike selection dialog/modal
};

const handleRemoveFromBike = (partId: string) => {
  confirmRemoveFromBike(partId,
    () => emit('partsChanged', { type: 'removedFromBike', partId }),);
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

const handleViewModeChange = (mode: 'cards' | 'table') => {
  localViewMode.value = mode;
  emit('update:viewMode', mode);
  emit('viewModeChanged', mode);
};

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
  /* height: 100%; */
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
