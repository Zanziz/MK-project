const MAX_UNDO = 50;

export interface History<S> {
  past: S[];
  present: S;
}

/** UNDO steps back; REPLACE swaps in a state from elsewhere (another tab) and clears the undo stack. */
export type HistoryAction<A, S> = A | { type: 'UNDO' } | { type: 'REPLACE'; present: S };

/** Wraps a reducer with an undo stack. Actions that leave the state untouched are not recorded. */
export const withHistory =
  <S, A extends { type: string }>(reducer: (state: S, action: A) => S) =>
  (history: History<S>, action: HistoryAction<A, S>): History<S> => {
    if (action.type === 'UNDO') {
      const previous = history.past.at(-1);
      return previous === undefined ? history : { past: history.past.slice(0, -1), present: previous };
    }
    if (action.type === 'REPLACE' && 'present' in action) return { past: [], present: action.present };
    const present = reducer(history.present, action as A);
    if (present === history.present) return history;
    return { past: [...history.past, history.present].slice(-MAX_UNDO), present };
  };
