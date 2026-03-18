<template>
  <div class="bikes-table-container">
    <!-- Quasar Table -->
    <q-table
      :rows="bikes"
      :columns="props.columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
      :filter="filter"
      :selected-rows-label="getSelectedString"
      selection="none"
      :grid="$q.screen.xs"
      class="bikes-table"
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
          <q-td key="name" :props="props">
            <div class="bike-name-cell">
              <div class="name">{{ props.row.name }}</div>
            </div>
          </q-td>
          <q-td key="type" :props="props">
            <q-chip
              :label="props.row.type"
              color="primary"
              text-color="white"
              size="sm"
            />
          </q-td>
          <q-td key="parts" :props="props">
            <q-badge
              :label="getPartsCount(props.row)"
              color="secondary"
            />
          </q-td>
          <q-td key="actions"
                :props="props"
                auto-width>
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
                    @click="$emit('rides', props.row.id)"
                  >
                    <q-item-section avatar>
                      <q-icon name="directions_bike" />
                    </q-item-section>
                    <q-item-section>Rides</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="$emit('parts', props.row.id)"
                  >
                    <q-item-section avatar>
                      <q-icon name="hardware" />
                    </q-item-section>
                    <q-item-section>Parts</q-item-section>
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
          <q-icon name="directions_bike"
                  size="48px"
                  color="grey-5" />
          <div class="text-grey">No bikes available</div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Bike } from '@/types';

export interface TableColumn {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (val: any, row: any) => string;
}

interface Props {
  bikes: Bike[];
  columns?: TableColumn[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: () => [
    {
      name: 'name',
      label: 'Name',
      field: 'name',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'type',
      label: 'Type',
      field: 'type',
      align: 'center' as const,
      sortable: true,
    },
    {
      name: 'parts',
      label: 'Parts',
      field: 'parts',
      align: 'center' as const,
      sortable: false,
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
  bikeSelected: [bike: Bike];
  fullDetails: [bikeId: string];
  rides: [bikeId: string];
  parts: [bikeId: string];
  configure: [bikeId: string];
  delete: [bikeId: string];
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
  const {
    page, rowsPerPage, sortBy, descending 
  } = tableProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
};

const handleRowClick = (bike: Bike) => {
  emit('bikeSelected', bike);
};

const getPartsCount = (bike: Bike): number => {
  return bike.parts?.length || 0;
};
</script>

<style scoped lang="css">
.bikes-table-container {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 8px;
}

.bikes-table {
  width: 100%;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f7fafc;
}

.bike-name-cell {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 500;
  color: #1a202c;
}

.empty-state {
  padding: 32px;
  text-align: center;
}

@media (max-width: 768px) {
  .bikes-table-container {
    padding: 12px;
  }
}
</style>

