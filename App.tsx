import React, { useState, useEffect, useMemo } from 'react';
import { Phase, Player, Race, TournamentState, getPoints, SemiFinalSession } from './types';
import { generateChampionshipSchedule, getQualifiers } from './utils/scheduler';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { RaceResultInput } from './components/RaceResultInput';
import { Leaderboard } from './components/Leaderboard';
import { Trophy, Users, Calendar, ArrowRight, Save, Trash2, RotateCw, Flag, CheckCircle } from 'lucide-react';

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
    const saved = localStorage.getItem('mk_tournament_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('mk_tournament_state', JSON.stringify(state));
  }, [state]);

  // --- Actions ---

  const addPlayer = (firstName: string, gamerTag: string) => {
    if (state.players.length >= 50) return;
    const newPlayer: Player = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
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

  const updateRaceResult = (raceId: string, results: Record<string, number>, isChampionship: boolean, semiSessionId?: string, isFinal?: boolean) => {
    setState(prev => {
      // Helper to update player stats based on diff
      const updatePlayers = (currentPlayers: Player[], oldResults: Record<string, number>, newResults: Record<string, number>) => {
        return currentPlayers.map(p => {
          if (newResults[p.id] !== undefined) {
            const newPoints = getPoints(newResults[p.id]);
            const oldPoints = oldResults[p.id] ? getPoints(oldResults[p.id]) : 0;
            
            // Stats update logic
            const positions = [...p.positions];
            if (oldResults[p.id]) {
                // If editing, logic gets complex for positions array, simpler to just append/replace
                // For simplicity in this demo, we assume we just add points. 
                // A full production app would recalculate everything from scratch based on all race results.
            }
            
            // To ensure consistency, let's recalculate specific player score from scratch based on all races
            // But for now, let's do differential update which is faster for UI but risky.
            // BETTER APPROACH: Recalculate all scores from races every time.
            return p; // We will handle score recalc globally below
          }
          return p;
        });
      };

      let newChampionshipRaces = [...prev.championshipRaces];
      let newSemiFinals = { ...prev.semiFinals };
      let newFinalRaces = [...prev.finalRaces];

      // Update the specific race
      if (isChampionship) {
        newChampionshipRaces = newChampionshipRaces.map(r => 
          r.id === raceId ? { ...r, results, isCompleted: true } : r
        );
      } else if (semiSessionId) {
        const key = semiSessionId === 's1' ? 'session1' : 'session2';
        newSemiFinals[key] = {
          ...newSemiFinals[key],
          races: newSemiFinals[key].races.map(r => r.id === raceId ? { ...r, results, isCompleted: true } : r)
        };
      } else if (isFinal) {
        newFinalRaces = newFinalRaces.map(r => r.id === raceId ? { ...r, results, isCompleted: true } : r);
      }

      // Recalculate ALL scores based on the new state of races
      // This ensures 100% accuracy even on edits
      const recalculatedPlayers = prev.players.map(p => {
        let score = 0;
        let played = 0;
        let positions: number[] = [];

        // Check Championship
        if (prev.phase >= Phase.CHAMPIONSHIP) {
           newChampionshipRaces.forEach(r => {
             if (r.results[p.id]) {
               score += getPoints(r.results[p.id]);
               played++;
               positions.push(r.results[p.id]);
             }
           });
        }
        
        // Check Semis (Only add points if we want cumulative? Usually Semis reset score. 
        // Prompt implies Semis have their own standings. 
        // We will keep main 'score' for Championship, and calculate Semi score on the fly for the Semi view)
        
        return {
          ...p,
          score,
          racesPlayed: played,
          positions
        };
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
    // Seeding: S1 = [1, 8, 3, 6], S2 = [2, 7, 4, 5]
    // indices: 0, 7, 2, 5  AND 1, 6, 3, 4
    
    const s1Players = [qualifiers[0], qualifiers[7], qualifiers[2], qualifiers[5]].filter(Boolean).map(p => p.id);
    const s2Players = [qualifiers[1], qualifiers[6], qualifiers[3], qualifiers[4]].filter(Boolean).map(p => p.id);

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
      let newQualifiers = isSelected 
        ? session.manualQualifiers.filter(id => id !== playerId)
        : [...session.manualQualifiers, playerId];
      
      // Limit to 2
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

    setState(s => ({
      ...s,
      phase: Phase.FINALS,
      finalRaces
    }));
  };

  const resetTournament = () => {
    if (confirm("Are you sure? All data will be lost.")) {
      setState(INITIAL_STATE);
    }
  };

  // --- Views ---

  const RegistrationView = () => {
    const [name, setName] = useState('');
    const [tag, setTag] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name && tag) {
        addPlayer(name, tag);
        setName('');
        setTag('');
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-gaming text-yellow-400 drop-shadow-lg">Mario Kart Cup</h1>
          <p className="text-gray-400">Manage your office tournament like a pro.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card title="New Racer" className="h-fit">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Gamer Tag</label>
                <input 
                  value={tag} onChange={e => setTag(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="SpeedDemon"
                />
              </div>
              <Button type="submit" fullWidth disabled={state.players.length >= 50}>
                Add Racer
              </Button>
            </form>
          </Card>

          <Card title={`Racers (${state.players.length}/50)`}>
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {state.players.length === 0 && <p className="text-gray-500 text-center py-4">No racers registered yet.</p>}
              {state.players.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-900 p-3 rounded border border-gray-700">
                  <div>
                    <span className="font-bold text-white block">{p.gamerTag}</span>
                    <span className="text-xs text-gray-500">{p.firstName}</span>
                  </div>
                  <button onClick={() => removePlayer(p.id)} className="text-red-500 hover:text-red-400 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex justify-center pt-8">
          <Button 
            onClick={startChampionship} 
            disabled={state.players.length < 4}
            variant="success"
            className="text-xl px-12 py-4 shadow-blue-500/50"
          >
            Start Championship
          </Button>
        </div>
      </div>
    );
  };

  const ChampionshipView = () => {
    const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

    const completedRaces = state.championshipRaces.filter(r => r.isCompleted).length;
    const totalRaces = state.championshipRaces.length;
    const progress = Math.round((completedRaces / totalRaces) * 100);

    return (
      <div className="grid lg:grid-cols-12 gap-6 h-full">
        {/* Left: Schedule */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-blue-400" /> Schedule
              </h2>
              <p className="text-gray-400 text-sm">Qualification Round</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-blue-400">{progress}%</span>
              <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {state.championshipRaces.map((race, idx) => (
              <div key={race.id}>
                 {editingRaceId === race.id ? (
                   <RaceResultInput 
                      race={race} 
                      players={state.players} 
                      onSave={(rid, res) => {
                        updateRaceResult(rid, res, true);
                        setEditingRaceId(null);
                      }}
                      onCancel={() => setEditingRaceId(null)}
                   />
                 ) : (
                   <div 
                    onClick={() => setEditingRaceId(race.id)}
                    className={`
                      relative group cursor-pointer border rounded-xl p-4 transition-all
                      ${race.isCompleted ? 'bg-gray-800 border-green-900/50' : 'bg-gray-800 border-gray-700 hover:border-blue-500'}
                    `}
                   >
                     <div className="flex justify-between items-center mb-2">
                       <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{race.name}</h3>
                       {race.isCompleted ? (
                         <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                           <CheckCircle size={12} /> Completed
                         </span>
                       ) : (
                         <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Pending</span>
                       )}
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {race.playerIds.map(pid => {
                          const p = state.players.find(pl => pl.id === pid);
                          const pos = race.results[pid];
                          return (
                            <div key={pid} className="flex items-center gap-2 text-sm text-gray-300">
                              <div className={`w-2 h-2 rounded-full ${pos ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                              <span className={pos ? 'text-white font-medium' : ''}>{p?.gamerTag}</span>
                              {pos && <span className="text-yellow-500 font-bold ml-auto">#{pos}</span>}
                            </div>
                          )
                        })}
                     </div>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Leaderboard */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-1 shadow-2xl sticky top-6">
             <div className="p-4 border-b border-gray-700 flex justify-between items-center">
               <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                 <Trophy size={20} /> Standings
               </h2>
               <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Top 8 Qualify</span>
             </div>
             <Leaderboard players={state.players} highlightTop={8} />
             
             <div className="p-4 border-t border-gray-700">
                <Button 
                  fullWidth 
                  variant="primary" 
                  disabled={completedRaces < totalRaces}
                  onClick={startSemiFinals}
                  className="flex justify-center items-center gap-2"
                >
                   {completedRaces < totalRaces ? 'Complete all races to proceed' : 'Start Semi-Finals'} 
                   <ArrowRight size={18} />
                </Button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const SemiFinalsView = () => {
    const [editingRace, setEditingRace] = useState<{sid: string, rid: string} | null>(null);

    // Helper to calculate score within a session locally
    const getSessionScore = (session: SemiFinalSession, playerId: string) => {
      let score = 0;
      session.races.forEach(r => {
        if (r.results[playerId]) score += getPoints(r.results[playerId]);
      });
      return score;
    };

    const renderSession = (sessionKey: 'session1' | 'session2') => {
      const session = state.semiFinals[sessionKey];
      // Create local player objects with session scores for sorting/display
      const sessionPlayers = session.playerIds.map(pid => {
        const original = state.players.find(p => p.id === pid)!;
        return {
          ...original,
          score: getSessionScore(session, pid) // Override global score with session score for display
        };
      }).sort((a, b) => b.score - a.score);

      const allRacesDone = session.races.every(r => r.isCompleted);

      return (
        <Card title={session.name} className="h-full flex flex-col">
           <div className="flex-1 space-y-4">
             {/* Races */}
             <div className="space-y-2">
                {session.races.map(race => (
                  <div key={race.id}>
                    {editingRace?.rid === race.id ? (
                       <div className="border border-blue-500 rounded p-2">
                          <RaceResultInput 
                            race={race}
                            players={state.players}
                            onSave={(rid, res) => {
                              updateRaceResult(rid, res, false, sessionKey);
                              setEditingRace(null);
                            }}
                            onCancel={() => setEditingRace(null)}
                          />
                       </div>
                    ) : (
                      <div 
                        onClick={() => setEditingRace({ sid: sessionKey, rid: race.id })}
                        className={`p-3 rounded border cursor-pointer flex justify-between items-center ${race.isCompleted ? 'bg-gray-900 border-green-800' : 'bg-gray-700 border-gray-600 hover:border-blue-400'}`}
                      >
                         <span className="font-bold text-sm">{race.name}</span>
                         {race.isCompleted ? <CheckCircle size={14} className="text-green-500"/> : <span className="text-xs text-gray-400">Tap to enter</span>}
                      </div>
                    )}
                  </div>
                ))}
             </div>

             {/* Mini Leaderboard for Session */}
             <div className="mt-4">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Session Standings</h4>
               <table className="w-full text-sm">
                 <tbody>
                   {sessionPlayers.map((p, idx) => (
                     <tr key={p.id} className="border-b border-gray-700 last:border-0">
                       <td className="py-2 text-gray-400 w-6">#{idx + 1}</td>
                       <td className="py-2 font-bold">{p.gamerTag}</td>
                       <td className="py-2 text-right font-mono text-yellow-400">{p.score} pts</td>
                       {allRacesDone && (
                         <td className="py-2 text-right pl-2">
                            <input 
                              type="checkbox" 
                              checked={session.manualQualifiers.includes(p.id)}
                              onChange={() => toggleSemiQualifier(sessionKey, p.id)}
                              className="w-5 h-5 accent-green-500 cursor-pointer"
                            />
                         </td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
               {allRacesDone && (
                 <p className="text-xs text-center text-blue-300 mt-2 bg-blue-900/20 p-2 rounded">
                   Select 2 qualifiers ({session.manualQualifiers.length}/2)
                 </p>
               )}
             </div>
           </div>
        </Card>
      );
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-gaming text-white">Semi-Finals</h2>
          <p className="text-gray-400">Playoff Format. Top 2 from each session advance.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {renderSession('session1')}
          {renderSession('session2')}
        </div>

        <div className="flex justify-center pt-6">
          <Button 
            onClick={startFinals}
            variant="success"
            className="px-8 text-lg"
            disabled={state.semiFinals.session1.manualQualifiers.length !== 2 || state.semiFinals.session2.manualQualifiers.length !== 2}
          >
            Start Grand Final <ArrowRight className="inline ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const FinalsView = () => {
    const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

    // Calculate Final Scores
    const finalPlayers = state.finalRaces[0].playerIds.map(pid => {
      const original = state.players.find(p => p.id === pid)!;
      let score = 0;
      state.finalRaces.forEach(r => {
        if (r.results[pid]) score += getPoints(r.results[pid]);
      });
      return { ...original, score };
    }).sort((a, b) => b.score - a.score);

    const isComplete = state.finalRaces.every(r => r.isCompleted);
    const champion = isComplete ? finalPlayers[0] : null;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl md:text-5xl font-gaming text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            THE GRAND FINAL
          </h2>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span>3 Races</span>
            <span>•</span>
            <span>4 Racers</span>
            <span>•</span>
            <span>1 Champion</span>
          </div>
        </div>

        {champion && (
          <div className="bg-gradient-to-b from-yellow-600/20 to-yellow-900/20 border border-yellow-500/50 rounded-2xl p-8 text-center animate-bounce-in">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
            <h3 className="text-2xl text-yellow-200">The Winner is</h3>
            <h1 className="text-5xl font-black text-white mt-2 mb-4 tracking-tighter">{champion.gamerTag}</h1>
            <p className="text-xl text-yellow-400 font-mono">{champion.score} PTS</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Race Schedule</h3>
             {state.finalRaces.map(race => (
               <div key={race.id}>
                 {editingRaceId === race.id ? (
                   <RaceResultInput 
                      race={race} 
                      players={state.players} 
                      onSave={(rid, res) => {
                        updateRaceResult(rid, res, false, undefined, true);
                        setEditingRaceId(null);
                      }}
                      onCancel={() => setEditingRaceId(null)}
                   />
                 ) : (
                   <div 
                     onClick={() => setEditingRaceId(race.id)}
                     className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${race.isCompleted ? 'bg-gray-800 border-yellow-600/50' : 'bg-gray-800 border-gray-700'}`}
                   >
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-lg">{race.name}</span>
                       {race.isCompleted && <CheckCircle className="text-yellow-500" />}
                     </div>
                   </div>
                 )}
               </div>
             ))}
          </div>

          <div>
             <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Live Podium</h3>
             <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
                {finalPlayers.map((p, idx) => (
                  <div key={p.id} className={`flex items-center p-4 border-b border-gray-700 last:border-0 ${idx === 0 ? 'bg-yellow-900/20' : ''}`}>
                    <div className="w-8 text-center font-bold text-xl text-gray-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4'}
                    </div>
                    <div className="flex-1 px-4">
                      <div className="font-bold text-lg">{p.gamerTag}</div>
                      <div className="text-xs text-gray-500">{p.firstName}</div>
                    </div>
                    <div className="font-mono text-2xl font-bold text-yellow-400">{p.score}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
        
        {isComplete && (
           <div className="flex justify-center pt-12">
             <Button variant="danger" onClick={resetTournament} className="flex items-center gap-2">
               <RotateCw size={18} /> Start New Tournament
             </Button>
           </div>
        )}
      </div>
    );
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
          <div className="flex items-center gap-4 text-xs md:text-sm font-medium text-gray-400">
             <span className={state.phase === Phase.REGISTRATION ? 'text-white' : ''}>Registration</span>
             <ArrowRight size={14} />
             <span className={state.phase === Phase.CHAMPIONSHIP ? 'text-white' : ''}>Championship</span>
             <ArrowRight size={14} />
             <span className={state.phase === Phase.SEMI_FINALS ? 'text-white' : ''}>Semis</span>
             <ArrowRight size={14} />
             <span className={state.phase === Phase.FINALS ? 'text-white' : ''}>Finals</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {state.phase === Phase.REGISTRATION && <RegistrationView />}
        {state.phase === Phase.CHAMPIONSHIP && <ChampionshipView />}
        {state.phase === Phase.SEMI_FINALS && <SemiFinalsView />}
        {state.phase === Phase.FINALS && <FinalsView />}
      </main>
      
      <footer className="bg-gray-950 py-6 text-center text-gray-600 text-sm">
        <p>Built for the Tracks. MK Tournament Pro © 2024</p>
      </footer>
    </div>
  );
}

export default App;