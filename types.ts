export enum Phase {
  REGISTRATION = 'REGISTRATION',
  CHAMPIONSHIP = 'CHAMPIONSHIP',
  SEMI_FINALS = 'SEMI_FINALS',
  FINALS = 'FINALS',
  COMPLETED = 'COMPLETED'
}

export interface Player {
  id: string;
  firstName: string;
  gamerTag: string;
  score: number;
  racesPlayed: number;
  positions: number[]; // History of positions
  isQualified?: boolean;
}

// A generic race structure
export interface Race {
  id: string;
  name: string;
  playerIds: string[];
  results: Record<string, number>; // playerId -> position (1-12)
  isCompleted: boolean;
}

export interface SemiFinalSession {
  id: string; // 'session-1' or 'session-2'
  name: string;
  playerIds: string[]; // 4 players
  races: Race[]; // 2 GPs
  manualQualifiers: string[]; // IDs of the 2 players selected by admin
}

export interface TournamentState {
  phase: Phase;
  players: Player[];
  championshipRaces: Race[];
  semiFinals: {
    session1: SemiFinalSession;
    session2: SemiFinalSession;
  };
  finalRaces: Race[];
}

export const POINTS_SYSTEM = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0];

export const getPoints = (position: number): number => {
  if (position < 1) return 0;
  if (position > POINTS_SYSTEM.length) return 0;
  return POINTS_SYSTEM[position - 1];
};