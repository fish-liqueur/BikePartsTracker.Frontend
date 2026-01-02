<template>
  <div class="parts-table-container">
    <!-- Container Header -->
    <div v-if="title" class="container-header">
      <h3 class="container-title">{{ title }}</h3>
      <q-badge v-if="showCount" color="primary" :label="parts.length" />
    </div>

    <!-- Quasar Table -->
    <q-table
      :rows="parts"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
      :filter="filter"
      :selected-rows-label="getSelectedString"
      selection="none"
      :grid="$q.screen.xs"
      class="parts-table"
    >
      <template v-slot:top-right>
        <q-input
          v-model="filter"
          borderless
          dense
          debounce="300"
          placeholder="Search"
          class="search-input"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body="props">
        <q-tr
          :props="props"
          :class="{ 'row-selected': props.selected }"
          @click="handleRowClick(props.row)"
          class="table-row"
        >
          <q-td key="partType" :props="props">
            <q-chip
              :label="props.row.partType"
              color="primary"
              text-color="white"
              size="sm"
            />
          </q-td>
          <q-td key="name" :props="props">
            <div class="part-name-cell">
              <div class="name">{{ props.row.name }}</div>
              <div v-if="props.row.brand || props.row.model" class="brand-model">
                {{ props.row.brand }} {{ props.row.model }}
              </div>
            </div>
          </q-td>
          <q-td key="bike" :props="props">
            <span v-if="props.row.bikeId" class="bike-info">
              Bike {{ props.row.bikeId }}
            </span>
            <span v-else class="no-bike">Not assigned</span>
          </q-td>
          <q-td key="mileage" :props="props">
            {{ getTotalMileage(props.row) }} km
          </q-td>
          <q-td key="remaining" :props="props">
            <span :class="getRemainingClass(props.row)">
              {{ getRemainingText(props.row) }}
            </span>
          </q-td>
          <q-td key="actions" :props="props" auto-width>
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              color="primary"
            >
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item
                    clickable
                    v-close-popup
                    @click="$emit('fullDetails', props.row.id)"
                  >
                    <q-item-section avatar>
                      <q-icon name="info" />
                    </q-item-section>
                    <q-item-section>Full Details</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="$emit('configure', props.row.id)"
                  >
                    <q-item-section avatar>
                      <q-icon name="settings" />
                    </q-item-section>
                    <q-item-section>Configure</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item
                    clickable
                    v-close-popup
                    @click="$emit('delete', props.row.id)"
                    class="text-negative"
                  >
                    <q-item-section avatar>
                      <q-icon name="delete" />
                    </q-item-section>
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:no-data>
        <div class="empty-state">
          <q-icon name="inventory_2" size="48px" color="grey-5" />
          <div class="text-grey">No parts available</div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { BikePart } from '@/types';

export interface TableColumn {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (val: any, row: any) => string;
}

interface Props {
  parts: BikePart[];
  containerId: string;
  title?: string;
  showCount?: boolean;
  currentBikeMileage?: number;
  columns?: TableColumn[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showCount: true,
  currentBikeMileage: 0,
  loading: false,
  columns: () => [
    {
      name: 'partType',
      label: 'Type',
      field: 'partType',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'name',
      label: 'Name',
      field: 'name',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'bike',
      label: 'Bike',
      field: 'bikeId',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'mileage',
      label: 'Total Mileage',
      field: 'mileage',
      align: 'right' as const,
      sortable: true,
    },
    {
      name: 'remaining',
      label: 'Remaining',
      field: 'remaining',
      align: 'right' as const,
      sortable: true,
    },
    {
      name: 'actions',
      label: 'Actions',
      field: 'actions',
      align: 'center' as const,
      sortable: false,
    },
  ]
});

const emit = defineEmits<{
  partSelected: [part: BikePart];
  partReordered: [parts: BikePart[]];
  fullDetails: [partId: string];
  ridesHistory: [partId: string];
  showBike: [bikeId: string];
  removeFromBike: [partId: string];
  putOnOtherBike: [partId: string];
  passToOtherUser: [partId: string];
  delete: [partId: string];
  configure: [partId: string];
}>();

const filter = ref('');
const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
});

const getSelectedString = () => {
  return '';
};

const onRequest = (tableProps: any) => {
  const { page, rowsPerPage, sortBy, descending } = tableProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
};

const handleRowClick = (part: BikePart) => {
  emit('partSelected', part);
};

const getTotalMileage = (part: BikePart): number => {
  if (!props.currentBikeMileage || props.currentBikeMileage === 0) {
    return 0;
  }
  return Math.max(0, props.currentBikeMileage - part.mileageAtInstallation);
};

const getRemainingKms = (part: BikePart): number | null => {
  if (!props.currentBikeMileage || props.currentBikeMileage === 0) {
    return null;
  }
  
  if (!part.expectedLifespan) {
    return null;
  }
  
  const currentMileage = getTotalMileage(part);
  const remaining = part.expectedLifespan - currentMileage;
  
  return Math.max(0, remaining);
};

const getRemainingText = (part: BikePart): string => {
  const kms = getRemainingKms(part);
  
  if (kms === null) {
    return 'N/A';
  }
  
  if (kms === 0) {
    return '0 km (Due)';
  }
  
  return `${kms} km`;
};

const getRemainingClass = (part: BikePart): string => {
  const kms = getRemainingKms(part);
  
  if (kms === null || kms === 0) {
    return 'remaining-due';
  }
  
  if (!part.expectedLifespan) {
    return '';
  }
  
  const percentage = kms / part.expectedLifespan * 100;
  if (percentage < 20) {
    return 'remaining-warning';
  }
  
  return '';
};
</script>

<style scoped lang="css">
.parts-table-container {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.container-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.container-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.search-input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 8px;
}

.parts-table {
  width: 100%;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f7fafc;
}

.part-name-cell {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 500;
  color: #1a202c;
}

.brand-model {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 2px;
}

.bike-info {
  color: #4299e1;
  font-weight: 500;
}

.no-bike {
  color: #a0aec0;
  font-style: italic;
}

.remaining-warning {
  color: #ed8936;
  font-weight: 600;
}

.remaining-due {
  color: #e53e3e;
  font-weight: 600;
}

.empty-state {
  padding: 32px;
  text-align: center;
}

@media (max-width: 768px) {
  .parts-table-container {
    padding: 12px;
  }
}
</style>

