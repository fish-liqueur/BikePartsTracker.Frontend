<template>
  <q-dialog 
    v-model="localShow" 
    @update:model-value="handleDialogUpdate"
    maximized
  >
    <q-card class="import-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Import Bikes from Strava</div>
        <q-space />
        <q-btn icon="close"
               flat
               round
               dense
               v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Loading State -->
        <div v-if="isFetchingAthlete"
             class="flex flex-center"
             style="min-height: 200px">
          <q-spinner color="primary" size="3em" />
          <div class="q-ml-md">Fetching bikes from Strava...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="fetchError" class="error-state">
          <q-icon name="error_outline"
                  size="48px"
                  color="negative" />
          <div class="text-h6 q-mt-md">Failed to fetch Strava data</div>
          <div class="text-body2 q-mt-sm">{{ fetchError }}</div>
          <q-btn 
            label="Retry" 
            color="primary" 
            @click="fetchAthleteData"
            class="q-mt-md"
          />
        </div>

        <!-- No Bikes State -->
        <div v-else-if="importBikes.length === 0"
             class="flex flex-center"
             style="min-height: 200px">
          <div class="text-center">
            <q-icon name="directions_bike"
                    size="64px"
                    color="grey-5" />
            <div class="text-h6 q-mt-md">No bikes found in Strava</div>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else>
          <!-- Header Actions -->
          <div class="row q-mb-md">
            <div class="col">
              <div class="text-body1">
                <strong>{{ selectedCount }}</strong> of <strong>{{ importBikes.length }}</strong> bikes selected
                <span v-if="selectedCount > 0">
                  ({{ newCount }} new, {{ mergedCount }} merged)
                </span>
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                dense
                label="Select All"
                @click="selectAll"
                class="q-mr-sm"
              />
              <q-btn
                flat
                dense
                label="Deselect All"
                @click="deselectAll"
              />
            </div>
          </div>

          <!-- Bikes Table -->
          <q-table
            :rows="importBikes"
            :columns="tableColumns"
            row-key="stravaBike.id"
            :loading="isSyncing"
            :table-row-style-fn="rowStyleFn"
            flat
            class="bikes-import-table"
          >
            <!-- Selection Checkbox -->
            <template v-slot:body-cell-selected="props">
              <q-td :props="props">
                <q-checkbox
                  v-model="props.row.selected"
                  @update:model-value="updateSelection"
                />
              </q-td>
            </template>

            <!-- Name (editable) -->
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <div v-if="props.row.mergeWith 
                       && props.row.matchedExisting 
                       && props.row.matchedExisting.name !== props.row.editedName" 
                     class="text-body2 saved-name">
                  Strava name: <span class="text-primary" @click="props.row.matchedExisting.name = props.row.editedName">
                    <q-tooltip>
                      Click to use Strava name
                    </q-tooltip>
                    {{ props.row.editedName }}
                  </span>
                </div>
                <div v-if="props.row.matchedExisting 
                       && props.row.matchedExisting!.name !== props.row.matchedExisting.storedName" 
                     class="text-body2 saved-name">
                  Existing name: <span class="text-primary" @click="props.row.matchedExisting.name = props.row.matchedExisting.storedName">
                    <q-tooltip>
                      Click to use existing bike name
                    </q-tooltip>
                    {{ props.row.matchedExisting.storedName }}
                  </span>
                </div>
                <q-input
                  v-if="props.row.mergeWith"
                  v-model="props.row.matchedExisting!.name"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[(val: string) => !!val || 'Name is required']"
                  :bg-color="props.row.selected ? 'white' : 'transparent'"
                />
                <template v-else>
                 
                  <q-input
                    v-model="props.row.editedName"
                    dense
                    outlined
                    hide-bottom-space
                    :rules="[(val: string) => !!val || 'Name is required']"
                    :bg-color="props.row.selected ? 'white' : 'transparent'"
                  />
                </template>
            
              </q-td>
            </template>

            <!-- Type (editable dropdown for new bikes) -->
            <template v-slot:body-cell-type="props">
              <q-td :props="props">
                <q-select
                  v-if="!props.row.mergeWith"
                  v-model="props.row.editedType"
                  :options="bikeTypeOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  :clearable="props.row.editedType !== null"
                  placeholder="Select type"
                  :bg-color="props.row.selected ? 'white' : 'transparent'"
                />
                <div v-else class="text-body2">
                  {{ (props.row.matchedExisting as any)?.type || (existingBikes.find((b: Bike) => b.id === props.row.mergeWith) as any)?.type || 'N/A' }}
                </div>
              </q-td>
            </template>

            <!-- Distance -->
            <template v-slot:body-cell-distance="props">
              <q-td :props="props">
                <div class="text-body2">
                  {{ formatDistance(props.row.stravaBike.distance || 0) }}
                </div>
              </q-td>
            </template>

            <!-- Action (Merge dropdown) -->
            <template v-slot:body-cell-action="props">
              <q-td :props="props">
                <q-select
                  v-model="props.row.mergeWith"
                  :options="mergeOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="handleMergeChange(props.row)"
                  label="Action"
                  :bg-color="props.row.selected ? 'white' : 'transparent'"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                        <q-item-label v-if="scope.opt.storedName" caption>
                          {{ scope.opt.storedName }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </q-td>
            </template>

            <!-- Status -->
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.mergeWith ? 'secondary' : 'primary'"
                  :label="props.row.mergeWith ? 'Merge' : 'New'"
                />
              </q-td>
            </template>
          </q-table>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat
               label="Cancel"
               color="negative"
               @click="handleCancel" />
        <q-btn
          label="Import Selected"
          color="primary"
          @click="handleSave"
          :disable="selectedCount === 0 || isSyncing"
          :loading="isSyncing"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  ref, computed, watch 
} from 'vue';
import { stravaService } from '@/services/stravaService';
import { bikeService } from '@/services/bikeService';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import type {
  StravaBike, Bike, SyncBikeDto 
} from '@/types';
import { BikeType } from '@/types';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

interface ImportBikeState {
  stravaBike: StravaBike;
  selected: boolean;
  mergeWith: string | null;
  editedName: string;
  storedName: string | null;
  editedType: BikeType | null;
  matchedExisting: Bike | null;
}

type BikeWithStoredName = Bike & { storedName: string };

const localShow = ref(props.modelValue);
const isFetchingAthlete = ref(false);
const isSyncing = ref(false);
const fetchError = ref<string | null>(null);
const importBikes = ref<ImportBikeState[]>([]);
const existingBikes = ref<BikeWithStoredName[]>([]);

const bikesStore = useBikesStore();
const {
  showSuccess, showError, withAjaxBar 
} = useLayout();

// Bike type options for dropdown
const bikeTypeOptions = [
  { label: 'None', value: null },
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

// Table columns
const tableColumns = [
  {
    name: 'selected',
    label: '',
    field: 'selected',
    align: 'center' as const,
    style: 'width: 50px',
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left' as const,
  },
  {
    name: 'type',
    label: 'Type',
    field: 'type',
    align: 'left' as const,
  },
  {
    name: 'distance',
    label: 'Distance (m)',
    field: 'distance',
    align: 'right' as const,
  },
  {
    name: 'action',
    label: 'Action',
    field: 'action',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'center' as const,
  },
];

// Computed properties
const selectedCount = computed(() => {
  return importBikes.value.filter(b => b.selected).length;
});

const newCount = computed(() => {
  return importBikes.value.filter(b => b.selected && !b.mergeWith).length;
});

const mergedCount = computed(() => {
  return importBikes.value.filter(b => b.selected && b.mergeWith).length;
});

const mergeOptions = computed(() => {
  const options: Array<{ label: string; value: string | null; bike?: Bike }> = [
    { label: 'Create new bike', value: null },
  ];

  existingBikes.value.forEach(bike => {
    options.push({
      label: `Merge with: ${bike.storedName}`,
      value: bike.id,
    });
  });

  return options;
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  localShow.value = newValue;
  if (newValue) {
    fetchAthleteData();
  }
});

// Watch for internal changes to localShow
watch(localShow, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleDialogUpdate = (value: boolean) => {
  localShow.value = value;
  if (!value) {
    resetState();
  }
};

const resetState = () => {
  importBikes.value = [];
  existingBikes.value = [];
  fetchError.value = null;
  isFetchingAthlete.value = false;
  isSyncing.value = false;
};

const fetchAthleteData = async () => {
  isFetchingAthlete.value = true;
  fetchError.value = null;

  try {
    // Check if Strava is connected
    if (!stravaService.isConnected()) {
      throw new Error('Strava is not connected. Please connect Strava first.');
    }

    // Fetch existing bikes
    existingBikes.value = (await bikesStore.fetchBikes()).map(bike => ({ ...bike, storedName: bike.name }));

    // Fetch athlete data from Strava
    const athleteData = await withAjaxBar(stravaService.getAthlete());

    // Process bikes
    const stravaBikes = athleteData.bikes || [];
    importBikes.value = stravaBikes.map(stravaBike => {
      // Check if bike already exists (auto-merge)
      const existingBike = existingBikes.value.find(b => b.stravaId === stravaBike.id);

      return {
        stravaBike,
        selected: true, // Default to selected
        mergeWith: existingBike ? existingBike.id : null,
        editedName: stravaBike.name,
        editedType: null,
        matchedExisting: existingBike || null,
        storedName: existingBike ? existingBike.name : null,
      };
    });
  } catch (err: any) {
    console.error('Failed to fetch Strava athlete data:', err);
    fetchError.value = err.message || 'Failed to fetch bikes from Strava';
    showError(err.message || 'Failed to fetch bikes from Strava');
  } finally {
    isFetchingAthlete.value = false;
  }
};

const updateSelection = () => {
  // Selection updated via checkbox
};

const selectAll = () => {
  importBikes.value.forEach(bike => {
    bike.selected = true;
  });
};

const deselectAll = () => {
  importBikes.value.forEach(bike => {
    bike.selected = false;
  });
};

const handleMergeChange = (bikeState: ImportBikeState) => {
  // Do not allow to merge more than one strava bike to the same existing bike
  clearOtherBikesMergeWith(bikeState);

  // When merging, preserve existing bike's name and type
  if (bikeState.mergeWith) {
    const existingBike = existingBikes.value.find(b => b.id === bikeState.mergeWith);
    if (existingBike) {
      bikeState.matchedExisting = existingBike;
    }
  } else {
    bikeState.matchedExisting = null;
  }
};

const clearOtherBikesMergeWith = (bikeState: ImportBikeState) => {
  importBikes.value.forEach(bike => {
    if (bike.matchedExisting && bike.matchedExisting.id !== bikeState.matchedExisting?.id && bike.mergeWith === bikeState.mergeWith) {
      bike.mergeWith = null;
      bike.matchedExisting = null;
    }
  });
};

const formatDistance = (distanceInMeters: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(distanceInMeters);
};

const handleCancel = () => {
  localShow.value = false;
  resetState();
};

const handleSave = async () => {
  // Validate all selected bikes
  const invalidBikes = importBikes.value.filter(b => b.selected && !b.mergeWith && !b.editedName);

  if (invalidBikes.length > 0) {
    showError('Please provide a name for all new bikes');
    return;
  }

  isSyncing.value = true;

  try {
    // Build sync DTOs
    const syncDtos: SyncBikeDto[] = importBikes.value
      .filter(b => b.selected)
      .map(bikeState => {
        if (bikeState.mergeWith) {
          // Merging with existing bike
          const existingBike = existingBikes.value.find(b => b.id === bikeState.mergeWith)!;
          return {
            id: existingBike.id,
            stravaBikeId: bikeState.stravaBike.id,
            name: existingBike.name, // Preserve existing name
            type: (existingBike as any).type || null, // Preserve existing type if available
            totalDistance: (existingBike as any).totalDistance || 0, // Preserve existing distance if available
            stravaDistance: bikeState.stravaBike.distance || 0,
            isActive: existingBike.isActive !== false,
          } as SyncBikeDto;
        } else {
          // Creating new bike
          return {
            id: null,
            stravaBikeId: bikeState.stravaBike.id,
            name: bikeState.editedName,
            type: bikeState.editedType,
            totalDistance: 0,
            stravaDistance: bikeState.stravaBike.distance || 0,
            isActive: true,
          } as SyncBikeDto;
        }
      });

    // Sync bikes
    await withAjaxBar(bikeService.syncBikes(syncDtos));

    // Refresh bikes
    await bikesStore.fetchBikes();

    // Show success message
    const newBikesCount = newCount.value;
    const mergedBikesCount = mergedCount.value;
    let message = `Successfully imported ${selectedCount.value} bike${selectedCount.value !== 1 ? 's' : ''}`;
    if (newBikesCount > 0 && mergedBikesCount > 0) {
      message += ` (${newBikesCount} new, ${mergedBikesCount} merged)`;
    } else if (newBikesCount > 0) {
      message += ` (${newBikesCount} new)`;
    } else if (mergedBikesCount > 0) {
      message += ` (${mergedBikesCount} merged)`;
    }
    showSuccess(message);

    // Close dialog
    localShow.value = false;
    resetState();
  } catch (err: any) {
    console.error('Failed to sync bikes:', err);
    showError(err.message || 'Failed to import bikes');
  } finally {
    isSyncing.value = false;
  }
};

const rowStyleFn = (row: ImportBikeState) => {
  if (!row.selected) {
    return 'background-color: rgba(193, 0, 21, 0.1)';
  } else if (row.mergeWith) {
    return 'background-color: rgba(49, 204, 236, 0.1)';
  } else {
    return 'background-color: rgba(33, 186, 69, 0.1)';
  }
};
</script>

<style scoped lang="css">
.import-dialog {
  width: 90vw;
  height: auto;
  max-height: 80vh;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.bikes-import-table {
  max-height: 60vh;
}

.bikes-import-table :deep(.q-table__top) {
  padding: 0;
}

.bikes-import-table :deep(.q-table__bottom) {
  padding: 0;
}

.saved-name {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.25rem;
    letter-spacing: 0.01786em;
    padding: .4rem;
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: .5rem;
    margin-bottom: .2rem;
}

.saved-name span {
    position: relative;
    cursor: pointer;
    
}

.saved-name span::after {
    content: '';
    position: absolute;
    bottom: -.1rem;
    left: 0;
    width: 100%;
    height: 1px;
    background-image: radial-gradient(circle, var(--q-primary) 1px, transparent 1px);
    background-size: 4px 1px;
    background-position: 0 bottom;
    background-repeat: repeat-x;
}
</style>

