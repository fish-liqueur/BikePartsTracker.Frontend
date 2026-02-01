<template>
  <div class="view-container">
    <div v-if="isLoading" class="loading-container">
      <q-spinner color="primary" size="3em" />
    </div>
    
    <div v-else-if="bike" class="bike-detail-container">
      <!-- Bike Header -->
      <div class="bike-header">
        <h1 class="bike-name">{{ bike.name }}</h1>
        <q-chip :label="bike.type" color="primary" text-color="white" size="md" />
        <q-select
                  v-if="bikes.length"
                  :model-value="selectedBikeId"
                  :options="bikes"
                  dense
                  outlined
                  map-options
                  option-label="name"
                  option-value="id"
                  emit-value
                  @update:model-value="handleBikeChange"
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
        <q-tab name="parts" label="Parts" icon="hardware" />
        <q-tab name="rides" label="Rides" icon="directions_bike" />
        <q-tab name="works" label="Works" icon="build" />
        <q-tab name="settings" label="Settings" icon="settings" />
      </q-tabs>

      <q-separator />

      <!-- Tab Panels -->
      <q-tab-panels v-model="activeTab" animated class="tab-panels">
        <!-- Parts Tab -->
        <q-tab-panel name="parts">
          <div class="display-flex flex-column gap-5">
            <ChainCycleWidget v-if="bike && bike.chainsInCycle?.length" 
              :bike-context="bike" />
            <PartsWidget
              :bike-context="bike"
              title="Parts"
            />
          </div>
        </q-tab-panel>

        <!-- Rides Tab -->
        <q-tab-panel name="rides">
          <div class="empty-tab">
            <q-icon name="directions_bike" size="64px" color="grey-5" />
            <p>Rides coming soon</p>
          </div>
        </q-tab-panel>

        <!-- Works Tab -->
        <q-tab-panel name="works">
          <div class="empty-tab">
            <q-icon name="build" size="64px" color="grey-5" />
            <p>Works coming soon</p>
          </div>
        </q-tab-panel>

        <!-- Settings Tab -->
        <q-tab-panel name="settings">
          <div class="settings-panel">
            <q-form @submit.prevent="handleSave" class="settings-form">
              <div class="form-fields">
                <q-input
                  v-model="formData.name"
                  label="Bike Name"
                  outlined
                  dense
                  :rules="[(val: string) => !!val || 'Bike name is required']"
                />
                
                <q-select
                  v-model="formData.type"
                  :options="bikeTypeOptions"
                  label="Bike Type"
                  emit-value
                  map-options
                  outlined
                  dense
                  :rules="[(val: BikeType | null) => !!val || 'Bike type is required']"
                />
              </div>

              <div class="form-actions">
                <q-btn
                  type="submit"
                  label="Save"
                  color="primary"
                  icon="save"
                  :loading="isSaving"
                />
                <q-btn
                  label="Retire Bike"
                  color="orange"
                  icon="archive"
                  outline
                  @click="handleRetire"
                  :loading="isRetiring"
                />
                <q-btn
                  label="Delete Bike"
                  color="negative"
                  icon="delete"
                  outline
                  @click="handleDelete"
                  :loading="isDeleting"
                />
              </div>
            </q-form>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <div v-else class="error-container">
      <q-icon name="error_outline" size="48px" color="negative" />
      <p>Bike not found</p>
      <q-btn label="Go Back" color="primary" @click="router.push('/bikes')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useBikesStore } from '@/stores/bikesStore';
import { usePartsStore } from '@/stores/partsStore';
import { useLayout } from '@/composables/useLayout';
import { useQuerySync } from '@/composables/useQuerySync';
import PartsWidget from '@/components/parts/PartsWidget.vue';
import ChainCycleWidget from '@/components/parts/ChainCycleWidget.vue';
import type { UpdateBikeDto } from '@/types';
import { BikeType } from '@/types';

const route = useRoute();
const router = useRouter();
const bikesStore = useBikesStore();
const partsStore = usePartsStore();
const { showSuccess, showError, withAjaxBar } = useLayout();
const $q = useQuasar();
const bikeId = computed(() => route.params.id as string);
const bike = computed(() => bikesStore.getBikeById(bikeId.value));
const isLoading = computed(() => bikesStore.isLoading);

// Tab management with query parameter sync
const { state: queryState, setParam: setQueryParam } = useQuerySync({
  tab: {
    key: 'tab',
    defaultValue: 'parts' as 'parts' | 'rides' | 'works' | 'settings',
    parse: (raw) => {
      const validTabs = ['parts', 'rides', 'works', 'settings'];
      return validTabs.includes(raw as string) ? (raw as 'parts' | 'rides' | 'works' | 'settings') : 'parts';
    },
    serialize: (value) => value,
  },
});

const activeTab = computed({
  get: () => queryState.tab.value,
  set: (value) => {
    void setQueryParam('tab', value, { replace: true });
  }
});

// Form data
const formData = ref<UpdateBikeDto>({
  name: '',
  type: BikeType.Other
});

const bikeTypeOptions = [
  { label: 'Road', value: BikeType.Road },
  { label: 'Mountain', value: BikeType.Mountain },
  { label: 'Gravel', value: BikeType.Gravel },
  { label: 'E-Bike', value: BikeType.EBike },
  { label: 'City', value: BikeType.City },
  { label: 'Touring', value: BikeType.Touring },
  { label: 'Cargo', value: BikeType.Cargo },
  { label: 'Fixed', value: BikeType.Fixed },
  { label: 'Rat', value: BikeType.Rat },
  { label: 'Other', value: BikeType.Other },
];

// Initialize form data when bike loads
watch(bike, (newBike) => {
  if (newBike) {
    formData.value = {
      name: newBike.name || '',
      type: newBike.type || BikeType.Other
    };
  }
}, { immediate: true });

// Set parts context bike in store when bike changes
// watch(bike, (newBike) => {
//   partsStore.setPartsContextBike(newBike ?? null);
// }, { immediate: true });

// Clear parts context bike when component unmounts
// onUnmounted(() => {
//   partsStore.setPartsContextBike(null);
// });

// Fetch parts when parts tab is accessed, but only if store is empty
watch(activeTab, async (newTab) => {
  if (newTab === 'parts' && partsStore.parts.length === 0) {
    try {
      await withAjaxBar(partsStore.fetchParts());
    } catch (error) {
      console.error('Failed to fetch parts:', error);
      showError('Failed to load parts');
    }
  }
}, { immediate: true });

// Action states
const isSaving = ref(false);
const isRetiring = ref(false);
const isDeleting = ref(false);



onMounted(async () => {
  if (!bike.value && bikeId.value) {
    try {
      await withAjaxBar(bikesStore.fetchBike(bikeId.value));
      await bikesStore.fetchBikes();
    } catch (error) {
      console.error('Failed to fetch bike:', error);
      showError('Failed to load bike details');
    }
  }
});

const bikes = computed(() => bikesStore.bikes);

// Selected bike ID for the selector
const selectedBikeId = computed(() => bikeId.value);

// Handle bike change from selector
const handleBikeChange = (newBikeId: string) => {
  if (newBikeId && newBikeId !== bikeId.value) {
    // Navigate to the new bike's detail page, preserving the current tab
    const currentTab = queryState.tab.value;
    router.push({
      path: `/bikes/${newBikeId}`,
      query: currentTab !== 'parts' ? { tab: currentTab } : {}
    });
  }
};

// Handlers
const handleSave = async () => {
  if (!bike.value) return;
  
  try {
    isSaving.value = true;
    await withAjaxBar(
      bikesStore.updateBike(bike.value.id, formData.value)
    );
    showSuccess('Bike updated successfully');
  } catch (err: any) {
    console.error('Failed to update bike:', err);
    showError(err.message || 'Failed to update bike');
  } finally {
    isSaving.value = false;
  }
};

const handleRetire = async () => {  
  if (!bike.value) return;
  
  const bikeId = bike.value.id;
  
  try {
    $q.dialog({
      title: 'Do you want to retire this bike?',
      message: 'This action CAN be undone. Think of it like about putting the bike to the farthest part of your garage, with no intention to ride it anymore.',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      try {
        isRetiring.value = true;
        await withAjaxBar(
          bikesStore.retireBike(bikeId)
        );
        showSuccess('Bike retired successfully');
      } catch (err: any) {
        console.error('Failed to retire bike:', err);
        showError(err.message || 'Failed to retire bike');
      } finally {
        isRetiring.value = false;
      }
    });
  } catch (err: any) {
    console.error('Failed to show retire dialog:', err);
    showError('Failed to show confirmation dialog');
  }
};

const handleDelete = async () => {
  if (!bike.value) return;

  const bikeId = bike.value.id;
  
  try {

    $q.dialog({
        title: 'Do you want to delete this bike?',
        message: 'This action cannot be undone. All data will be lost for good.',
        cancel: true,
        persistent: false
      }).onOk(async () => {
        try {
          isDeleting.value = true;  
        await withAjaxBar(
            bikesStore.deleteBike(bikeId)
          );
          showSuccess('Bike deleted successfully');
        } catch (err: any) {
          console.error('Failed to delete bike:', err);
          showError(err.message || 'Failed to delete bike');
        } finally {
          isDeleting.value = false;
        }
      })
  } catch (err: any) {
    console.error('Failed to show delete dialog:', err);
    showError('Failed to show confirmation dialog');
  }
};

const createChainCycle = async () => {
    try {
        await withAjaxBar(
            bikesStore.updateBike(bikeId.value, { chainsInCycle: [null, null, null] })
        );
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create chain cycle';
        showError(errorMessage);
    }

}
</script>

<style scoped lang="css">
.view-container {
  min-height: 100%;
  background-color: #f8fafc;
  padding: 32px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.bike-detail-container {
display: flex;
flex-direction: column;
height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bike-header {
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

.bike-details {
  padding: 16px 32px;
  border-bottom: 1px solid #e2e8f0;
}


.tab-panels {
  min-height: 400px;
}

.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
  color: #718096;
}

.empty-tab p {
  margin: 16px 0 0 0;
  font-size: 1rem;
}

.settings-panel {
  padding: 32px;
}

.settings-form {
  max-width: 600px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-start;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.error-container p {
  margin: 16px 0;
  font-size: 1.125rem;
  color: #718096;
}

::deep(.q-tabs__arrow) {
    display: none;
}

@media (max-width: 768px) {
  .view-container {
    padding: 20px;
  }

  .bike-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .bike-details {
    padding: 12px 20px;
  }

  .settings-panel {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .q-btn {
    width: 100%;
  }
}
</style>

