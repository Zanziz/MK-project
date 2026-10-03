import { MAX_PLAYERS } from './rules';
import type { Player } from './types';

export interface PlayerDraft {
  firstName: string;
  gamerTag: string;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

/** Trims inputs and falls back to the first name when no gamer tag is given. */
export const toDraft = (firstName: string, gamerTag: string): PlayerDraft => {
  const name = normalize(firstName);
  return { firstName: name, gamerTag: normalize(gamerTag) || name };
};

/** Returns why a racer cannot be registered, or null when it can. */
export const registrationError = (existing: Pick<Player, 'gamerTag'>[], draft: PlayerDraft): string | null => {
  if (!draft.firstName) return 'First name is required.';
  if (existing.length >= MAX_PLAYERS) return `The tournament is full (${MAX_PLAYERS} racers).`;
  const tag = draft.gamerTag.toLocaleLowerCase();
  if (existing.some(p => p.gamerTag.toLocaleLowerCase() === tag)) return `“${draft.gamerTag}” is already taken.`;
  return null;
};

/**
 * Parses one racer per line: `First name, Gamer tag` (the tag is optional; tabs and semicolons also work).
 * Blank lines and `#` comments are ignored.
 */
export const parseRacerList = (
  text: string,
  existing: Pick<Player, 'gamerTag'>[],
): { accepted: PlayerDraft[]; rejected: { line: string; reason: string }[] } => {
  const accepted: PlayerDraft[] = [];
  const rejected: { line: string; reason: string }[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const [firstName = '', gamerTag = ''] = line.split(/[,;\t]/);
    const draft = toDraft(firstName, gamerTag);
    const reason = registrationError([...existing, ...accepted], draft);
    if (reason) rejected.push({ line: line.trim(), reason });
    else accepted.push(draft);
  }

  return { accepted, rejected };
};

const HEADER_WORDS = /\b(first|name|pr[ée]nom|tag)\b/i;

/** Drops the column header of an exported CSV (e.g. `Prénom,GamerTag`), keeping the racer lines. */
export const dropCsvHeader = (text: string): string => {
  const lines = text.split(/\r?\n/);
  return HEADER_WORDS.test(lines[0] ?? '') ? lines.slice(1).join('\n') : text;
};

/**
 * Random 128-bit hex id. Not crypto.randomUUID(): it only exists in secure contexts,
 * and the app is meant to be opened over plain HTTP from a phone on the local network.
 */
const newId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');

export const createPlayer = (draft: PlayerDraft): Player => ({ id: newId(), ...draft });
