<template>
  <LayoutWidgetGeneral :is-loading="isLoading" class="maintenance-tasks-widget container">
    <template #header-left>
      <h2 v-if="title">{{ title }}</h2>
    </template>
    <template #header-right>
      <div class="maintenance-tasks-widget__header-actions">
        <q-toggle
          v-if="surface === 'bike'"
          v-model="excludePartParents"
          label="Exclude part works"
          dense
          color="primary"
        />
        <template v-if="surface === 'works'">
          <q-select
            v-model="filterParentType"
            :options="parentTypeFilterOptions"
            dense
            outlined
            emit-value
            map-options
            clearable
            label="Parent type"
            style="min-width: 140px;"
          />
          <q-select
            v-if="filterParentType"
            v-model="filterParentId"
            :options="parentItemOptions"
            dense
            outlined
            emit-value
            map-options
            clearable
            label="Item"
            style="min-width: 180px;"
          />
        </template>
        <q-btn
          v-if="surface !== 'works' || canCreateOnWorks"
          label="Add Work"
          color="primary"
          icon="add"
          :outline="!!displayedMaintenanceTasks.length"
          @click="handleClickAddMaintenanceTask"
        />
      </div>
    </template>
    <template #default>
      <div v-if="!!displayedMaintenanceTasks.length" class="maintenance-tasks-widget__output">
        <MaintenanceTaskCard v-for="maintenanceTask in displayedMaintenanceTasks"
                             :key="maintenanceTask.id"
                             :maintenance-task="maintenanceTask"
                             @delete="handleDeleteMaintenanceTask"
                             @edit="handleClickEditMaintenanceTask"
                             @doMaintenanceTask="handleDoMaintenanceTask" />
      </div>
      <div v-else class="empty-tab m-auto">
        <q-icon name="build"
                size="64px"
                color="grey-5" />
        <p>{{ emptyMessage }}</p>
      </div>
    </template>
  </LayoutWidgetGeneral>

  <!-- Dialogs -->
  <AddMaintenanceTaskDialog v-model="showAddMaintenanceTaskDialog"
                            :basic-maintenance-task="addPrefill"
                            @submit="handleAddMaintenanceTaskSubmit" />
  <EditMaintenanceTaskDialog v-model="showEditMaintenanceTaskDialog"
                             :maintenance-task="currentMaintenanceTask"
                             @submit="handleEditMaintenanceTaskSubmit" />
</template>

<script setup lang="ts">
import {
  computed, onMounted, ref, watch
} from 'vue';
import { storeToRefs } from 'pinia';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import MaintenanceTaskCard from '@/components/cards/MaintenanceTaskCard.vue';
import { useQuasar } from 'quasar';
import { useLayout } from '@/composables/useLayout';
import { useMaintenanceTasksStore } from '@/stores/maintenanceTasksStore';
import { useBikesStore } from '@/stores/bikesStore';
import { usePartsStore } from '@/stores/partsStore';
import { useChainCyclesStore } from '@/stores/chainCyclesStore';
import type {
  Bike,
  BikePart,
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  MaintenanceTask,
  MaintenanceTaskParentType,
  ListMaintenanceTasksParams,
} from '@/types';
import AddMaintenanceTaskDialog from '@/components/dialogs/AddMaintenanceTaskDialog.vue';
import EditMaintenanceTaskDialog from '@/components/dialogs/EditMaintenanceTaskDialog.vue';
import { generateMaintenanceTaskNameForPart } from '@/utils/maintenanceTaskName';
import { getMaintenanceTaskTypeByPartType } from '@/utils/maintenanceTaskTypeByPartType';
import { getErrorMessage } from '@/utils/error';

interface Props {
  bike?: Bike;
  part?: BikePart;
  /** Exact-parent create default; list aggregation uses bike/part/works surfaces. */
  parentType?: MaintenanceTaskParentType;
  title?: string;
  /** When true, load all open work (Works page). */
  allWorks?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  parentType: undefined,
  bike: undefined,
  part: undefined,
  allWorks: false,
});

const maintenanceTasksStore = useMaintenanceTasksStore();
const bikesStore = useBikesStore();
const partsStore = usePartsStore();
const chainCyclesStore = useChainCyclesStore();
const $q = useQuasar();
const { isLoading, maintenanceTasksDirty } = storeToRefs(maintenanceTasksStore);
const {
  showSuccess, showError, withAjaxBar
} = useLayout();

const currentMaintenanceTask = ref<MaintenanceTask | null>(null);
const showAddMaintenanceTaskDialog = ref(false);
const showEditMaintenanceTaskDialog = ref(false);
const excludePartParents = ref(false);
const filterParentType = ref<MaintenanceTaskParentType | null>(null);
const filterParentId = ref<string | null>(null);
/** Prefill override used for OneTime create-another after acknowledge. */
const createAnotherPrefill = ref<Partial<MaintenanceTask> | null>(null);

const surface = computed(() => {
  if (props.allWorks) return 'works' as const;
  if (props.part) return 'part' as const;
  if (props.bike) return 'bike' as const;
  return 'works' as const;
});

const listParams = computed<ListMaintenanceTasksParams>(() => {
  if (surface.value === 'part' && props.part?.id) {
    return { relatedToPartId: props.part.id, isActive: true };
  }
  if (surface.value === 'bike' && props.bike?.id) {
    return {
      bikeId: props.bike.id,
      isActive: true,
      excludePartParents: excludePartParents.value,
    };
  }
  return { isActive: true };
});

const maintenanceTasks = computed(() =>
  maintenanceTasksStore.getMaintenanceTasks(listParams.value));

const displayedMaintenanceTasks = computed(() => {
  let list = maintenanceTasks.value;
  if (surface.value === 'works') {
    if (filterParentType.value) {
      list = list.filter(t => t.parentType === filterParentType.value);
    }
    if (filterParentId.value) {
      list = list.filter(t => t.parentId === filterParentId.value);
    }
  }
  return list;
});

const parentTypeFilterOptions = [
  { label: 'Bike', value: 'Bike' },
  { label: 'Part', value: 'Part' },
  { label: 'Chain cycle', value: 'ChainCycle' },
];

const parentItemOptions = computed(() => {
  const type = filterParentType.value;
  if (!type) return [];
  if (type === 'Bike') {
    return bikesStore.bikes.map(b => ({ label: b.name, value: b.id }));
  }
  if (type === 'Part') {
    return partsStore.parts.map(p => ({ label: p.name, value: p.id }));
  }
  return Object.values(chainCyclesStore.chainCyclesByBikeId)
    .flat()
    .map(c => ({ label: `Cycle on ${bikesStore.getBikeById(c.bikeId)?.name ?? c.bikeId}`, value: c.id }));
});

const canCreateOnWorks = computed(() =>
  !!(filterParentType.value && filterParentId.value));

const emptyMessage = computed(() => {
  if (surface.value === 'part' && props.part?.name) {
    return `No works found for this Part "${props.part.name}"`;
  }
  if (surface.value === 'bike' && props.bike?.name) {
    return `No works found for this Bike "${props.bike.name}"`;
  }
  return 'No works found';
});

const defaultPrefill = computed<Partial<MaintenanceTask>>(() => {
  if (surface.value === 'part' && props.part) {
    return {
      name: generateMaintenanceTaskNameForPart('', {
        partType: props.part.partType ?? undefined,
        parentType: 'Part',
      }),
      type: props.part.partType
        ? getMaintenanceTaskTypeByPartType(props.part.partType)
        : 'Repeating',
      triggerType: 'Distance',
      parentId: props.part.id,
      parentType: 'Part',
    };
  }
  if (surface.value === 'bike' && props.bike) {
    return {
      name: generateMaintenanceTaskNameForPart('', { parentType: 'Bike' }),
      type: 'Repeating',
      triggerType: 'Distance',
      parentId: props.bike.id,
      parentType: 'Bike',
    };
  }
  if (filterParentType.value && filterParentId.value) {
    return {
      name: '',
      type: 'Repeating',
      triggerType: 'Distance',
      parentId: filterParentId.value,
      parentType: filterParentType.value,
    };
  }
  return {
    name: '',
    type: 'Repeating',
    triggerType: 'Distance',
    parentType: props.parentType,
    parentId: props.bike?.id ?? props.part?.id,
  };
});

const addPrefill = computed(() => createAnotherPrefill.value ?? defaultPrefill.value);

async function loadTasks() {
  await maintenanceTasksStore.ensureMaintenanceTasks(listParams.value);
}

onMounted(() => {
  void loadTasks();
});

watch(
  listParams,
  () => {
    void loadTasks();
  },
  { deep: true },
);

watch(() => maintenanceTasksDirty.value,
  (dirty) => {
    if (dirty) void loadTasks();
  },);

watch(filterParentType, () => {
  filterParentId.value = null;
});

const handleClickEditMaintenanceTask = (maintenanceTask: MaintenanceTask) => {
  currentMaintenanceTask.value = maintenanceTask;
  showEditMaintenanceTaskDialog.value = true;
};

const handleDeleteMaintenanceTask = (maintenanceTask: MaintenanceTask) => {
  try {
    $q.dialog({
      title: `Do you want to delete this work "${maintenanceTask.name}"?`,
      message: 'All data will be lost for good.',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      await maintenanceTasksStore.deleteMaintenanceTask(maintenanceTask.id);
      showSuccess(`Work "${maintenanceTask.name}" deleted successfully`);
    });
  } catch (err) {
    showError(getErrorMessage(err, 'Failed to delete the work'));
  }
};

const handleAddMaintenanceTaskSubmit = async (maintenanceTask: CreateMaintenanceTaskDto) => {
  try {
    const createdMaintenanceTask = await withAjaxBar(maintenanceTasksStore.createMaintenanceTask(maintenanceTask));
    showSuccess(`Work ${createdMaintenanceTask?.name} created successfully`);
  } catch (err: unknown) {
    console.error('Failed to create work:', err);
    showError(getErrorMessage(err, 'Failed to create work'));
  } finally {
    showAddMaintenanceTaskDialog.value = false;
    createAnotherPrefill.value = null;
  }
};

const handleClickAddMaintenanceTask = () => {
  createAnotherPrefill.value = null;
  showAddMaintenanceTaskDialog.value = true;
};

function prefillFromCompleted(task: MaintenanceTask): Partial<MaintenanceTask> {
  return {
    name: task.name,
    description: task.description,
    type: task.type,
    triggerType: task.triggerType,
    parentType: task.parentType,
    parentId: task.parentId,
    triggerValue: task.triggerValue,
    startDate: new Date(),
    isActive: true,
  };
}

async function runAcknowledge(maintenanceTask: MaintenanceTask, force: boolean) {
  try {
    const result = await withAjaxBar(maintenanceTasksStore.acknowledgeMaintenanceTask(maintenanceTask.id, { force }),);
    showSuccess(`Work "${maintenanceTask.name}" marked done`);

    if (result.maintenanceTask.type === 'OneTime') {
      $q.dialog({
        title: 'Create another?',
        message: `Create another one-time work for the same parent as "${maintenanceTask.name}"?`,
        cancel: { label: 'No', flat: true },
        ok: { label: 'Yes', color: 'primary' },
        persistent: false,
      }).onOk(() => {
        createAnotherPrefill.value = prefillFromCompleted(result.maintenanceTask);
        showAddMaintenanceTaskDialog.value = true;
      });
    }
  } catch (err: unknown) {
    showError(getErrorMessage(err, 'Failed to acknowledge work'));
  }
}

const handleDoMaintenanceTask = (maintenanceTask: MaintenanceTask) => {
  if (maintenanceTask.needsAttention) {
    void runAcknowledge(maintenanceTask, false);
    return;
  }

  $q.dialog({
    title: 'Mark done early?',
    message: `"${maintenanceTask.name}" is not due yet. Mark it done anyway?`,
    cancel: true,
    persistent: false,
  }).onOk(() => {
    void runAcknowledge(maintenanceTask, true);
  });
};

const handleEditMaintenanceTaskSubmit = async (maintenanceTask: UpdateMaintenanceTaskDto) => {
  try {
    const updatedMaintenanceTask = await withAjaxBar(maintenanceTasksStore.updateMaintenanceTask(currentMaintenanceTask.value?.id ?? '', maintenanceTask),);
    showSuccess(`Work ${updatedMaintenanceTask?.name ?? maintenanceTask.name} updated successfully`);
  } catch (err: unknown) {
    console.error('Failed to update work:', err);
    showError(getErrorMessage(err, 'Failed to update work'));
  } finally {
    showEditMaintenanceTaskDialog.value = false;
  }
};
</script>

<style scoped lang="scss">
.maintenance-tasks-widget {
  &__header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
  }

  &__output {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
    align-self: stretch;
  }
}
</style>
