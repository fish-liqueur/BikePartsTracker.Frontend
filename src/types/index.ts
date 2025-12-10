// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Bike Types
export interface Bike {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  userId: string;
  user: User;
  parts: BikePart[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBikeDto {
  name: string;
  brand: string;
  model: string;
  year: number;
}

// Part Types
export interface BikePart {
  id: string;
  name: string;
  partType: PartType;
  brand: string;
  model: string;
  installationDate: Date;
  mileageAtInstallation: number;
  expectedLifespan: number;
  bikeId: string;
  bike: Bike;
  usageHistory: PartUsageHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PartDto {
  id: string;
  name: string;
  partType: PartType;
  brand: string;
  model: string;
  installationDate: Date;
  mileageAtInstallation: number;
  expectedLifespan: number;
  bikeId: string;
}

export interface CreatePartDto {
  name: string;
  partType: PartType;
  brand: string;
  model: string;
  installationDate: Date;
  mileageAtInstallation: number;
  expectedLifespan: number;
  bikeId: string;
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
  Tires = 'Tires',
  Tubes = 'Tubes',
  BrakeCables = 'BrakeCables',
  ShiftCables = 'ShiftCables',
  BottomBracket = 'BottomBracket',
  Headset = 'Headset',
  Pedals = 'Pedals',
  Saddle = 'Saddle',
  Handlebar = 'Handlebar',
  Stem = 'Stem',
  Seatpost = 'Seatpost',
  Other = 'Other'
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

