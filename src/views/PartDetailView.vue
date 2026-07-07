<template>
  <LayoutViewGeneral
    :is-loading="isLoading"
  >
    <template v-if="part" #header>
      <h1 class="part-name">{{ part.name }}</h1>
      <q-chip :label="part.partType"
              color="primary"
              text-color="white"
              size="md" />
      <q-select
        v-if="parts.length"
        :model-value="selectedPartId"
        :options="parts"
        dense
        outlined
        map-options
        option-label="name"
        option-value="id"
        emit-value
        @update:model-value="handlePartChange"
        style="min-width: 200px;"
      />
    </template>
    <template #default>
      <template v-if="part">
        <!-- Tabs -->
        <q-tabs
          v-model="activeTab"
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab name="rides"
                 label="Rides"
                 icon="directions_bike" />
          <q-tab name="history"
                 label="Usage archive"
                 icon="directions_bike" />
          <q-tab name="works"
                 label="Works"
                 icon="build" />
          <q-tab name="settings"
                 label="Settings"
                 icon="settings" />
        </q-tabs>

        <q-separator />

        <!-- Tab Panels -->
        <q-tab-panels v-model="activeTab"
                      animated
                      class="tab-panels">

          <!-- Rides Tab -->
          <q-tab-panel name="rides">
            <div class="flex flex-column flex-align-center gap-3">
              <div class="text-xl">Here we can see the rides since the last installation of this part ({{ formatDate(part.installationDate) }}).</div>
              <div class="text-l">If the data looks incomplete, just re-sync the rides from your Strava account for the desired period.</div>
              <RidesWidget v-if="bikeWherePartIsInstalled"
                           title="Rides"
                           :bike-context="bikeWherePartIsInstalled"
                           :date-from="dateFrom" />
              <div v-else class="empty-tab">
                <q-icon name="directions_bike"
                        size="64px"
                        color="grey-5" />
                <p>The part is not installed on any bike</p>
              </div>
            </div>
          </q-tab-panel>

          <!-- History Tab -->
          <q-tab-panel name="history">
            <PartHistoryWidget v-if="part"
                               :part-id="part.id"
                               :title="`Usage archive log for ${part.name} (${part.partType})`" />
          </q-tab-panel>

          <!-- Works Tab -->
          <q-tab-panel name="works">
            <WorksWidget v-if="part"
                         :part="part"
                         :parent-type="workParentType"
                         :title="`Works for ${part.name} (${part.partType})`" />
          </q-tab-panel>

          <!-- Settings Tab -->
          <q-tab-panel name="settings">
            <div class="settings-panel">
              <PartForm
                ref="partFormRef"
                :initial-data="initialFormData"
                @update:isValid="(val: boolean) => isValid = val"
                @submit="handleSave"
              />
              <div class="display-flex flex-align-center gap-4 p-2 mt-2">
                <span class="text-body2">Active: {{ part.isActive ? 'Yes' : 'No' }}</span>
                <q-btn
                  :label="part.isActive ? 'Retire Part' : 'Activate Part'"
                  color="orange"
                  icon="archive"
                  outline
                  @click="handleRetire"
                  :loading="isRetiring"
                />
              </div>
              <div class="form-actions q-mt-xl">
                <q-btn
                  label="Delete Part"
                  color="negative"
                  icon="delete"
                  outline
                  @click="handleDelete"
                  :loading="isDeleting"
                />
                <q-btn
                  label="Save settings"
                  color="primary"
                  icon="save"
                  @click="handleClickSave"
                  :loading="isSaving"
                />
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </template>

      <div v-else class="error-container">
        <q-icon name="error_outline"
                size="48px"
                color="negative" />
        <p>Part not found</p>
        <q-btn label="Go Back"
               color="primary"
               @click="router.push('/parts')" />
      </div>
    </template>
  </LayoutViewGeneral>
</template>

<script setup lang="ts">
import { useLayout } from '@/composables/useLayout';
import { useQuerySync } from '@/composables/useQuerySync';
import { usePartsStore } from '@/stores/partsStore';
import { useBikesStore } from '@/stores/bikesStore';
import {
  PartScheduleType, PartType, type WorkParentType, type CreatePartDto, type PartFormExposed, type UpdatePartDto 
} from '@/types';
import { useQuasar } from 'quasar';
import {
  computed, ref, watch, type ComponentPublicInstance 
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PartForm from '@/components/forms/PartForm.vue';
import LayoutViewGeneral from '@/components/layouts/LayoutViewGeneral.vue';
import { getErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/date';
import RidesWidget from '@/components/widgets/RidesWidget.vue';
import PartHistoryWidget from '@/components/widgets/PartHistoryWidget.vue';
import WorksWidget from '@/components/widgets/WorksWidget.vue';

const route = useRoute();
const router = useRouter();
const partsStore = usePartsStore();
const bikesStore = useBikesStore();
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();
const $q = useQuasar();
const partId = computed(() => route.params.id as string);
const part = computed(() => partsStore.getPartById(partId.value));
const isLoading = computed(() => partsStore.isLoading);
const initialFormData = computed(() => {
  if (!part.value) {
    return undefined;
  }

  const data: Partial<CreatePartDto> = {
    name: part.value?.name || '',
    description: part.value?.description || '',
    partType: part.value?.partType || PartType.Other,
    brand: part.value?.brand || '',
    model: part.value?.model || '',
    bikeId: part.value?.bikeId || '',
    mileageAtInstallation: part.value?.mileageAtInstallation || 0,
    installationDate: part.value?.installationDate || new Date(),
    isActive: part.value?.isActive || true,
  };

  return data;
});

const partFormRef = ref<ComponentPublicInstance & PartFormExposed | null>(null);
const workParentType = ref<WorkParentType>('Part');

// Form data
const formData = ref<UpdatePartDto>({
  name: '',
  description: '',
  partType: PartType.Other,
  brand: '',
  model: '',
  bikeId: '',
  mileageAtInstallation: 0,
  installationDate: new Date(),
  isActive: true,
  scheduleType: PartScheduleType.OneTimeUse,
  scheduleValue: 0
});

// Action states
const isSaving = ref(false);
const isDeleting = ref(false);
const isRetiring = ref(false);
const isValid = ref(false);

// Tab management with query parameter sync
const { state: queryState, setParam: setQueryParam } = useQuerySync({
  tab: {
    key: 'tab',
    defaultValue: 'settings' as 'rides' | 'history' | 'works' | 'settings',
    parse: (raw) => {
      const validTabs = ['rides', 'history', 'works', 'settings'];
      return validTabs.includes(raw as string) ? (raw as 'rides' | 'history' | 'works' | 'settings') : 'settings';
    },
    serialize: (value) => value,
  },
});
const activeTab = computed({
  get: () => queryState.tab.value,
  set: (value) => {
    void setQueryParam(
      'tab', value, { replace: true }
    );
  }
});
const parts = computed(() => partsStore.parts);
const selectedPartId = computed(() => partId.value);

const bikeWherePartIsInstalled = computed(() => {
  if (!part.value?.bikeId) return null;
  return bikesStore.getBikeById(part.value.bikeId);
});
const dateFrom = computed(() => {
  if (!part.value?.installationDate) return null;
  return new Date(part.value.installationDate);
});

watch(
  partId,
  async (id) => {
    if (id) await partsStore.ensurePart(id);
  },
  { immediate: true }
);

watch(
  part, (newPart) => {
    if (newPart) {
      formData.value = {
        name: newPart.name || '',
        description: newPart.description || '',
        partType: newPart.partType || PartType.Other,
        brand: newPart.brand || '',
        model: newPart.model || '',
        bikeId: newPart.bikeId || '',
        mileageAtInstallation: newPart.mileageAtInstallation || 0,
        installationDate: newPart.installationDate || new Date(),
        isActive: newPart.isActive || true,
        // scheduleType: newPart.scheduleType || PartScheduleType.OneTimeUse,
      };
    }
  }, { immediate: true }
);


// Handlers
const handleDelete = async () => {
  if (!part.value) return;
  
  try {
    $q.dialog({
      title: `Do you want to delete this ${part.value.partType}?`,
      message: 'This action cannot be undone. All data will be lost for good.',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      try {
        isDeleting.value = true;  
        await withAjaxBar(partsStore.deletePart(partId.value));
        showSuccess(`Part ${part.value?.name} deleted successfully`);
      } catch (err: unknown) {
        console.error('Failed to delete part:', err);
        showError(getErrorMessage(err, `Failed to delete part ${part.value?.name}`));
      } finally {
        isDeleting.value = false;
      }
    });
  } catch (err: unknown) {
    console.error('Failed to show delete dialog:', err);
    showError(getErrorMessage(err, 'Failed to show confirmation dialog'));
  }
};

const handlePartChange = (newPartId: string) => {
  if (newPartId && newPartId !== partId.value) {
    // Navigate to the new part's detail page, preserving the current tab
    const currentTab = queryState.tab.value;
    router.push({
      path: `/parts/${newPartId}`,
      query: currentTab !== 'settings' ? { tab: currentTab } : {}
    });
  }
};

const handleRetire = async () => {  
  if (!part.value) return;
  const { isActive } = part.value;
  const dialogTitle = isActive ? 'Do you want to retire this part?' : 'Do you want to activate this part?';
  const dialogMessage = isActive ? 'This action CAN be undone. And you may still use it as a template for new parts.' : '';
  const dialogSuccessMessage = isActive ? 'Part retired successfully' : 'Part activated successfully';
  const dialogErrorMessage = isActive ? 'Failed to activate part' : 'Failed to retire part';
  
  try {
    $q.dialog({
      title: dialogTitle,
      message: dialogMessage,
      cancel: true,
      persistent: false
    }).onOk(async () => {
      try {
        isRetiring.value = true;
        await withAjaxBar(partsStore.updatePart(partId.value, { isActive: !part.value?.isActive } as UpdatePartDto));
        showSuccess(dialogSuccessMessage);
      } catch (err: unknown) {
        showError(getErrorMessage(err, dialogErrorMessage));
      } finally {
        isRetiring.value = false;
      }
    });
  } catch (err: unknown) {
    console.error('Failed to show retire dialog:', err);
    showError(getErrorMessage(err, 'Failed to show confirmation dialog'));
  }
};

const handleClickSave = () => {
  partFormRef.value?.handleSubmit();
};

const handleSave = async () => {
  if (!part.value) return;
  
  try {
    isSaving.value = true;
    await withAjaxBar(partsStore.updatePart(part.value.id, formData.value));
    showSuccess('Part updated successfully');
  } catch (err: unknown) {
    console.error('Failed to update part:', err);
    showError(getErrorMessage(err, 'Failed to update part'));
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="css">
.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
}

.bike-name {
  margin: 0;
  font-size: 2rem;
  line-height: normal;
  font-weight: 600;
  color: #1a202c;
}
</style>

