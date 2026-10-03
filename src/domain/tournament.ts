import { areRacesComplete, createRaces, pickPlayers, positionErrors } from './races';
import {
  FINAL_RACES,
  FINALISTS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  QUALIFIERS_PER_SEMI,
  SEMI_RACES,
  hasSemiFinals,
} from './rules';
import { computeStandings, type Standing } from './standings';
import {
  SEMI_KEYS,
  type Player,
  type Race,
  type RaceResults,
  type SemiFinal,
  type SemiKey,
  type TournamentState,
} from './types';

export const initialState: TournamentState = {
  phase: 'REGISTRATION',
  players: [],
  championship: [],
  semis: null,
  final: [],
};

/** Championship seeds sent to each semi-final, in bracket order (balanced: both sum to 18). */
export const BRACKETS: Record<SemiKey, number[]> = { A: [1, 3, 6, 8], B: [2, 4, 5, 7] };

export type Action =
  | { type: 'ADD_PLAYERS'; players: Player[] }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'START_CHAMPIONSHIP'; schedule: Race[] }
  | { type: 'RECORD_RESULT'; raceId: string; results: RaceResults }
  | { type: 'START_PLAYOFFS' }
  | { type: 'TOGGLE_QUALIFIER'; semi: SemiKey; playerId: string }
  | { type: 'START_FINAL' }
  | { type: 'RESET' };

// --- Guards, shared by the reducer and the views ---

export const canStartChampionship = (state: TournamentState): boolean =>
  state.phase === 'REGISTRATION' && state.players.length >= MIN_PLAYERS;

export const canStartPlayoffs = (state: TournamentState): boolean =>
  state.phase === 'CHAMPIONSHIP' && areRacesComplete(state.championship);

export const canStartFinal = (state: TournamentState): boolean =>
  state.phase === 'SEMI_FINALS' &&
  state.semis !== null &&
  SEMI_KEYS.every(key => state.semis?.[key].qualifierIds.length === QUALIFIERS_PER_SEMI);

/** Pure state transitions. Invalid actions for the current phase return the state unchanged. */
export const tournamentReducer = (state: TournamentState, action: Action): TournamentState => {
  switch (action.type) {
    case 'ADD_PLAYERS': {
      if (state.phase !== 'REGISTRATION') return state;
      const room = MAX_PLAYERS - state.players.length;
      if (room <= 0 || action.players.length === 0) return state;
      return { ...state, players: [...state.players, ...action.players.slice(0, room)] };
    }

    case 'REMOVE_PLAYER':
      if (state.phase !== 'REGISTRATION') return state;
      return { ...state, players: state.players.filter(p => p.id !== action.playerId) };

    case 'START_CHAMPIONSHIP':
      if (!canStartChampionship(state)) return state;
      return { ...state, phase: 'CHAMPIONSHIP', championship: action.schedule };

    case 'RECORD_RESULT':
      return recordResult(state, action.raceId, action.results);

    case 'START_PLAYOFFS':
      return startPlayoffs(state);

    case 'TOGGLE_QUALIFIER':
      return toggleQualifier(state, action.semi, action.playerId);

    case 'START_FINAL':
      if (!canStartFinal(state) || !state.semis) return state;
      return toFinal(state, [...state.semis.A.qualifierIds, ...state.semis.B.qualifierIds]);

    case 'RESET':
      return initialState;
  }
};

const toFinal = (state: TournamentState, finalists: string[]): TournamentState => ({
  ...state,
  phase: 'FINALS',
  final: createRaces('final', 'Final GP', repeatLineup(finalists, FINAL_RACES)),
});

/** The same players for `count` races, each race with its own array. */
const repeatLineup = (playerIds: string[], count: number): string[][] =>
  Array.from({ length: count }, () => [...playerIds]);

const withResults = (races: Race[], raceId: string, results: RaceResults): Race[] =>
  races.map(race => (race.id === raceId ? { ...race, results } : race));

/** Races whose results can be edited in the current phase. */
const editableRaces = (state: TournamentState): Race[] => {
  switch (state.phase) {
    case 'CHAMPIONSHIP':
      return state.championship;
    case 'SEMI_FINALS':
      return SEMI_KEYS.flatMap(key => state.semis?.[key].races ?? []);
    case 'FINALS':
      return state.final;
    default:
      return [];
  }
};

const recordResult = (state: TournamentState, raceId: string, input: RaceResults): TournamentState => {
  const race = editableRaces(state).find(r => r.id === raceId);
  if (!race || Object.keys(positionErrors(race, input, true)).length > 0) return state;
  // Saving identical results must not add a no-op step to the undo history.
  if (race.playerIds.every(id => race.results[id] === input[id])) return state;
  // Store positions for this race's players only: standings credit any id found in `results`.
  const results: RaceResults = Object.fromEntries(race.playerIds.map(id => [id, input[id] ?? 0]));

  switch (state.phase) {
    case 'CHAMPIONSHIP':
      return { ...state, championship: withResults(state.championship, raceId, results) };

    case 'SEMI_FINALS': {
      const key = SEMI_KEYS.find(k => state.semis?.[k].races.some(r => r.id === raceId));
      if (!state.semis || !key) return state;
      const semi = state.semis[key];
      const races = withResults(semi.races, raceId, results);
      const top = (stageRaces: Race[]) =>
        stageStandings(state.players, semi.playerIds, stageRaces)
          .slice(0, QUALIFIERS_PER_SEMI)
          .map(s => s.player.id);
      // Pre-select the top of the session once it is over, and follow later corrections,
      // unless the admin has already changed the selection (e.g. after a tie-breaker).
      const wasPreselected = !areRacesComplete(semi.races) || sameMembers(semi.qualifierIds, top(semi.races));
      const qualifierIds = !areRacesComplete(races) ? [] : wasPreselected ? top(races) : semi.qualifierIds;
      return { ...state, semis: { ...state.semis, [key]: { ...semi, races, qualifierIds } } };
    }

    case 'FINALS':
      return { ...state, final: withResults(state.final, raceId, results) };

    default:
      return state;
  }
};

const startPlayoffs = (state: TournamentState): TournamentState => {
  if (!canStartPlayoffs(state)) return state;
  const ranked = computeStandings(state.players, state.championship).map(s => s.player.id);

  if (!hasSemiFinals(state.players.length)) return toFinal(state, ranked.slice(0, FINALISTS));

  const semi = (key: SemiKey): SemiFinal => {
    const playerIds = BRACKETS[key].flatMap(seed => ranked[seed - 1] ?? []);
    return {
      playerIds,
      races: createRaces(`semi-${key}`, `Semi ${key} · GP`, repeatLineup(playerIds, SEMI_RACES)),
      qualifierIds: [],
    };
  };

  return { ...state, phase: 'SEMI_FINALS', semis: { A: semi('A'), B: semi('B') } };
};

const toggleQualifier = (state: TournamentState, key: SemiKey, playerId: string): TournamentState => {
  const semi = state.semis?.[key];
  if (state.phase !== 'SEMI_FINALS' || !state.semis || !semi || !areRacesComplete(semi.races)) return state;
  if (!semi.playerIds.includes(playerId)) return state;

  const selected = semi.qualifierIds.includes(playerId);
  if (!selected && semi.qualifierIds.length >= QUALIFIERS_PER_SEMI) return state;
  const qualifierIds = selected ? semi.qualifierIds.filter(id => id !== playerId) : [...semi.qualifierIds, playerId];
  return { ...state, semis: { ...state.semis, [key]: { ...semi, qualifierIds } } };
};

const sameMembers = (a: string[], b: string[]): boolean => a.length === b.length && a.every(id => b.includes(id));

/** Standings of a semi-final or final: only its own players, only its own races. */
export const stageStandings = (players: Player[], playerIds: string[], races: Race[]): Standing[] =>
  computeStandings(pickPlayers(players, playerIds), races);
