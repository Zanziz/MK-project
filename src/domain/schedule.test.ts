import { describe, expect, it } from 'vitest';
import { RACES_PER_PLAYER } from './rules';
import { generateSchedule, raceSizes, scheduleQuality, type Rng } from './schedule';

/** Deterministic PRNG so failures are reproducible. */
const seeded =
  (seed: number): Rng =>
  () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

const ids = (count: number) => Array.from({ length: count }, (_, i) => `p${i}`);

describe('raceSizes', () => {
  it.each([
    [4, [4, 4, 4]],
    [5, [4, 4, 4, 3]],
    [6, [4, 4, 4, 3, 3]],
    [7, [4, 4, 4, 3, 3, 3]],
    [8, [4, 4, 4, 4, 4, 4]],
  ])('splits %i players into races of 3 or 4', (count, sizes) => {
    expect(raceSizes(count)).toEqual(sizes);
  });

  it('never creates races of fewer than 3 players', () => {
    for (let count = 4; count <= 50; count++) {
      const sizes = raceSizes(count);
      expect(sizes.every(size => size === 3 || size === 4)).toBe(true);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(count * RACES_PER_PLAYER);
    }
  });
});

describe('generateSchedule', () => {
  it('gives every player exactly 3 races, never twice in the same race', () => {
    for (let count = 4; count <= 50; count++) {
      const races = generateSchedule(ids(count), seeded(count));
      for (const race of races) {
        expect(new Set(race.playerIds).size).toBe(race.playerIds.length);
      }
      for (const id of ids(count)) {
        expect(races.filter(r => r.playerIds.includes(id))).toHaveLength(RACES_PER_PLAYER);
      }
    }
  });

  it('avoids back-to-back races when there are enough players', () => {
    for (const count of [8, 10, 12, 16, 23, 30, 50]) {
      const races = generateSchedule(ids(count), seeded(count));
      expect(scheduleQuality(races.map(r => r.playerIds)).backToBack).toBe(0);
    }
  });

  it('gets everyone on track early instead of leaving some players waiting until the end', () => {
    const count = 50;
    const races = generateSchedule(ids(count), seeded(1));
    const firstRace = ids(count).map(id => races.findIndex(r => r.playerIds.includes(id)));
    // 50 players fill 4-player races, so everyone should have raced within the first ~13 GPs.
    expect(Math.max(...firstRace)).toBeLessThanOrEqual(13);
  });

  it('is deterministic for a given random source', () => {
    expect(generateSchedule(ids(12), seeded(42))).toEqual(generateSchedule(ids(12), seeded(42)));
  });
});
