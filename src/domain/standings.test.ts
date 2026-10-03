import { describe, expect, it } from 'vitest';
import { computeStandings, leader } from './standings';
import type { Player, Race } from './types';

const player = (id: string): Player => ({ id, firstName: id, gamerTag: id });

const race = (id: string, results: Record<string, number>): Race => ({
  id,
  name: id,
  playerIds: Object.keys(results),
  results,
});

describe('computeStandings', () => {
  it('sums points per position', () => {
    const standings = computeStandings(
      [player('a'), player('b')],
      [race('r1', { a: 1, b: 2 }), race('r2', { a: 13, b: 1 })],
    );
    expect(standings.map(s => [s.player.id, s.points, s.racesPlayed])).toEqual([
      ['b', 27, 2],
      ['a', 15, 2],
    ]);
  });

  it('breaks equal points on best finishes, regardless of registration order', () => {
    // Same 18 points: daisy finished 2nd, 6th, 12th; rosalina 1st, 10th, 11th.
    const players = [player('daisy'), player('rosalina')];
    const races = [
      race('r1', { daisy: 2, rosalina: 1 }),
      race('r2', { daisy: 6, rosalina: 10 }),
      race('r3', { daisy: 12, rosalina: 11 }),
    ];
    const standings = computeStandings(players, races);
    expect(standings.map(s => [s.player.id, s.points, s.rank])).toEqual([
      ['rosalina', 18, 1],
      ['daisy', 18, 2],
    ]);
  });

  it('shares the rank on an exact tie, flags it and keeps registration order', () => {
    const standings = computeStandings(
      [player('a'), player('b'), player('c')],
      [race('r1', { a: 2, c: 1 }), race('r2', { b: 2 })],
    );
    expect(standings.map(s => [s.player.id, s.rank, s.tied])).toEqual([
      ['c', 1, false],
      ['a', 2, true],
      ['b', 2, true],
    ]);
  });

  it('only names an outright leader', () => {
    const [a, b] = [player('a'), player('b')];
    expect(leader(computeStandings([a, b], []))).toBeNull();
    expect(leader(computeStandings([a, b], [race('r1', { a: 2, b: 1 })]))?.player.id).toBe('b');
    expect(leader(computeStandings([a, b], [race('r1', { a: 1 }), race('r2', { b: 1 })]))).toBeNull();
  });

  it('includes players who have not raced yet', () => {
    const standings = computeStandings([player('a'), player('b')], [race('r1', { a: 1 })]);
    expect(standings.at(-1)).toMatchObject({ player: { id: 'b' }, points: 0, racesPlayed: 0, rank: null });
  });
});
