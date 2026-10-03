import { createRaces } from './races';
import { RACES_PER_PLAYER } from './rules';
import type { Race } from './types';

export type Rng = () => number;

const ATTEMPTS = 150;
/** lastRace value for a player who has not raced yet. */
const NEVER = -2;

/**
 * Splits `playerCount * RACES_PER_PLAYER` slots into races of 4, using races of 3
 * for the remainder so that nobody ends up in a 1- or 2-player race.
 */
export const raceSizes = (playerCount: number): number[] => {
  const slots = playerCount * RACES_PER_PLAYER;
  const threes = (4 - (slots % 4)) % 4;
  const fours = (slots - 3 * threes) / 4;
  return [...Array<number>(fours).fill(4), ...Array<number>(threes).fill(3)];
};

export interface ScheduleQuality {
  /** Times a player races in two consecutive Grands Prix. */
  backToBack: number;
  /** Extra meetings beyond the first, summed over every pair of players. */
  repeatedPairs: number;
}

export const scheduleQuality = (lineups: string[][]): ScheduleQuality => {
  const ids = [...new Set(lineups.flat())];
  const index = new Map(ids.map((id, i) => [id, i]));
  return qualityOf(
    lineups.map(lineup => lineup.flatMap(id => index.get(id) ?? [])),
    ids.length,
  );
};

/**
 * Builds the championship: every player races exactly RACES_PER_PLAYER times.
 * Runs several randomized greedy attempts and keeps the best one, favouring rest
 * between races and fresh opponents.
 */
export const generateSchedule = (playerIds: string[], rng: Rng = Math.random): Race[] => {
  // Work on indices 0..n-1: the greedy inner loop runs thousands of times per attempt.
  const n = playerIds.length;
  const sizes = raceSizes(n);
  let best: { lineups: number[][]; cost: number } | null = null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const lineups = buildLineups(n, sizes, rng);
    if (!lineups) continue;
    const { backToBack, repeatedPairs } = qualityOf(lineups, n);
    const cost = backToBack * 100 + repeatedPairs;
    if (!best || cost < best.cost) best = { lineups, cost };
    if (cost === 0) break;
  }

  if (!best) throw new Error(`Could not build a schedule for ${n} players`);
  return createRaces(
    'gp',
    'Grand Prix',
    best.lineups.map(lineup => lineup.flatMap(p => playerIds[p] ?? [])),
  );
};

const buildLineups = (n: number, sizes: number[], rng: Rng): number[][] | null => {
  const remaining = new Int8Array(n).fill(RACES_PER_PLAYER);
  const lastRace = new Int32Array(n).fill(NEVER);
  const meetings = new Int32Array(n * n);
  const lineups: number[][] = [];
  let slotsFilled = 0;

  for (const [raceIndex, size] of sizes.entries()) {
    const racesLeft = sizes.length - raceIndex;
    // Races each player should have played by the middle of this race to keep an even pace.
    const expectedPlayed = (slotsFilled + size / 2) / n;
    const lineup: number[] = [];

    const score = (p: number): number => {
      const left = remaining[p] ?? 0;
      const last = lastRace[p] ?? NEVER;
      // A player with as many races left as there are races must play every one of them.
      const forced = left >= racesLeft ? 1_000_000 : 0;
      const behindPace = expectedPlayed - (RACES_PER_PLAYER - left);
      const waited = raceIndex - Math.max(last, -1);
      const backToBack = last === raceIndex - 1 ? 1_000 : 0;
      const repeats = lineup.reduce((sum, other) => sum + (meetings[pairIndex(p, other, n)] ?? 0), 0);
      return forced + behindPace * 200 + waited * 5 - backToBack - repeats * 30 + rng() * 25;
    };

    while (lineup.length < size) {
      let pick = -1;
      let pickScore = -Infinity;
      for (let p = 0; p < n; p++) {
        if (remaining[p] === 0 || lineup.includes(p)) continue;
        const s = score(p);
        if (s > pickScore) {
          pick = p;
          pickScore = s;
        }
      }
      if (pick < 0) return null;
      lineup.push(pick);
    }

    for (const p of lineup) {
      remaining[p] = (remaining[p] ?? 0) - 1;
      lastRace[p] = raceIndex;
    }
    forEachPair(lineup, (a, b) => {
      const key = pairIndex(a, b, n);
      meetings[key] = (meetings[key] ?? 0) + 1;
    });
    lineups.push(lineup);
    slotsFilled += size;
  }

  return lineups;
};

const qualityOf = (lineups: number[][], n: number): ScheduleQuality => {
  const meetings = new Int32Array(n * n);
  let backToBack = 0;
  let repeatedPairs = 0;

  lineups.forEach((lineup, i) => {
    const previous = lineups[i - 1] ?? [];
    backToBack += lineup.filter(p => previous.includes(p)).length;
    forEachPair(lineup, (a, b) => {
      const key = pairIndex(a, b, n);
      meetings[key] = (meetings[key] ?? 0) + 1;
      if ((meetings[key] ?? 0) > 1) repeatedPairs++;
    });
  });

  return { backToBack, repeatedPairs };
};

const pairIndex = (a: number, b: number, n: number): number => (a < b ? a * n + b : b * n + a);

const forEachPair = (lineup: number[], fn: (a: number, b: number) => void): void => {
  for (let i = 0; i < lineup.length; i++) {
    for (let j = i + 1; j < lineup.length; j++) fn(lineup[i] ?? 0, lineup[j] ?? 0);
  }
};
