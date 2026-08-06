/**
 * Chain cycle - separate entity linked to a bike.
 * Membership is stored on the cycle as `chains` (part id or null per slot).
 */
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
