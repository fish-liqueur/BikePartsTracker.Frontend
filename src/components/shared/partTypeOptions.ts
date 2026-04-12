import { BikeType, PartType } from '@/types';

export const partTypeOptions: { label: string; value: PartType }[] = [
    { label: 'Chain', value: PartType.Chain },
    { label: 'Cassette', value: PartType.Cassette },
    { label: 'Chainring', value: PartType.Chainring },
    { label: 'Brake Pads', value: PartType.BrakePads },
    { label: 'Tyre', value: PartType.Tyre },
    { label: 'Battery', value: PartType.Battery },
    { label: 'Bottom Bracket', value: PartType.BottomBracket },
    { label: 'Headset', value: PartType.Headset },
    { label: 'Hub', value: PartType.Hub },
    { label: 'Pedals', value: PartType.Pedals },
    { label: 'Other', value: PartType.Other },
  ];