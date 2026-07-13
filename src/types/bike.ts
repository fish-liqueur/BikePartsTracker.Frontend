import type { BikePart } from './part.ts';

// Bike Types
export interface Bike {
  id: string;
  name: string;
  description: string;
  type: BikeType;
  parts: BikePart[];
  totalDistance: number;
  createdAt: Date;
  updatedAt: Date;
  stravaId?: string;
  stravaDistance?: number;
  isActive?: boolean;
}

export interface CreateBikeDto {
  name: string;
  description?: string;
  type?: BikeType;
  totalDistance?: number;
  stravaDistance?: number;
  createdAt?: Date;
  updatedAt?: Date;
  stravaId?: string;
  isActive?: boolean;
}

/** Update DTO - omitted fields are not changed. */
export interface UpdateBikeDto {
  name?: string;
  description?: string | null;
  type?: BikeType;
  totalDistance?: number;
  stravaDistance?: number | null;
  stravaId?: string | null;
  isActive?: boolean;
}

export enum BikeType {
  Road = 'Road',
  Mountain = 'Mountain',
  Gravel = 'Gravel',
  EBike = 'EBike',
  City = 'City',
  Touring = 'Touring',
  Cargo = 'Cargo',
  Fixed = 'Fixed',
  Rat = 'Rat',
  Other = 'Other',
}

export type BikeFormExposed = {
  formData: CreateBikeDto;
  handleSubmit: () => void;
};
