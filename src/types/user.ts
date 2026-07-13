import type { DistanceUnit } from './common';

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  defaultChainCycleLength: number;
  defaultChainCycleInterval: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserSettings {
  defaultChainCycleLength: number;
  defaultChainCycleIntervalKm: number;
  defaultUseChainCycle: boolean;
  showTips: boolean;
  distanceUnit: DistanceUnit;
}

export interface UserSettingsDto {
  defaultChainCycleLength?: number | null;
  defaultChainCycleIntervalKm?: number | null;
  defaultUseChainCycle?: boolean | null;
  showTips?: boolean | null;
}
