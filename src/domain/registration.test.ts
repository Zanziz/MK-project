import { describe, expect, it } from 'vitest';
import { createPlayer, dropCsvHeader, parseRacerList, registrationError, toDraft } from './registration';

describe('registration', () => {
  it('trims names and defaults the gamer tag to the first name', () => {
    expect(toDraft('  Alice   Martin ', '   ')).toEqual({ firstName: 'Alice Martin', gamerTag: 'Alice Martin' });
  });

  it('rejects blank names and duplicate gamer tags (case-insensitive)', () => {
    expect(registrationError([], toDraft('   ', 'Turbo'))).toMatch(/required/);
    expect(registrationError([{ gamerTag: 'Turbo' }], toDraft('Bob', 'turbo'))).toMatch(/already taken/);
    expect(registrationError([{ gamerTag: 'Turbo' }], toDraft('Bob', 'Nitro'))).toBeNull();
  });

  it('creates unique ids without crypto.randomUUID (missing over plain HTTP)', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createPlayer(toDraft('A', '')).id));
    expect(ids.size).toBe(100);
    expect([...ids].every(id => /^[0-9a-f]{32}$/.test(id))).toBe(true);
  });

  it('drops a CSV header and ignores # comments', () => {
    expect(dropCsvHeader('Prénom,GamerTag\nMario,Speed')).toBe('Mario,Speed');
    expect(dropCsvHeader('first_name;tag\r\nMario;Speed')).toBe('Mario;Speed');
    expect(dropCsvHeader('Mario,Speed\nLuigi,Green')).toBe('Mario,Speed\nLuigi,Green');
    expect(parseRacerList('# racers\nMario, Speed', []).accepted).toEqual([{ firstName: 'Mario', gamerTag: 'Speed' }]);
  });

  it('parses a pasted list and reports skipped lines', () => {
    const { accepted, rejected } = parseRacerList('Alice, Turbo\n\nBob;Nitro\nCarol\nDave, turbo\n', [
      { gamerTag: 'Existing' },
    ]);
    expect(accepted).toEqual([
      { firstName: 'Alice', gamerTag: 'Turbo' },
      { firstName: 'Bob', gamerTag: 'Nitro' },
      { firstName: 'Carol', gamerTag: 'Carol' },
    ]);
    expect(rejected).toEqual([{ line: 'Dave, turbo', reason: '“turbo” is already taken.' }]);
  });
});
