import { PartType, type WorkParentType, type WorkTriggerType, type WorkType } from '@/types';

const defaultWorkNamesByPartType = {
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
  type: WorkType;
  triggerType: WorkTriggerType;
  parentType: WorkParentType;
  partType: PartType;
}

export function generateWorkNameForPart(nameString: string, options: Partial<Options>):string {
  if (options.partType && options.parentType === 'Part') {
    return defaultWorkNamesByPartType[options.partType];
  }

  return nameString;
}