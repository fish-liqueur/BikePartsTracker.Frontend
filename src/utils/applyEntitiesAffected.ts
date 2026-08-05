import type { UpdateResponseAffected } from '@/types';
import { usePartsStore } from '@/stores/partsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useRidesStore } from '@/stores/ridesStore';
import { useMaintenanceTasksStore } from '@/stores/maintenanceTasksStore';

/**
 * Quiet dirty-marking from mutation-invalidation / SignalR entitiesAffected payloads.
 * No toast / banner / bell (ADR 0001 / Feature 11). Active list surfaces (e.g. RidesWidget)
 * watch dirty state and refetch while mounted.
 */
export function applyEntitiesAffected(affected: UpdateResponseAffected): void {
  if (affected.affectedPartIds?.length) {
    usePartsStore().markPartsDirty(affected.affectedPartIds);
  }
  if (affected.affectedBikeIds?.length) {
    useBikesStore().markBikesDirty(affected.affectedBikeIds);
  }
  if (affected.affectedRideIds?.length) {
    useRidesStore().markRidesDirty(affected.affectedRideIds);
  }
  if (affected.affectedMaintenanceTaskIds?.length) {
    useMaintenanceTasksStore().markMaintenanceTasksDirty(affected.affectedMaintenanceTaskIds);
  }
}

/** On SignalR (re)connect: mark all cached entities dirty so open views refresh. */
export function markAllCachedEntitiesDirty(): void {
  usePartsStore().markAllCachedDirty();
  useBikesStore().markAllCachedDirty();
  useRidesStore().markAllCachedDirty();
  useMaintenanceTasksStore().markAllCachedDirty();
}
