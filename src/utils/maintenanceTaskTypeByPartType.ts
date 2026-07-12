import { PartType, type MaintenanceTaskType } from '@/types';

const maintenanceTaskTypeByPartType: Record<PartType, MaintenanceTaskType> = {
  [PartType.Chain]: 'Repeating',
  [PartType.Cassette]: 'Repeating',
  [PartType.Chainring]: 'Repeating',
  [PartType.BrakePads]: 'OneTime',
  [PartType.Tyre]: 'Repeating',
  [PartType.Battery]: 'Repeating',
  [PartType.BottomBracket]: 'Repeating',
  [PartType.Headset]: 'Repeating',
  [PartType.Hub]: 'Repeating',
  [PartType.Pedals]: 'Repeating',
  [PartType.Other]: 'Repeating',
};

export function getMaintenanceTaskTypeByPartType(partType: PartType): MaintenanceTaskType {
  return maintenanceTaskTypeByPartType[partType];
}
