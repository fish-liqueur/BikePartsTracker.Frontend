import { apiService } from './api';
import type {
  Ride,
  CreateRideDto,
  UpdateRideDto,
  ImportStravaRidesRequestDto,
  ImportStravaRidesResponseDto,
} from '@/types';

export type ListRidesParams = {
  startDate?: Date | string;
  endDate?: Date | string;
};

export const ridesService = {
  async getRides(params?: ListRidesParams): Promise<Ride[]> {
    const response = await apiService.get<Ride[]>('/api/rides', {
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
    return response.data ?? [];
  },

  async createRide(dto: CreateRideDto): Promise<Ride | null> {
    const response = await apiService.post<Ride>('/api/rides', dto);
    return response.data ?? null;
  },

  async updateRide(id: string, dto: UpdateRideDto): Promise<Ride | null> {
    const response = await apiService.put<Ride>(`/api/rides/${id}`, dto);
    return response.data ?? null;
  },

  async importFromStrava(body: ImportStravaRidesRequestDto,): Promise<ImportStravaRidesResponseDto> {
    const response = await apiService.post<ImportStravaRidesResponseDto>('/api/rides/import/strava',
      body,);
    if (!response.data) {
      throw new Error('Empty import response');
    }
    return response.data;
  },
};
