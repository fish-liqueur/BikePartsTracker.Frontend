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
  isActive?: boolean;
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

// Rides (Strava-imported activities)
export interface Ride {
  id: string;
  stravaActivityId: number;
  bikeId: string | null;
  name: string;
  description?: string | null;
  type: string;
  gearId?: string | null;
  /** User-adjusted distance, meters */
  distance: number;
  /** Distance from Strava, meters */
  recordedDistance: number;
  isActive: boolean;
  startDateLocal: Date;
}

export interface CreateRideDto {
  name: string;
  description?: string | null;
  type?: string | null;
  gearId?: string | null;
  bikeId?: string | null;
  /** Distance in meters (source value for manual entry). */
  distance: number;
  /** User distance in meters; if omitted, backend defaults to distance. */
  startDateLocal: Date;
  isActive?: boolean;
}

/** Update DTO - omitted fields are not changed. */
export interface UpdateRideDto {
  name?: string | null;
  description?: string | null;
  type?: string | null;
  gearId?: string | null;
  bikeId?: string | null;
  distance?: number | null;
  startDateLocal?: Date | null;
  isActive?: boolean | null;
}

export interface ImportStravaRidesRequestDto {
  startDate: Date | string;
  endDate: Date | string;
}

export interface ImportStravaRidesResponseDto {
  inserted: number;
  updated: number;
  rides: Ride[];
}

// Works (maintenance / replacement rules on Part, Bike, or ChainCycle)
export type WorkType = 'OneTime' | 'Repeating' | 'Cyclic';
export type WorkTriggerType = 'Distance' | 'Time';
export type WorkParentType = 'Part' | 'Bike' | 'ChainCycle';

export interface Work {
  id: string;
  name: string;
  description?: string | null;
  startDate: Date;
  type: WorkType;
  triggerType: WorkTriggerType;
  parentType: WorkParentType;
  parentId: string;
  /** Distance trigger: meters; time trigger: days */
  triggerValue: number;
  isActive: boolean;
  consumedValue: number;
  remainingValue: number;
  needsAttention: boolean;
}

export interface CreateWorkDto {
  name: string;
  description?: string | null;
  startDate?: Date | string;
  type?: WorkType;
  triggerType?: WorkTriggerType;
  parentType?: WorkParentType;
  parentId: string;
  triggerValue: number;
  isActive?: boolean;
}

export interface UpdateWorkDto {
  name?: string | null;
  description?: string | null;
  startDate?: Date | string | null;
  type?: WorkType | null;
  triggerType?: WorkTriggerType | null;
  parentType?: WorkParentType | null;
  parentId?: string | null;
  triggerValue?: number | null;
  isActive?: boolean | null;
}

/**
 * Part usage period (install/remove window on a bike), from `GET /api/usageperiods/part/{id}`.
 * Distances are meters (backend cached interval).
 */
export interface PartUsageHistory {
  id: string;
  bikePartId: string;
  bikeId: string | null;
  startDate: Date;
  endDate: Date | null;
  distance: number;
  isShadow: boolean;
  workId: string | null;
  sourceUsagePeriodId: string | null;
  notes?: string | null;
}

export interface CreatePartUsageHistoryDto {
  bikePartId: string;
  bikeId?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  notes?: string | null;
}

export interface UpdatePartUsageHistoryDto {
  bikeId?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  notes?: string | null;
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
  EBike = 'EBike',
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

export type PartFormExposed = {
  formData: CreatePartDto;
  handleSubmit: () => void;
};

export type BikeFormExposed = {
  formData: CreateBikeDto;
  handleSubmit: () => void;
};
