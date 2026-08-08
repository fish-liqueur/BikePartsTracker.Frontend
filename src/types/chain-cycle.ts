/**
 * Chain cycle - separate entity linked to a bike.
 * Membership is stored on the cycle as `chains` (part id or null per slot).
 */
import type { BikePart } from './part';

export interface ChainCycle {
  id: string;
  bikeId: string;
  /** Ordered part IDs; null = empty slot. Length = cycle size; index = position. */
  chains: (string | null)[];
  /** Chain part currently installed on the bike from this cycle. */
  activeChainId: string | null;
  /** Rotation interval in metres (ADR 0002). */
  intervalMetres?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChainCycleDto {
  bikeId: string;
  /** Initial slots, e.g. [null, null, null] for a 3-slot cycle. */
  chains?: (string | null)[];
  activeChainId?: string | null;
  intervalMetres?: number | null;
}

export interface UpdateChainCycleDto {
  chains?: (string | null)[];
  activeChainId?: string | null;
  intervalMetres?: number | null;
}

/** Request for POST /api/chaincycles/{id}/fill-empty-slots (ADR 0010). */
export interface FillEmptyChainCycleSlotsDto {
  /** 0-based index of a currently empty slot to activate; omit/null = None yet. Ignored if cycle already has active. */
  activeNewSlotIndex?: number | null;
  /** UTC install time when activating a new chain. Default = now server-side. */
  installationDate?: string | Date | null;
}

/** Mutation envelope from fill-empty-slots. */
export interface FillEmptyChainCycleSlotsResponse {
  chainCycle: ChainCycle;
  createdParts: BikePart[];
  affectedPartIds: string[];
}
