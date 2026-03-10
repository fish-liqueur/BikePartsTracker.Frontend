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
  // user: User;
  parts: BikePart[];
  totalDistance: number;
  createdAt: Date;
  updatedAt: Date;
  stravaId?: string;
  stravaDistance?: number;
  isActive?: boolean;
  /** Empty array means no chain cycle is configured for this bike. */
  chainCycles: ChainCycle[];
}

export interface CreateBikeDto {
  name: string;
  description?: string;
  type?: BikeType;
  // user: User;
  parts?: BikePart[];
  totalDistance?: number;
  stravaDistance?: number;
  chainCycles?: CreateChainCycleDto[];
  createdAt?: Date;
  updatedAt?: Date;
  stravaId?: string;
  isActive?: boolean;
}

// Update DTO - allows null to explicitly clear optional fields
export interface UpdateBikeDto {
  name?: string;
  description?: string | null;
  type?: BikeType;
  parts?: BikePart[];
  totalDistance?: number;
  stravaDistance?: number | null;
  /** null = clear all cycles, undefined = no change, array = replace cycles */
  chainCycles?: UpdateChainCycleDto[] | null;
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
  installationDate?: Date;
  mileageAtInstallation: number;
  isActive?: boolean;
  bikeId?: string;
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
  friend?: any;
  follower?: any;
  follower_count?: number;
  friend_count?: number;
  mutual_friend_count?: number;
  athlete_type?: number;
  date_preference?: string;
  measurement_preference?: string;
  clubs?: any[];
  ftp?: number | null;
  weight?: number;
  bikes?: StravaBike[];
  shoes?: any[];
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

export interface ChainCycle {
  id: string;
  /** Ordered list of chain part IDs that form the rotation. */
  chains: string[];
  /** ID of the chain part that is currently installed. */
  activeChainId: string | null;
  /** Distance (km) between chain swaps within this cycle. */
  intervalKm?: number;
  /** Total number of chains in the rotation. */
  cycleLength?: number;
}

export interface CreateChainCycleDto {
  chains: string[];
  activeChainId?: string | null;
  intervalKm?: number;
  cycleLength?: number;
}

export interface UpdateChainCycleDto {
  id?: string;
  chains?: string[];
  /** null = clear active chain, undefined = no change, string = set value */
  activeChainId?: string | null;
  intervalKm?: number | null;
  cycleLength?: number | null;
}
