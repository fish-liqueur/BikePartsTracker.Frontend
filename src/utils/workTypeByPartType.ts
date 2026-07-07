import { PartType, type WorkType } from '@/types';

const workTypeByPartType: Record<PartType, WorkType> = {
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

export function getWorkTypeByPartType(partType: PartType): WorkType {
  return workTypeByPartType[partType];
}