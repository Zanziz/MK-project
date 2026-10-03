import { describe, expect, it } from 'vitest';
import { validateResults } from './races';
import type { Race } from './types';

const race: Race = { id: 'r', name: 'GP', playerIds: ['a', 'b', 'c'], results: {} };

describe('validateResults', () => {
  it('returns parsed results when every position is valid', () => {
    expect(validateResults(race, { a: '3', b: ' 1 ', c: '12' }, true)).toEqual({
      results: { a: 3, b: 1, c: 12 },
      errors: {},
    });
  });

  it('flags both players sharing a position', () => {
    const { results, errors } = validateResults(race, { a: '2', b: '2', c: '1' }, true);
    expect(results).toBeUndefined();
    expect(errors).toEqual({ a: 'Duplicate', b: 'Duplicate' });
  });

  it('rejects out-of-range or non-integer positions', () => {
    const { errors } = validateResults(race, { a: '0', b: '25', c: '1.5' }, true);
    expect(Object.keys(errors).sort()).toEqual(['a', 'b', 'c']);
  });

  it('reports empty fields only when every result is required', () => {
    expect(validateResults(race, { a: '1' }, false)).toEqual({ errors: {} });
    expect(validateResults(race, { a: '1' }, true).errors).toEqual({ b: 'Required', c: 'Required' });
  });
});
