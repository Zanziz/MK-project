import { MAX_POSITION } from './rules';
import type { Player, Race, RaceResults } from './types';

export const isRaceComplete = (race: Race): boolean =>
  race.playerIds.length > 0 && race.playerIds.every(id => race.results[id] !== undefined);

export const areRacesComplete = (races: Race[]): boolean => races.length > 0 && races.every(isRaceComplete);

/** One race per lineup, numbered from 1. */
export const createRaces = (idPrefix: string, namePrefix: string, lineups: string[][]): Race[] =>
  lineups.map((playerIds, i) => ({
    id: `${idPrefix}-${i + 1}`,
    name: `${namePrefix} ${i + 1}`,
    playerIds,
    results: {},
  }));

/** Resolves ids to players, skipping unknown ids. */
export const pickPlayers = (players: Player[], ids: string[]): Player[] => {
  const byId = new Map(players.map(p => [p.id, p]));
  return ids.flatMap(id => byId.get(id) ?? []);
};

export type ResultErrors = Record<string, string>;

/**
 * Per-player problems with a race's positions: out of range, shared with another racer,
 * or missing (only when `requireAll` is set, so a form can validate while the user types).
 */
export const positionErrors = (race: Race, positions: Partial<RaceResults>, requireAll: boolean): ResultErrors => {
  const errors: ResultErrors = {};
  const seen = new Map<number, string>();

  for (const id of race.playerIds) {
    const position = positions[id];
    if (position === undefined) {
      if (requireAll) errors[id] = 'Required';
    } else if (!Number.isInteger(position) || position < 1 || position > MAX_POSITION) {
      errors[id] = `1–${MAX_POSITION}`;
    } else {
      const other = seen.get(position);
      if (other !== undefined) errors[id] = errors[other] = 'Duplicate';
      seen.set(position, id);
    }
  }
  return errors;
};

/** Parses raw form inputs; `results` is set only when every position is present and valid. */
export const validateResults = (
  race: Race,
  inputs: Record<string, string>,
  requireAll: boolean,
): { results?: RaceResults; errors: ResultErrors } => {
  const positions: Partial<RaceResults> = {};
  for (const id of race.playerIds) {
    const raw = (inputs[id] ?? '').trim();
    if (raw !== '') positions[id] = Number(raw);
  }
  const errors = positionErrors(race, positions, requireAll);
  const complete = race.playerIds.every(id => positions[id] !== undefined);
  return Object.keys(errors).length === 0 && complete ? { results: positions as RaceResults, errors } : { errors };
};
