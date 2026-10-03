import { useCallback, useEffect, useReducer } from 'react';
import { withHistory } from '../domain/history';
import { loadState, onStateSavedElsewhere, saveState } from '../domain/storage';
import { initialState, tournamentReducer, type Action } from '../domain/tournament';

const reducer = withHistory(tournamentReducer);

/** Tournament state persisted to localStorage, with an in-memory undo stack. */
export const useTournament = () => {
  const [history, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: loadState() ?? initialState,
  }));

  useEffect(() => {
    saveState(history.present);
  }, [history.present]);

  // Keep several open tabs (e.g. one on the TV) in sync instead of overwriting each other.
  useEffect(() => onStateSavedElsewhere(present => dispatch({ type: 'REPLACE', present })), []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);

  return {
    state: history.present,
    dispatch: dispatch as (action: Action) => void,
    undo,
    canUndo: history.past.length > 0,
  };
};
