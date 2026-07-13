// Store fetch status for cache-or-fetch pattern
export type FetchStatus = 'idle' | 'loading' | 'done' | 'error';

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

export interface UpdateResponseAffected {
  affectedBikeIds: string[];
  affectedPartIds: string[];
  affectedRideIds: string[];
  affectedMaintenanceTaskIds: string[];
}

export type DistanceUnit = 'km' | 'mi';

/** Send Guid.Empty to clear BikeId on the backend. */
export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
