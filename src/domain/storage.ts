import { PHASES, type Phase, type Player, type Race, type SemiFinal, type TournamentState } from './types';

const STORAGE_KEY = 'mk-tournament/v2';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isPlayer = (value: unknown): value is Player =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.firstName === 'string' &&
  typeof value.gamerTag === 'string';

const isRace = (value: unknown): value is Race =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isStringArray(value.playerIds) &&
  isObject(value.results) &&
  Object.values(value.results).every(position => Number.isInteger(position));

const isSemiFinal = (value: unknown): value is SemiFinal =>
  isObject(value) &&
  isStringArray(value.playerIds) &&
  isStringArray(value.qualifierIds) &&
  Array.isArray(value.races) &&
  value.races.every(isRace);

/** The data each phase needs to be displayed. */
const isConsistent = (state: TournamentState): boolean =>
  (state.phase !== 'CHAMPIONSHIP' || state.championship.length > 0) &&
  (state.phase !== 'SEMI_FINALS' || state.semis !== null) &&
  (state.phase !== 'FINALS' || state.final.length > 0);

export const isTournamentState = (value: unknown): value is TournamentState =>
  isObject(value) &&
  PHASES.includes(value.phase as Phase) &&
  Array.isArray(value.players) &&
  value.players.every(isPlayer) &&
  Array.isArray(value.championship) &&
  value.championship.every(isRace) &&
  (value.semis === null || (isObject(value.semis) && isSemiFinal(value.semis.A) && isSemiFinal(value.semis.B))) &&
  Array.isArray(value.final) &&
  value.final.every(isRace) &&
  isConsistent(value as unknown as TournamentState);

const parseState = (raw: string | null): TournamentState | null => {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    return isTournamentState(data) ? data : null;
  } catch {
    return null;
  }
};

/** Returns the saved tournament, or null when nothing valid is stored. */
export const loadState = (): TournamentState | null => {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

/** Calls `listener` when another tab saves the tournament. Returns the unsubscribe function. */
export const onStateSavedElsewhere = (listener: (state: TournamentState) => void): (() => void) => {
  const handleStorage = (event: StorageEvent) => {
    const state = event.key === STORAGE_KEY ? parseState(event.newValue) : null;
    if (state) listener(state);
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};

export const saveState = (state: TournamentState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or disabled (private mode): the tournament keeps running in memory.
  }
};
