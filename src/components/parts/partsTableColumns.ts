export interface TableColumn {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (val: any, row: any) => string;
}

export const defaultPartColumns: TableColumn[] = [
  {
    name: 'partType', label: 'Type',          field: 'partType', align: 'left',   sortable: true  
  },
  {
    name: 'name',     label: 'Name',           field: 'name',     align: 'left',   sortable: true  
  },
  {
    name: 'bike',     label: 'Bike',           field: 'bikeId',   align: 'left',   sortable: true  
  },
  {
    name: 'mileage',  label: 'Total Mileage',  field: 'mileage',  align: 'right',  sortable: true  
  },
  {
    name: 'remaining',label: 'Remaining',      field: 'remaining',align: 'right',  sortable: true  
  },
  {
    name: 'actions',  label: 'Actions',        field: 'actions',  align: 'center', sortable: false 
  },
];
