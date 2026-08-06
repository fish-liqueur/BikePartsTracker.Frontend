import type { DistanceUnit } from './common';

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  defaultChainCycleLength: number;
  /** Default chain-cycle interval in metres (auth envelope; ADR 0002 E2). */
  defaultChainCycleInterval: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserSettings {
  defaultChainCycleLength: number;
  /** Default chain-cycle interval in metres (ADR 0002). */
  defaultChainCycleIntervalMetres: number;
  defaultUseChainCycle: boolean;
  showTips: boolean;
  /**
   * Explicit distance preference (`km` | `mi`). Null/absent → resolve via locale (ADR 0002 B).
   * Store getters expose the *effective* unit separately.
   */
  distanceUnit?: DistanceUnit | null;
  /** Preferred language (BCP-47). Null → resolves to English (ADR 0006). */
  language?: string | null;
}

export interface UserSettingsDto {
  defaultChainCycleLength?: number | null;
  defaultChainCycleIntervalMetres?: number | null;
  defaultUseChainCycle?: boolean | null;
  showTips?: boolean | null;
  language?: string | null;
  /** Explicit preference; omit to leave unchanged; null clears (server supports presence tracking). */
  distanceUnit?: DistanceUnit | null;
}
