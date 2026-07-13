import type { UpdateResponseAffected } from './common';

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

export interface RideResponseDto {
  ride: Ride;
  affected: UpdateResponseAffected;
}

export interface ImportStravaRidesRequestDto {
  startDate: Date | string;
  endDate: Date | string;
}

export interface ImportStravaRidesResponseDto {
  inserted: number;
  updated: number;
  rides: Ride[];
  affected: UpdateResponseAffected;
}
