<template>
  <LayoutWidgetGeneral :is-loading="isLoading" class="maintenance-tasks-widget container">
    <template #header-left>
      <h2 v-if="title">{{ title }}</h2>
    </template>
    <template #header-right>
      <q-btn label="Add Work"
             color="primary"
             icon="add"
             :outline="!!maintenanceTasks.length"
             @click="handleClickAddMaintenanceTask" />
    </template>
    <template #default>
      <div v-if="!!maintenanceTasks.length" class="maintenance-tasks-widget__output">
        <MaintenanceTaskCard v-for="maintenanceTask in maintenanceTasks"
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
                            :basic-maintenance-task="basicMaintenanceTask"
                            @submit="handleAddMaintenanceTaskSubmit" />
  <EditMaintenanceTaskDialog v-model="showEditMaintenanceTaskDialog"
                             :maintenance-task="currentMaintenanceTask"
                             @submit="handleEditMaintenanceTaskSubmit" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import MaintenanceTaskCard from '@/components/cards/MaintenanceTaskCard.vue';
import { useQuasar } from 'quasar';
import { useLayout } from '@/composables/useLayout';
import { useMaintenanceTasksStore } from '@/stores/maintenanceTasksStore';
import type { Bike, BikePart, CreateMaintenanceTaskDto, UpdateMaintenanceTaskDto, MaintenanceTask, MaintenanceTaskParentType } from '@/types';
import AddMaintenanceTaskDialog from '@/components/dialogs/AddMaintenanceTaskDialog.vue';
import EditMaintenanceTaskDialog from '@/components/dialogs/EditMaintenanceTaskDialog.vue';
import { generateMaintenanceTaskNameForPart } from '@/utils/maintenanceTaskName';
import { getMaintenanceTaskTypeByPartType } from '@/utils/maintenanceTaskTypeByPartType';

interface Props {
  bike?: Bike;
  part?: BikePart;
  parentType?: MaintenanceTaskParentType;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  partId: undefined,
  parentType: undefined,
  bike: undefined,
  part: undefined,
});

const maintenanceTasksStore = useMaintenanceTasksStore();
const $q = useQuasar();
const { isLoading } = storeToRefs(maintenanceTasksStore);
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();

const currentMaintenanceTask = ref<MaintenanceTask | null>(null);
const showAddMaintenanceTaskDialog = ref(false);
const showEditMaintenanceTaskDialog = ref(false);

const maintenanceTasks = computed(() => maintenanceTasksStore.getMaintenanceTasksForParent(props.parentType, props.part?.id));
const emptyMessage = computed(() => {
  const base = 'No works found';
  const parentType = props.parentType ? 'for this ' + props.parentType : '';
  const partName = (props.part?.name ? `"${props.part.name}"` : '');
  return [base, parentType, partName].filter(Boolean).join(' ');
});

// TODO: Refactor basic maintenance task generation
const basicMaintenanceTask = computed<Partial<MaintenanceTask>>(() => {
  return {
    name: generateMaintenanceTaskNameForPart('', { partType: props.part?.partType ?? undefined, parentType: props.parentType }),
    type: props.part?.partType ? getMaintenanceTaskTypeByPartType(props.part.partType) : 'Repeating',
    triggerType: 'Distance',
    parentId: props.parentType === 'Bike' ? props.bike?.id : props.part?.id,
    parentType: props.parentType,
  };
});

watch(
  () => props.part?.id,
  async (id) => {
    if (id) await maintenanceTasksStore.ensureMaintenanceTasks(props.parentType, id);
  },
  { immediate: true }
);

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
      console.log('Deleting work:', maintenanceTask.id);
      await maintenanceTasksStore.deleteMaintenanceTask(maintenanceTask.id);
      showSuccess(`Work "${maintenanceTask.name}" deleted successfully`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete the work';
    showError(message);
  }
};

const handleAddMaintenanceTaskSubmit = async (maintenanceTask: CreateMaintenanceTaskDto) => {
  console.log('Adding work:', maintenanceTask);
  
  try {
    const createdMaintenanceTask = await withAjaxBar(maintenanceTasksStore.createMaintenanceTask(maintenanceTask));
    showSuccess(`Work ${createdMaintenanceTask?.name} created successfully`);

  } catch (err: unknown) {
    console.error('Failed to create work:', err);
    showError((err as Error)?.message || 'Failed to create work');
  } finally {
    showAddMaintenanceTaskDialog.value = false;
  }
};

const handleClickAddMaintenanceTask = () => {
  showAddMaintenanceTaskDialog.value = true;
};

const handleDoMaintenanceTask = (maintenanceTask: MaintenanceTask) => {
  console.log('Doing work:', maintenanceTask);
};

const handleEditMaintenanceTaskSubmit = async (maintenanceTask: UpdateMaintenanceTaskDto) => {
  try {
    const updatedMaintenanceTask = await withAjaxBar(maintenanceTasksStore.updateMaintenanceTask(currentMaintenanceTask.value?.id ?? '', maintenanceTask));
    showSuccess(`Work ${updatedMaintenanceTask?.name ?? maintenanceTask.name} updated successfully`);
  } catch (err: unknown) {
    console.error('Failed to update work:', err);
    showError((err as Error)?.message || 'Failed to update work');
  } finally {
    showEditMaintenanceTaskDialog.value = false;
  }
};
</script>

<style scoped lang="scss">
.maintenance-tasks-widget {
  &__output {
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
    align-self: stretch;
  }
}
</style>
