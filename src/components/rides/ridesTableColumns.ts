import type { TableColumn } from '@/components/parts/partsTableColumns';

export const defaultRideColumns: TableColumn[] = [
  {
    name: 'date',
    label: 'Date',
    field: 'startDateLocal',
    align: 'left',
    sortable: true,
  },
  {
    name: 'distance',
    label: 'Distance',
    field: 'distance',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center',
    sortable: false,
  },
];
