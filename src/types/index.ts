// Store fetch status for cache-or-fetch pattern
export type FetchStatus = 'idle' | 'loading' | 'done' | 'error';

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
  usageHistory?: PartUsageHistory[];
  createdAt?: Date;
  updatedAt?: Date;
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

// Maintenance Types
export interface Maintenance {
  id: string;
  bikeId: string;
  bike: Bike;
  description: string;
  date: Date;
  mileage: number;
  cost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceDto {
  id: string;
  bikeId: string;
  description: string;
  date: Date;
  mileage: number;
  cost: number;
  notes?: string;
}

export interface CreateMaintenanceDto {
  bikeId: string;
  description: string;
  date: Date;
  mileage: number;
  cost: number;
  notes?: string;
}

// Part Usage History
export interface PartUsageHistory {
  id: string;
  partId: string;
  part: BikePart;
  mileage: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

// Enums
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

export enum BikeType {
  Road = 'Road',
  Mountain = 'Mountain',
  Gravel = 'Gravel',
  EBike = 'E-Bike',
  City = 'City',
  Touring = 'Touring',
  Cargo = 'Cargo',
  Fixed = 'Fixed',
  Rat = 'Rat',
  Other = 'Other',
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
  user?: User;
}

// Strava Types
export interface StravaBike {
  id: string;
  primary?: boolean;
  name: string;
  resource_state?: number;
  distance?: number;
}

export interface StravaAthleteDto {
  id: number;
  username?: string;
  resource_state?: number;
  firstname?: string;
  lastname?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  premium?: boolean;
  created_at?: string;
  updated_at?: string;
  badge_type_id?: number;
  profile_medium?: string;
  profile?: string;
  friend?: unknown;
  follower?: unknown;
  follower_count?: number;
  friend_count?: number;
  mutual_friend_count?: number;
  athlete_type?: number;
  date_preference?: string;
  measurement_preference?: string;
  clubs?: unknown[];
  ftp?: number | null;
  weight?: number;
  bikes?: StravaBike[];
  shoes?: unknown[];
}

export interface SyncBikeDto {
  id?: string | null;
  stravaBikeId?: string | null;
  name: string;
  type: BikeType | null;
  totalDistance: number;
  stravaDistance: number;
  isActive: boolean;
}

export interface UserSettings {
  defaultChainCycleLength: number;
  defaultChainCycleIntervalKm: number;
  defaultUseChainCycle: boolean;
  showTips: boolean;
}

export interface UserSettingsDto {
  defaultChainCycleLength?: number | null;
  defaultChainCycleIntervalKm?: number | null;
  defaultUseChainCycle?: boolean | null;
  showTips?: boolean | null;
}

/**
 * Chain cycle - separate entity linked to a bike.
 * Membership is stored on the cycle as `chains` (part id or null per slot).
 */
export interface ChainCycle {
  id: string;
  bikeId: string;
  /** Ordered part IDs; null = empty slot. Length = cycle size; index = position. */
  chains: (string | null)[];
  /** Chain part currently installed on the bike from this cycle. */
  activeChainId: string | null;
  intervalKm?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChainCycleDto {
  bikeId: string;
  /** Initial slots, e.g. [null, null, null] for a 3-slot cycle. */
  chains?: (string | null)[];
  activeChainId?: string | null;
  intervalKm?: number | null;
}

export interface UpdateChainCycleDto {
  chains?: (string | null)[];
  activeChainId?: string | null;
  intervalKm?: number | null;
}

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

/** Send Guid.Empty to clear BikeId on the backend. */
export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
