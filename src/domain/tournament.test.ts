import { describe, expect, it } from 'vitest';
import { withHistory, type History } from './history';
import { isTournamentState } from './storage';
import { leader } from './standings';
import { initialState, stageStandings, tournamentReducer, type Action } from './tournament';
import type { Player, Race, TournamentState } from './types';

const players = (count: number): Player[] =>
  Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, firstName: `P${i + 1}`, gamerTag: `Tag${i + 1}` }));

const run = (state: TournamentState, ...actions: Action[]) => actions.reduce(tournamentReducer, state);

/** One race per player, finishing in registration order (p1 wins, p2 second…). */
const scheduleInOrder = (list: Player[]): Race[] =>
  list.map((p, i) => ({ id: `gp-${i + 1}`, name: `GP ${i + 1}`, playerIds: [p.id], results: {} }));

const finishChampionship = (count: number): TournamentState => {
  const list = players(count);
  const schedule = scheduleInOrder(list);
  return run(
    initialState,
    { type: 'ADD_PLAYERS', players: list },
    { type: 'START_CHAMPIONSHIP', schedule },
    ...schedule.map((race, i): Action => ({
      type: 'RECORD_RESULT',
      raceId: race.id,
      results: { [race.playerIds[0]!]: i + 1 },
    })),
  );
};

const champion = (state: TournamentState) =>
  leader(stageStandings(state.players, state.final[0]?.playerIds ?? [], state.final));

/** Records each race so that players finish in the order given. */
const recordInOrder = (state: TournamentState, races: Race[], order: string[]): TournamentState =>
  run(
    state,
    ...races.map((race): Action => ({
      type: 'RECORD_RESULT',
      raceId: race.id,
      results: Object.fromEntries(race.playerIds.map(id => [id, order.indexOf(id) + 1])),
    })),
  );

describe('tournamentReducer', () => {
  it('ignores actions that do not fit the current phase', () => {
    expect(tournamentReducer(initialState, { type: 'START_PLAYOFFS' })).toBe(initialState);
    const two = run(initialState, { type: 'ADD_PLAYERS', players: players(2) });
    expect(tournamentReducer(two, { type: 'START_CHAMPIONSHIP', schedule: [] })).toBe(two);
  });

  it('caps registration at 50 players', () => {
    const state = run(initialState, { type: 'ADD_PLAYERS', players: players(60) });
    expect(state.players).toHaveLength(50);
  });

  it('cannot start the playoffs before every championship race is in', () => {
    const list = players(8);
    const state = run(
      initialState,
      { type: 'ADD_PLAYERS', players: list },
      { type: 'START_CHAMPIONSHIP', schedule: scheduleInOrder(list) },
    );
    expect(tournamentReducer(state, { type: 'START_PLAYOFFS' })).toBe(state);
  });

  it('seeds balanced semi-finals from the championship standings', () => {
    const state = tournamentReducer(finishChampionship(10), { type: 'START_PLAYOFFS' });
    expect(state.phase).toBe('SEMI_FINALS');
    expect(state.semis?.A.playerIds).toEqual(['p1', 'p3', 'p6', 'p8']);
    expect(state.semis?.B.playerIds).toEqual(['p2', 'p4', 'p5', 'p7']);
    expect(state.semis?.A.races).toHaveLength(2);
  });

  it('goes straight to a 4-player final with fewer than 8 players', () => {
    const state = tournamentReducer(finishChampionship(6), { type: 'START_PLAYOFFS' });
    expect(state.phase).toBe('FINALS');
    expect(state.semis).toBeNull();
    expect(state.final).toHaveLength(3);
    expect(state.final[0]?.playerIds).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('pre-selects the top 2 of a finished semi-final and lets the admin swap them', () => {
    let state = tournamentReducer(finishChampionship(8), { type: 'START_PLAYOFFS' });
    const semiA = state.semis!.A;
    state = recordInOrder(state, semiA.races, ['p8', 'p6', 'p3', 'p1']);
    expect(state.semis?.A.qualifierIds).toEqual(['p8', 'p6']);

    // A third pick is refused until one is removed.
    expect(tournamentReducer(state, { type: 'TOGGLE_QUALIFIER', semi: 'A', playerId: 'p3' })).toBe(state);
    state = run(
      state,
      { type: 'TOGGLE_QUALIFIER', semi: 'A', playerId: 'p6' },
      { type: 'TOGGLE_QUALIFIER', semi: 'A', playerId: 'p3' },
    );
    expect(state.semis?.A.qualifierIds).toEqual(['p8', 'p3']);

    // Correcting a result afterwards keeps the admin's choice…
    const [gp1] = state.semis!.A.races as [Race];
    const corrected = tournamentReducer(state, {
      type: 'RECORD_RESULT',
      raceId: gp1.id,
      results: { p8: 1, p6: 2, p3: 3, p1: 5 },
    });
    expect(corrected).not.toBe(state);
    expect(corrected.semis?.A.qualifierIds).toEqual(['p8', 'p3']);
  });

  it('follows result corrections while the pre-selection is untouched', () => {
    let state = tournamentReducer(finishChampionship(8), { type: 'START_PLAYOFFS' });
    const [gp1, gp2] = state.semis!.A.races as [Race, Race];
    state = recordInOrder(state, [gp1, gp2], ['p8', 'p6', 'p3', 'p1']);
    state = tournamentReducer(state, {
      type: 'RECORD_RESULT',
      raceId: gp2.id,
      results: { p1: 1, p3: 2, p6: 3, p8: 4 },
    });
    // p1 and p8 now share 1st (a 1st and a 4th each, ahead on seed order); p6 drops out.
    expect(state.semis?.A.qualifierIds).toEqual(['p1', 'p8']);
  });

  it('crowns the champion of the final, but not on an exact tie', () => {
    let state = tournamentReducer(finishChampionship(8), { type: 'START_PLAYOFFS' });
    state = recordInOrder(state, state.semis!.A.races, ['p1', 'p3', 'p6', 'p8']);
    state = recordInOrder(state, state.semis!.B.races, ['p2', 'p4', 'p5', 'p7']);
    state = tournamentReducer(state, { type: 'START_FINAL' });
    expect(state.phase).toBe('FINALS');
    expect(state.final[0]?.playerIds).toEqual(['p1', 'p3', 'p2', 'p4']);

    const [r1, r2, r3] = state.final as [Race, Race, Race];
    const decided = recordInOrder(state, [r1, r2, r3], ['p4', 'p1', 'p2', 'p3']);
    expect(champion(decided)?.player.id).toBe('p4');

    // p1 and p3 both finish 1st, 2nd and 3rd once: level on points and on countback.
    const tied = run(
      state,
      { type: 'RECORD_RESULT', raceId: r1.id, results: { p1: 1, p3: 2, p2: 5, p4: 6 } },
      { type: 'RECORD_RESULT', raceId: r2.id, results: { p1: 2, p3: 3, p2: 5, p4: 6 } },
      { type: 'RECORD_RESULT', raceId: r3.id, results: { p1: 3, p3: 1, p2: 5, p4: 6 } },
    );
    expect(champion(tied)).toBeNull();
  });

  it('rejects results for unknown races, missing players, shared or out-of-range positions', () => {
    const state = finishChampionship(4);
    expect(tournamentReducer(state, { type: 'RECORD_RESULT', raceId: 'nope', results: {} })).toBe(state);
    expect(tournamentReducer(state, { type: 'RECORD_RESULT', raceId: 'gp-1', results: {} })).toBe(state);
    expect(tournamentReducer(state, { type: 'RECORD_RESULT', raceId: 'gp-1', results: { p1: 25 } })).toBe(state);

    const semis = tournamentReducer(finishChampionship(8), { type: 'START_PLAYOFFS' });
    const race = semis.semis!.A.races[0]!;
    const shared = Object.fromEntries(race.playerIds.map(id => [id, 1]));
    expect(tournamentReducer(semis, { type: 'RECORD_RESULT', raceId: race.id, results: shared })).toBe(semis);
  });

  it('only stores positions for the players of the race', () => {
    const state = finishChampionship(4);
    const next = tournamentReducer(state, { type: 'RECORD_RESULT', raceId: 'gp-1', results: { p1: 2, p9: 1 } });
    expect(next.championship[0]?.results).toEqual({ p1: 2 });
  });

  it('ignores a save that does not change anything, so undo never gets an empty step', () => {
    const state = finishChampionship(4);
    expect(tournamentReducer(state, { type: 'RECORD_RESULT', raceId: 'gp-1', results: { p1: 1 } })).toBe(state);
  });
});

describe('withHistory', () => {
  const reducer = withHistory(tournamentReducer);

  it('replaces the state from another tab and drops the undo stack', () => {
    const other = finishChampionship(4);
    let history: History<TournamentState> = { past: [], present: initialState };
    history = reducer(history, { type: 'ADD_PLAYERS', players: players(1) });
    history = reducer(history, { type: 'REPLACE', present: other });
    expect(history).toEqual({ past: [], present: other });
  });

  it('undoes the last change and skips no-op actions', () => {
    let history: History<TournamentState> = { past: [], present: initialState };
    history = reducer(history, { type: 'ADD_PLAYERS', players: players(1) });
    history = reducer(history, { type: 'START_PLAYOFFS' }); // no-op
    expect(history.past).toHaveLength(1);
    history = reducer(history, { type: 'UNDO' });
    expect(history.present).toBe(initialState);
    expect(reducer(history, { type: 'UNDO' })).toBe(history);
  });
});

describe('isTournamentState', () => {
  it('accepts a real tournament and rejects malformed data', () => {
    expect(isTournamentState(finishChampionship(5))).toBe(true);
    expect(isTournamentState({ ...initialState, phase: 'COMPLETED' })).toBe(false);
    expect(isTournamentState({ ...initialState, players: [{ id: 1 }] })).toBe(false);
    // Shapes are right but the phase has nothing to show.
    expect(isTournamentState({ ...initialState, phase: 'SEMI_FINALS' })).toBe(false);
    expect(isTournamentState({ ...initialState, phase: 'FINALS' })).toBe(false);
    expect(isTournamentState(null)).toBe(false);
  });
});
