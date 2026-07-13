import type { Bike } from './bike';
import type { ChainCycle } from './chain-cycle.ts';

// Part Types
export interface BikePart {
  id: string;
  name: string;
  description?: string;
  partType: PartType;
  brand?: string;
  model?: string;
  installationDate?: Date;
  mileageAtInstallation?: number;
  bikeId: string | null;
  bike?: Bike;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  totalDistance?: number;
}

export interface PartDto {
  id: string;
  name: string;
  partType: PartType;
  brand: string;
  model: string;
  installationDate: Date;
  mileageAtInstallation: number;
  bikeId: string;
}

export interface CreatePartDto {
  name: string;
  partType: PartType;
  brand?: string;
  model?: string;
  description?: string;
  installationDate?: Date;
  mileageAtInstallation: number;
  isActive?: boolean;
  bikeId?: string;
}

/** DTO for updating a part - allows null to explicitly clear optional fields. */
export interface UpdatePartDto {
  name?: string | null;
  description?: string | null;
  partType?: PartType;
  brand?: string | null;
  model?: string | null;
  installationDate?: Date | null;
  mileageAtInstallation?: number | null;
  bikeId?: string | null;
  isActive?: boolean;
  scheduleType?: PartScheduleType | null;
  scheduleValue?: number | null;
}

export enum PartScheduleType {
  OneTimeUse = 1,
  IntervalMaintenance = 2,
  CyclicReplacement = 3
}

export enum PartType {
  Chain = 'Chain',
  Cassette = 'Cassette',
  Chainring = 'Chainring',
  BrakePads = 'BrakePads',
  Tyre = 'Tyre',
  Battery = 'Battery',
  BottomBracket = 'BottomBracket',
  Headset = 'Headset',
  Hub = 'Hub',
  Pedals = 'Pedals',
  Other = 'Other'
}

export type PartFormExposed = {
  formData: CreatePartDto;
  handleSubmit: () => void;
};

/** Response from PUT /api/parts/{id}. */
export interface UpdatePartResponse {
  part: BikePart;
  affectedChainCycles: ChainCycle[];
}

/** Response from DELETE /api/parts/{id}. */
export interface DeletePartResponse {
  success: boolean;
  affectedChainCycles: ChainCycle[];
}
