import { Player, Race } from '../types';

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
    } catch (e) {
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
    pool.push(p.id);
    pool.push(p.id);
    pool.push(p.id);
  });

  // Shuffle the pool
  pool = pool.sort(() => Math.random() - 0.5);

  const races: Race[] = [];

  for (let i = 0; i < raceCount; i++) {
    const raceId = `gp-${i + 1}`;
    const racePlayers: string[] = [];
    
    // Try to fill the race with 4 players
    // In the last race, we might have fewer if math doesn't align perfectly, 
    // but the prompt formula assumes divisibility ideally. 
    // We will just take up to 4 from the pool.
    const slotCount = Math.min(4, pool.length);

    for (let k = 0; k < slotCount; k++) {
      // Find a player in the pool that isn't already in this race
      const candidateIndex = pool.findIndex(pid => !racePlayers.includes(pid));
      
      if (candidateIndex === -1) {
        if (!looseMode) throw new Error("Collision detected");
        // In loose mode, we just take the first available even if duplicate (shouldn't happen with 3 entries logic often)
        const forcedPid = pool[0];
        racePlayers.push(forcedPid);
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
 */
export const getQualifiers = (players: Player[]): Player[] => {
  return [...players]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-breaker: Best single position
      const minPosA = Math.min(...(a.positions.length ? a.positions : [99]));
      const minPosB = Math.min(...(b.positions.length ? b.positions : [99]));
      return minPosA - minPosB;
    })
    .slice(0, 8);
};