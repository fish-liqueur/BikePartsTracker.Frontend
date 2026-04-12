import { BikeType } from '@/types';

export const bikeTypeOptions: { label: string; value: BikeType }[] = [
    { label: 'Road', value: BikeType.Road },
    { label: 'Mountain', value: BikeType.Mountain },
    { label: 'Gravel', value: BikeType.Gravel },
    { label: 'E-Bike', value: BikeType.EBike },
    { label: 'City', value: BikeType.City },
    { label: 'Touring', value: BikeType.Touring },
    { label: 'Cargo', value: BikeType.Cargo },
    { label: 'Fixed', value: BikeType.Fixed },
    { label: 'Rat', value: BikeType.Rat },
    { label: 'Other', value: BikeType.Other },
  ];