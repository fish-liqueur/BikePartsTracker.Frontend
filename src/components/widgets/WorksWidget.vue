<template>
  <LayoutWidgetGeneral :is-loading="isLoading" class="works-widget container">
    <template #header-left>
      <h2 v-if="title">{{ title }}</h2>
    </template>
    <template #header-right>
      <q-btn label="Add Work"
             color="primary"
             icon="add"
             :outline="!!works.length"
             @click="handleClickAddWork" />
    </template>
    <template #default>
      <div v-if="!!works.length" class="works-widget__output">
        <WorkCard v-for="work in works"
                  :key="work.id"
                  :work="work"
                  @delete="handleDeleteWork"
                  @edit="handleClickEditWork"
                  @doWork="handleDoWork" />
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
  <AddWorkDialog v-model="showAddWorkDialog"
                 :basic-work="basicWork"
                 @submit="handleAddWorkSubmit" />
  <EditWorkDialog v-model="showEditWorkDialog"
                  :work="currentWork"
                  @submit="handleEditWorkSubmit" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import WorkCard from '@/components/cards/WorkCard.vue';
import { useQuasar } from 'quasar';
import { useLayout } from '@/composables/useLayout';
import { useWorksStore } from '@/stores/worksStore';
import type { Bike, BikePart, CreateWorkDto, UpdateWorkDto, Work, WorkParentType } from '@/types';
import AddWorkDialog from '@/components/dialogs/AddWorkDialog.vue';
import EditWorkDialog from '@/components/dialogs/EditWorkDialog.vue';
import { generateWorkNameForPart } from '@/utils/workName';
import { getWorkTypeByPartType } from '@/utils/workTypeByPartType';

interface Props {
  bike?: Bike;
  part?: BikePart;
  parentType?: WorkParentType;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  partId: undefined,
  parentType: undefined,
  bike: undefined,
  part: undefined,
});

const worksStore = useWorksStore();
const $q = useQuasar();
const { isLoading } = storeToRefs(worksStore);
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();

const currentWork = ref<Work | null>(null);
const showAddWorkDialog = ref(false);
const showEditWorkDialog = ref(false);

const works = computed(() => worksStore.getWorksForParent(props.parentType, props.part?.id));
const emptyMessage = computed(() => {
  const base = 'No works found';
  const parentType = props.parentType ? 'for this ' + props.parentType : '';
  const partName = (props.part?.name ? `"${props.part.name}"` : '');
  return [base, parentType, partName].filter(Boolean).join(' ');
});

// TODO: Refactor basic work generation
const basicWork = computed<Partial<Work>>(() => {
  return {
    name: generateWorkNameForPart('', { partType: props.part?.partType ?? undefined, parentType: props.parentType }),
    type: props.part?.partType ? getWorkTypeByPartType(props.part.partType) : 'Repeating',
    triggerType: 'Distance',
    parentId: props.parentType === 'Bike' ? props.bike?.id : props.part?.id,
    parentType: props.parentType,
  };
});

watch(
  () => props.part?.id,
  async (id) => {
    if (id) await worksStore.ensureWorks(props.parentType, id);
  },
  { immediate: true }
);

const handleClickEditWork = (work: Work) => {
  currentWork.value = work;
  showEditWorkDialog.value = true;
};

const handleDeleteWork = (work: Work) => {
  try {
    $q.dialog({
      title: `Do you want to delete this work "${work.name}"?`,
      message: 'All data will be lost for good.',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      console.log('Deleting work:', work.id);
      await worksStore.deleteWork(work.id);
      showSuccess(`Work "${work.name}" deleted successfully`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete the work';
    showError(message);
  }
};

const handleAddWorkSubmit = async (work: CreateWorkDto) => {
  console.log('Adding work:', work);
  
  try {
    const createdWork = await withAjaxBar(worksStore.createWork(work));
    showSuccess(`Work ${createdWork?.name} created successfully`);

  } catch (err: unknown) {
    console.error('Failed to create work:', err);
    showError((err as Error)?.message || 'Failed to create work');
  } finally {
    showAddWorkDialog.value = false;
  }
};

const handleClickAddWork = () => {
  showAddWorkDialog.value = true;
};

const handleDoWork = (work: Work) => {
  console.log('Doing work:', work);
};

const handleEditWorkSubmit = async (work: UpdateWorkDto) => {
  try {
    const updatedWork = await withAjaxBar(worksStore.updateWork(currentWork.value?.id ?? '', work));
    showSuccess(`Work ${updatedWork?.name ?? work.name} updated successfully`);
  } catch (err: unknown) {
    console.error('Failed to update ride:', err);
    showError((err as Error)?.message || 'Failed to update ride');
  } finally {
    showEditWorkDialog.value = false;
  }
};
</script>

<style scoped lang="scss">
.works-widget {
  &__output {
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
    align-self: stretch;
  }
}
</style>
