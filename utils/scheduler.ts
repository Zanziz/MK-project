import { Player, Race } from '../types';

/** Fisher-Yates shuffle — produces a uniform random permutation */
const shuffleArray = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Generates a schedule where each player plays exactly 3 races.
 * Races are groups of 4.
 * Uses a randomized greedy approach with retry logic to minimize conflicts.
 */
export const generateChampionshipSchedule = (players: Player[]): Race[] => {
  const playersCount = players.length;
  // Calculate total slots needed: Players * 3
  const totalSlots = playersCount * 3;
  // Calculate number of races needed (4 players per race)
  const raceCount = Math.ceil(totalSlots / 4);

  const MAX_RETRIES = 100;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const schedule = attemptScheduleGeneration(players, raceCount);
      return schedule;
    } catch {
      // Continue retrying
    }
  }

  // Fallback if perfect generation fails (rare for N > 5)
  return attemptScheduleGeneration(players, raceCount, true);
};

const attemptScheduleGeneration = (players: Player[], raceCount: number, looseMode = false): Race[] => {
  // Create a pool of player IDs, each appearing 3 times
  let pool: string[] = [];
  players.forEach(p => {
    pool.push(p.id, p.id, p.id);
  });

  // Shuffle the pool using Fisher-Yates
  pool = shuffleArray(pool);

  const races: Race[] = [];

  for (let i = 0; i < raceCount; i++) {
    const raceId = `gp-${i + 1}`;
    const racePlayers: string[] = [];

    const slotCount = Math.min(4, pool.length);

    for (let k = 0; k < slotCount; k++) {
      const candidateIndex = pool.findIndex(pid => !racePlayers.includes(pid));

      if (candidateIndex === -1) {
        if (!looseMode) throw new Error("Collision detected");
        racePlayers.push(pool[0]);
        pool.splice(0, 1);
      } else {
        racePlayers.push(pool[candidateIndex]);
        pool.splice(candidateIndex, 1);
      }
    }

    races.push({
      id: raceId,
      name: `Grand Prix ${i + 1}`,
      playerIds: racePlayers,
      results: {},
      isCompleted: false
    });
  }

  return races;
};

/**
 * Sorts players for the semi-final seeding.
 * Returns top 8 players.
 * Tie-breaker: compare sorted position arrays element by element (F1-style).
 */
export const getQualifiers = (players: Player[]): Player[] => {
  return [...players]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      // Count occurrences of each finishing position, best first
      const sortedA = [...a.positions].sort((x, y) => x - y);
      const sortedB = [...b.positions].sort((x, y) => x - y);

      const len = Math.max(sortedA.length, sortedB.length);
      for (let i = 0; i < len; i++) {
        const posA = sortedA[i] ?? 99;
        const posB = sortedB[i] ?? 99;
        if (posA !== posB) return posA - posB; // lower position = better
      }

      return 0;
    })
    .slice(0, 8);
};
