import React, { useState, useEffect } from 'react';
import { Phase, PHASE_ORDER, Player, Race, TournamentState, getPoints, RaceContext } from './types';
import { generateChampionshipSchedule, getQualifiers } from './utils/scheduler';
import { RegistrationView } from './components/RegistrationView';
import { ChampionshipView } from './components/ChampionshipView';
import { SemiFinalsView } from './components/SemiFinalsView';
import { FinalsView } from './components/FinalsView';
import { Flag, ArrowRight } from 'lucide-react';

const INITIAL_STATE: TournamentState = {
  phase: Phase.REGISTRATION,
  players: [],
  championshipRaces: [],
  semiFinals: {
    session1: { id: 's1', name: 'Semi-Final A', playerIds: [], races: [], manualQualifiers: [] },
    session2: { id: 's2', name: 'Semi-Final B', playerIds: [], races: [], manualQualifiers: [] }
  },
  finalRaces: []
};

function App() {
  const [state, setState] = useState<TournamentState>(() => {
    try {
      const saved = localStorage.getItem('mk_tournament_state');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('mk_tournament_state', JSON.stringify(state));
  }, [state]);

  // --- Actions ---

  const addPlayer = (firstName: string, gamerTag: string) => {
    if (state.players.length >= 50) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      firstName,
      gamerTag,
      score: 0,
      racesPlayed: 0,
      positions: []
    };
    setState(s => ({ ...s, players: [...s.players, newPlayer] }));
  };

  const removePlayer = (id: string) => {
    setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) }));
  };

  const startChampionship = () => {
    if (state.players.length < 4) {
      alert("Need at least 4 players to start.");
      return;
    }
    const schedule = generateChampionshipSchedule(state.players);
    setState(s => ({
      ...s,
      phase: Phase.CHAMPIONSHIP,
      championshipRaces: schedule
    }));
  };

  const updateRaceResult = (raceId: string, results: Record<string, number>, context: RaceContext) => {
    setState(prev => {
      let newChampionshipRaces = [...prev.championshipRaces];
      let newSemiFinals = { ...prev.semiFinals };
      let newFinalRaces = [...prev.finalRaces];

      // Update the specific race based on context
      if (context.type === 'championship') {
        newChampionshipRaces = newChampionshipRaces.map(r =>
          r.id === raceId ? { ...r, results, isCompleted: true } : r
        );
      } else if (context.type === 'semi') {
        newSemiFinals[context.sessionId] = {
          ...newSemiFinals[context.sessionId],
          races: newSemiFinals[context.sessionId].races.map(r =>
            r.id === raceId ? { ...r, results, isCompleted: true } : r
          )
        };
      } else if (context.type === 'final') {
        newFinalRaces = newFinalRaces.map(r =>
          r.id === raceId ? { ...r, results, isCompleted: true } : r
        );
      }

      // Recalculate ALL championship scores from scratch for accuracy (handles edits too)
      const recalculatedPlayers = prev.players.map(p => {
        let score = 0;
        let played = 0;
        const positions: number[] = [];

        if (PHASE_ORDER[prev.phase] >= PHASE_ORDER[Phase.CHAMPIONSHIP]) {
          newChampionshipRaces.forEach((r: Race) => {
            if (r.results[p.id]) {
              score += getPoints(r.results[p.id]);
              played++;
              positions.push(r.results[p.id]);
            }
          });
        }

        return { ...p, score, racesPlayed: played, positions };
      });

      return {
        ...prev,
        players: recalculatedPlayers,
        championshipRaces: newChampionshipRaces,
        semiFinals: newSemiFinals,
        finalRaces: newFinalRaces
      };
    });
  };

  const startSemiFinals = () => {
    const qualifiers = getQualifiers(state.players);

    // Seeding: S1 = [1st, 8th, 3rd, 6th], S2 = [2nd, 7th, 4th, 5th]
    const s1Players = [qualifiers[0], qualifiers[7], qualifiers[2], qualifiers[5]]
      .filter(Boolean)
      .map(p => p.id);
    const s2Players = [qualifiers[1], qualifiers[6], qualifiers[3], qualifiers[4]]
      .filter(Boolean)
      .map(p => p.id);

    const createSemiRaces = (prefix: string, pIds: string[]) => [
      { id: `${prefix}-gp1`, name: 'Semi GP 1', playerIds: pIds, results: {}, isCompleted: false },
      { id: `${prefix}-gp2`, name: 'Semi GP 2', playerIds: pIds, results: {}, isCompleted: false }
    ];

    setState(s => ({
      ...s,
      phase: Phase.SEMI_FINALS,
      semiFinals: {
        session1: { ...s.semiFinals.session1, playerIds: s1Players, races: createSemiRaces('s1', s1Players) },
        session2: { ...s.semiFinals.session2, playerIds: s2Players, races: createSemiRaces('s2', s2Players) }
      }
    }));
  };

  const toggleSemiQualifier = (sessionId: 'session1' | 'session2', playerId: string) => {
    setState(s => {
      const session = s.semiFinals[sessionId];
      const isSelected = session.manualQualifiers.includes(playerId);
      const newQualifiers = isSelected
        ? session.manualQualifiers.filter(id => id !== playerId)
        : [...session.manualQualifiers, playerId];

      if (newQualifiers.length > 2) return s;

      return {
        ...s,
        semiFinals: {
          ...s.semiFinals,
          [sessionId]: { ...session, manualQualifiers: newQualifiers }
        }
      };
    });
  };

  const startFinals = () => {
    const q1 = state.semiFinals.session1.manualQualifiers;
    const q2 = state.semiFinals.session2.manualQualifiers;

    if (q1.length !== 2 || q2.length !== 2) {
      alert("Please select exactly 2 qualifiers from each Semi-Final session.");
      return;
    }

    const finalPlayers = [...q1, ...q2];
    const finalRaces = [
      { id: 'f-gp1', name: 'Final GP 1', playerIds: finalPlayers, results: {}, isCompleted: false },
      { id: 'f-gp2', name: 'Final GP 2', playerIds: finalPlayers, results: {}, isCompleted: false },
      { id: 'f-gp3', name: 'Final GP 3', playerIds: finalPlayers, results: {}, isCompleted: false }
    ];

    setState(s => ({ ...s, phase: Phase.FINALS, finalRaces }));
  };

  const resetTournament = () => {
    if (confirm("Are you sure? All data will be lost.")) {
      setState(INITIAL_STATE);
    }
  };

  // --- Main Layout ---

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="text-red-500 fill-current" />
            <span className="font-gaming text-white tracking-tighter">MK<span className="text-red-500">PRO</span></span>
          </div>
          <nav className="flex items-center gap-4 text-xs md:text-sm font-medium text-gray-400" aria-label="Tournament phases">
            <span className={state.phase === Phase.REGISTRATION ? 'text-white' : ''}>Registration</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span className={state.phase === Phase.CHAMPIONSHIP ? 'text-white' : ''}>Championship</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span className={state.phase === Phase.SEMI_FINALS ? 'text-white' : ''}>Semis</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span className={state.phase === Phase.FINALS ? 'text-white' : ''}>Finals</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {state.phase === Phase.REGISTRATION && (
          <RegistrationView
            players={state.players}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onStartChampionship={startChampionship}
          />
        )}
        {state.phase === Phase.CHAMPIONSHIP && (
          <ChampionshipView
            players={state.players}
            championshipRaces={state.championshipRaces}
            onUpdateRaceResult={updateRaceResult}
            onStartSemiFinals={startSemiFinals}
          />
        )}
        {state.phase === Phase.SEMI_FINALS && (
          <SemiFinalsView
            players={state.players}
            session1={state.semiFinals.session1}
            session2={state.semiFinals.session2}
            onUpdateRaceResult={updateRaceResult}
            onToggleSemiQualifier={toggleSemiQualifier}
            onStartFinals={startFinals}
          />
        )}
        {state.phase === Phase.FINALS && (
          <FinalsView
            players={state.players}
            finalRaces={state.finalRaces}
            onUpdateRaceResult={updateRaceResult}
            onResetTournament={resetTournament}
          />
        )}
      </main>

      <footer className="bg-gray-950 py-6 text-center text-gray-600 text-sm">
        <p>Built for the Tracks. MK Tournament Pro © 2024</p>
      </footer>
    </div>
  );
}

export default App;
