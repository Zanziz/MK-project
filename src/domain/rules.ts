export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 50;
export const RACES_PER_PLAYER = 3;
/** Mario Kart World races have up to 24 racers (CPUs included). */
export const MAX_POSITION = 24;

export const SEMI_FINALISTS = 8;
export const QUALIFIERS_PER_SEMI = 2;
export const SEMI_RACES = 2;
export const FINALISTS = 4;
export const FINAL_RACES = 3;

/** Points for 1st to 12th; anything below scores 0. */
export const POINTS = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0] as const;

export const getPoints = (position: number): number => POINTS[position - 1] ?? 0;

/** Semi-finals need 8 qualifiers; smaller groups go straight to a 4-player final. */
export const hasSemiFinals = (playerCount: number): boolean => playerCount >= SEMI_FINALISTS;

export const playoffSpots = (playerCount: number): number => (hasSemiFinals(playerCount) ? SEMI_FINALISTS : FINALISTS);

export const playoffStageName = (playerCount: number): string => (hasSemiFinals(playerCount) ? 'semi-finals' : 'final');
