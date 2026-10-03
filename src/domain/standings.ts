import { getPoints, MAX_POSITION } from './rules';
import type { Player, Race } from './types';

export interface Standing {
  player: Player;
  points: number;
  racesPlayed: number;
  /** Finishing positions, best first. */
  positions: number[];
  /** 1-based, shared by exact ties; null until the player has raced. */
  rank: number | null;
  /** True when another player has exactly the same record (points and countback). */
  tied: boolean;
}

/** Points first, then countback on best finishes (F1-style). Returns 0 only for an exact tie. */
const compareStandings = (a: Standing, b: Standing): number => {
  if (a.points !== b.points) return b.points - a.points;
  const length = Math.max(a.positions.length, b.positions.length);
  for (let i = 0; i < length; i++) {
    const diff = (a.positions[i] ?? MAX_POSITION + 1) - (b.positions[i] ?? MAX_POSITION + 1);
    if (diff !== 0) return diff;
  }
  return 0;
};

/** Ranks `players` on the given races. Exact ties keep the order of `players` (registration or seed order). */
export const computeStandings = (players: Player[], races: Race[]): Standing[] => {
  const rows: Standing[] = players.map(player => {
    const positions = races.flatMap(race => race.results[player.id] ?? []).sort((x, y) => x - y);
    return {
      player,
      points: positions.reduce((sum, position) => sum + getPoints(position), 0),
      racesPlayed: positions.length,
      positions,
      rank: null,
      tied: false,
    };
  });

  rows.sort(compareStandings);
  rows.forEach((row, i) => {
    if (row.racesPlayed === 0) return;
    const previous = rows[i - 1];
    if (previous && compareStandings(previous, row) === 0) {
      row.rank = previous.rank;
      row.tied = previous.tied = true;
    } else {
      row.rank = i + 1;
    }
  });
  return rows;
};

/** The outright leader, or null when nobody has raced or the top spot is an exact tie. */
export const leader = (standings: Standing[]): Standing | null => {
  const first = standings[0];
  return first && first.rank !== null && !first.tied ? first : null;
};
