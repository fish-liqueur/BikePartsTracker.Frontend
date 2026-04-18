<template>
  <div class="view-container">
    <div v-if="isLoading" class="loading-container">
      <q-spinner color="primary" size="3em" />
    </div>
    
    <div v-else-if="part" class="bike-detail-container">
      <!-- Bike Header -->
      <div class="part-header">
        <h1 class="part-name">{{ part.name }}</h1>
        <q-chip :label="part.partType"
                color="primary"
                text-color="white"
                size="md" />
        <q-select
          v-if="parts.length"
          :model-value="selectedBikeId"
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
      </div>

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
          <div class="empty-tab">
            <q-icon name="directions_bike"
                    size="64px"
                    color="grey-5" />
            <p>Rides coming soon</p>
          </div>
        </q-tab-panel>

        <!-- Works Tab -->
        <q-tab-panel name="works">
          <div class="empty-tab">
            <q-icon name="build"
                    size="64px"
                    color="grey-5" />
            <p>Works coming soon</p>
          </div>
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
    </div>

    <div v-else class="error-container">
      <q-icon name="error_outline"
              size="48px"
              color="negative" />
      <p>Part not found</p>
      <q-btn label="Go Back"
             color="primary"
             @click="router.push('/parts')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLayout } from '@/composables/useLayout';
import { useQuerySync } from '@/composables/useQuerySync';
import { usePartsStore } from '@/stores/partsStore';
import { PartScheduleType, PartType, type BikeType, type CreatePartDto, type PartFormExposed, type UpdatePartDto } from '@/types';
import { useQuasar } from 'quasar';
import { computed, ref, watch, type ComponentPublicInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { bikeTypeOptions } from '@/components/shared/bikeTypeOptions';
import { partTypeOptions } from '@/components/shared/partTypeOptions';
import PartForm from '@/components/parts/PartForm.vue';

const route = useRoute();
const router = useRouter();
const partsStore = usePartsStore();
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

// Action states
const isSaving = ref(false);
const isDeleting = ref(false);
const isRetiring = ref(false);
const isValid = ref(false);

// Tab management with query parameter sync
const { state: queryState, setParam: setQueryParam } = useQuerySync({
  tab: {
    key: 'tab',
    defaultValue: 'settings' as 'rides' | 'works' | 'settings',
    parse: (raw) => {
      const validTabs = ['rides', 'works', 'settings'];
      return validTabs.includes(raw as string) ? (raw as 'rides' | 'works' | 'settings') : 'settings';
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
const selectedBikeId = computed(() => partId.value);

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
      } catch (err: any) {
        console.error('Failed to delete part:', err);
        showError(err.message || `Failed to delete part ${part.value?.name}`);
      } finally {
        isDeleting.value = false;
      }
    });
    } catch (err: any) {
    console.error('Failed to show delete dialog:', err);
    showError('Failed to show confirmation dialog');
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
      } catch (err: any) {
        showError(err.message || dialogErrorMessage);
      } finally {
        isRetiring.value = false;
      }
    });
  } catch (err: any) {
    console.error('Failed to show retire dialog:', err);
    showError('Failed to show confirmation dialog');
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
  } catch (err: any) {
    console.error('Failed to update part:', err);
    showError(err.message || 'Failed to update part');
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

