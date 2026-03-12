import React, { useState } from 'react';
import { Player, Race, RaceContext, getPoints } from '../types';
import { RaceResultInput } from './RaceResultInput';
import { Button } from './Button';
import { Trophy, CheckCircle, RotateCw } from 'lucide-react';

interface FinalsViewProps {
  players: Player[];
  finalRaces: Race[];
  onUpdateRaceResult: (raceId: string, results: Record<string, number>, context: RaceContext) => void;
  onResetTournament: () => void;
}

export const FinalsView: React.FC<FinalsViewProps> = ({
  players,
  finalRaces,
  onUpdateRaceResult,
  onResetTournament,
}) => {
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  if (finalRaces.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">
        <p>Finals data is missing. Please reset the tournament.</p>
        <Button variant="danger" onClick={onResetTournament} className="mt-4">
          Reset Tournament
        </Button>
      </div>
    );
  }

  const finalPlayers = finalRaces[0].playerIds
    .map(pid => {
      const original = players.find(p => p.id === pid)!;
      let score = 0;
      finalRaces.forEach(r => {
        if (r.results[pid]) score += getPoints(r.results[pid]);
      });
      return { ...original, score };
    })
    .sort((a, b) => b.score - a.score);

  const isComplete = finalRaces.every(r => r.isCompleted);
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
          {finalRaces.map(race => (
            <div key={race.id}>
              {editingRaceId === race.id ? (
                <RaceResultInput
                  race={race}
                  players={players}
                  onSave={(rid, res) => {
                    onUpdateRaceResult(rid, res, { type: 'final' });
                    setEditingRaceId(null);
                  }}
                  onCancel={() => setEditingRaceId(null)}
                />
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingRaceId(race.id)}
                  onKeyDown={e => e.key === 'Enter' && setEditingRaceId(race.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    race.isCompleted ? 'bg-gray-800 border-yellow-600/50' : 'bg-gray-800 border-gray-700'
                  }`}
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
              <div
                key={p.id}
                className={`flex items-center p-4 border-b border-gray-700 last:border-0 ${idx === 0 ? 'bg-yellow-900/20' : ''}`}
              >
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
          <Button variant="danger" onClick={onResetTournament} className="flex items-center gap-2">
            <RotateCw size={18} /> Start New Tournament
          </Button>
        </div>
      )}
    </div>
  );
};
