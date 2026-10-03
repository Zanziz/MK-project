import { useEffect } from 'react';
import { ChampionshipView } from './components/ChampionshipView';
import { FinalView } from './components/FinalView';
import { Header } from './components/Header';
import { RegistrationView } from './components/RegistrationView';
import { SemiFinalsView } from './components/SemiFinalsView';
import { generateSchedule } from './domain/schedule';
import { canStartFinal, canStartPlayoffs } from './domain/tournament';
import type { RaceResults } from './domain/types';
import { useTournament } from './hooks/useTournament';

/** Text fields keep their native undo; checkboxes and buttons don't need it. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit'].includes(target.type)) ||
  (target instanceof HTMLElement && target.isContentEditable);

export const App = () => {
  const { state, dispatch, undo, canUndo } = useTournament();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !isTyping(e.target)) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo]);

  // Each phase is a new screen: start it from the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [state.phase]);

  const reset = () => {
    if (window.confirm('Start a new tournament? All racers and results will be deleted.')) dispatch({ type: 'RESET' });
  };
  const saveResult = (raceId: string, results: RaceResults) => dispatch({ type: 'RECORD_RESULT', raceId, results });

  return (
    <div className="flex min-h-dvh flex-col">
      <Header phase={state.phase} playerCount={state.players.length} canUndo={canUndo} onUndo={undo} onReset={reset} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {state.phase === 'REGISTRATION' && (
          <RegistrationView
            players={state.players}
            onAddPlayers={players => dispatch({ type: 'ADD_PLAYERS', players })}
            onRemovePlayer={playerId => dispatch({ type: 'REMOVE_PLAYER', playerId })}
            onStart={() =>
              dispatch({ type: 'START_CHAMPIONSHIP', schedule: generateSchedule(state.players.map(p => p.id)) })
            }
          />
        )}

        {state.phase === 'CHAMPIONSHIP' && (
          <ChampionshipView
            players={state.players}
            races={state.championship}
            canStartPlayoffs={canStartPlayoffs(state)}
            onSaveResult={saveResult}
            onStartPlayoffs={() => dispatch({ type: 'START_PLAYOFFS' })}
          />
        )}

        {state.phase === 'SEMI_FINALS' && state.semis && (
          <SemiFinalsView
            players={state.players}
            semis={state.semis}
            canStartFinal={canStartFinal(state)}
            onSaveResult={saveResult}
            onToggleQualifier={(semi, playerId) => dispatch({ type: 'TOGGLE_QUALIFIER', semi, playerId })}
            onStartFinal={() => dispatch({ type: 'START_FINAL' })}
          />
        )}

        {state.phase === 'FINALS' && (
          <FinalView players={state.players} races={state.final} onSaveResult={saveResult} onNewTournament={reset} />
        )}
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        MK Tournament Pro · results are saved in this browser · <kbd className="font-mono">Ctrl/⌘ Z</kbd> to undo
      </footer>
    </div>
  );
};
