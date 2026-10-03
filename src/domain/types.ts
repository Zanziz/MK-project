export const PHASES = ['REGISTRATION', 'CHAMPIONSHIP', 'SEMI_FINALS', 'FINALS'] as const;
export type Phase = (typeof PHASES)[number];

export interface Player {
  id: string;
  firstName: string;
  gamerTag: string;
}

/** Finishing position (1 = winner) keyed by player id. */
export type RaceResults = Record<string, number>;

export interface Race {
  id: string;
  name: string;
  playerIds: string[];
  results: RaceResults;
}

export const SEMI_KEYS = ['A', 'B'] as const;
export type SemiKey = (typeof SEMI_KEYS)[number];

export interface SemiFinal {
  /** In bracket order: see BRACKETS for the seed of each slot. */
  playerIds: string[];
  races: Race[];
  qualifierIds: string[];
}

export interface TournamentState {
  phase: Phase;
  players: Player[];
  championship: Race[];
  semis: Record<SemiKey, SemiFinal> | null;
  final: Race[];
}
