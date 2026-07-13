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
  maintenanceTaskId: string | null;
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
