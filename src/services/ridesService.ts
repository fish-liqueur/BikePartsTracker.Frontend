import { apiService } from './api';
import type {
  Ride,
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

  async importFromStrava(body: ImportStravaRidesRequestDto,): Promise<ImportStravaRidesResponseDto> {
    const response = await apiService.post<ImportStravaRidesResponseDto>('/api/rides/import/strava',
      body,);
    if (!response.data) {
      throw new Error('Empty import response');
    }
    return response.data;
  },
};
