import { PartType, type MaintenanceTaskParentType, type MaintenanceTaskTriggerType, type MaintenanceTaskType } from '@/types';

const defaultMaintenanceTaskNamesByPartType = {
  [PartType.Chain]: 'Chain Lubrication',
  [PartType.Cassette]: 'Cassette Maintenance',
  [PartType.Chainring]: 'Chainring Maintenance',
  [PartType.BrakePads]: 'Brake Pads Replacement',
  [PartType.Tyre]: 'Check the sealant',
  [PartType.Battery]: 'Battery Maintenance',
  [PartType.BottomBracket]: 'Bottom Bracket Maintenance',
  [PartType.Headset]: 'Headset Maintenance',
  [PartType.Hub]: 'Hub Maintenance',
  [PartType.Pedals]: 'Pedals Maintenance',
  [PartType.Other]: 'Other Maintenance',
};

export interface Options {
  type: MaintenanceTaskType;
  triggerType: MaintenanceTaskTriggerType;
  parentType: MaintenanceTaskParentType;
  partType: PartType;
}

export function generateMaintenanceTaskNameForPart(nameString: string, options: Partial<Options>):string {
  if (options.partType && options.parentType === 'Part') {
    return defaultMaintenanceTaskNamesByPartType[options.partType];
  }

  return nameString;
}
