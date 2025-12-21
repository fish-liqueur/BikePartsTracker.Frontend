import type { Bike } from '@/types';

// Shared injection key for providing/injecting bike context
export const BIKE_CONTEXT_KEY = Symbol('bikeContext') as symbol;
export type BikeContextValue = Bike | null;

