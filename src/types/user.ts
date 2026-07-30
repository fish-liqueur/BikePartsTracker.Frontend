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
  /** Preferred language (BCP-47). Null → resolves to English (ADR 0006). */
  language?: string | null;
}

export interface UserSettingsDto {
  defaultChainCycleLength?: number | null;
  defaultChainCycleIntervalKm?: number | null;
  defaultUseChainCycle?: boolean | null;
  showTips?: boolean | null;
  language?: string | null;
}
