import type { BikeType } from './bike';

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
