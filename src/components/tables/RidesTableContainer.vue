<template>
  <div class="rides-table">
    <div v-if="title" class="rides-table__header">
      <h3 class="rides-table__title">{{ title }}</h3>
      <q-badge v-if="showCount"
               color="primary"
               :label="rides.length" />
    </div>

    <q-table :rows="rides"
             :columns="columns"
             row-key="id"
             :loading="loading"
             :pagination="pagination"
             @request="onRequest"
             :filter="filter"
             :selected-rows-label="getSelectedString"
             selection="none"
             :grid="$q.screen.xs"
             class="rides-table__table"
             wrap-cells
          
             :table-row-class-fn="rowClassFn">
      <template v-slot:top-right>
        <q-input v-model="filter"
                 borderless
                 dense
                 debounce="300"
                 placeholder="Search"
                 class="rides-table__search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" class="rides-table__row">
          <q-td key="date" :props="props">
            <div class="display-flex flex-column flex-align-start gap-2 w-100">
              <span>{{ formatDate(props.row.startDateLocal) }}</span>
              <span v-if="!props.row.isActive" class="co">Ignored (doesn't count)</span>
            </div>
              
          </q-td>
          <q-td key="name" :props="props">
            <div class="rides-table__name-cell">
              <div class="rides-table__name">{{ props.row.name }}</div>
              <div v-if="props.row.description"
                   class="rides-table__description">
                {{ props.row.description }}
              </div>
            </div>
          </q-td>
          <q-td key="bikeId" :props="props">
            <div v-if="props.row.bikeId" class="rides-table__bike-cell">
              <OverflowTooltip :text="bikesStore.getBikeById(props.row.bikeId)?.name || 'Unknown'" />
            </div>
          </q-td>
          <q-td key="distance" :props="props">
            <div class="rides-table__distance">
              <div class="rides-table__distance-line">
                <span class="rides-table__distance-label">Recorded distance</span>
                <span>{{ formatMeters(props.row.recordedDistance) }}</span>
              </div>
              <div class="rides-table__distance-line">
                <span class="rides-table__distance-label">User distance</span>
                <span>{{ formatMeters(props.row.distance) }}</span>
              </div>
            </div>
          </q-td>
          
          <q-td key="actions"
                :props="props"
                auto-width>
            <div class="display-flex flex-row flex-align-center flex-wrap flex-justify-end gap-2">
              <div class="display-flex flex-row gap-2">
                <q-btn 
                  v-if="!props.row.stravaActivityId"
                  outlined
                  dense
                  no-caps
                  color="negative"
                  label="Delete"
                  @click.stop="$emit('deleteRide', props.row as Ride)" />
                <q-btn 
                  v-if="props.row.isActive"
                  outlined
                  dense
                  no-caps
                  color="accent"
                  label="Ignore"
                  @click.stop="$emit('changeActivityState', props.row as Ride, false)" />
                <q-btn 
                  v-else
                  outlined
                  dense
                  no-caps
                  color="secondary"
                  label="Activate"
                  @click.stop="$emit('changeActivityState', props.row as Ride, true)" />
                <q-btn
                  outlined
                  dense
                  no-caps
                  color="primary"
                  label="Edit"
                  @click.stop="$emit('edit', props.row as Ride)" />
              </div>
            </div>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:no-data>
        <div class="rides-table__empty">
          <q-icon name="directions_bike"
                  size="48px"
                  color="grey-5" />
          <div class="text-grey">No rides available</div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QTableProps } from 'quasar';
import type { Ride } from '@/types';
import { defaultRideColumns } from './ridesTableColumns';
import type { TableColumn } from '@/components/tables/partsTableColumns';
import { useBikesStore } from '@/stores/bikesStore';
import OverflowTooltip from '@/components/shared/OverflowTooltip.vue';
import { formatDate } from '@/utils/date';
import { formatMeters } from '@/utils/distance';

const bikesStore = useBikesStore();

type QTableRequestProps = Parameters<NonNullable<QTableProps['onRequest']>>[0];

interface Props {
  rides: Ride[];
  title?: string;
  showCount?: boolean;
  columns?: TableColumn[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  showCount: true,
  loading: false,
  columns: () => defaultRideColumns,
});

defineEmits<{
  changeActivityState: [ride: Ride, newActivityState: boolean];
  deleteRide: [ride: Ride];
  edit: [ride: Ride];
}>();

const filter = ref('');
const pagination = ref({
  sortBy: 'startDateLocal',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

const getSelectedString = () => '';

const rowClassFn = (row: Ride) => {
  return row.isActive ? 'rides-table__row--active' : 'rides-table__row--inactive';
};

const onRequest = (tableProps: QTableRequestProps) => {
  const {
    page, rowsPerPage, sortBy, descending,
  } = tableProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy;
  pagination.value.descending = descending;
};
</script>

<style scoped lang="scss">
.rides-table {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 12px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
  }

  &__row {
    background-color: #f7fafc;

    &--active {
      background-color: #f7fafc;
    }
    &--inactive {
      background-color: #CCC;

      &:hover {
        background-color: #CCC;
      }
    }
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a202c;
  }

  &__search {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 4px 8px;
  }

  &__table {
    width: 100%;
  }

  &__row {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f7fafc;
    }
  }

  &__distance {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__distance-line {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 0.875rem;
  }

  &__distance-label {
    color: #718096;
    font-size: 0.75rem;
    min-width: 3.25rem;
    text-align: right;
  }

  &__name-cell {
    display: flex;
    flex-direction: column;
  }

  &__bike-cell {
    max-width: 5rem;
  }

  &__name {
    font-weight: 500;
    color: #1a202c;
  }

  &__description {
    font-size: 0.875rem;
    color: #718096;
    margin-top: 2px;
  }

  &__empty {
    padding: 32px;
    text-align: center;
  }
}
</style>
