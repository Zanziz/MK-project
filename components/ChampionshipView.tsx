import React, { useState } from 'react';
import { Player, Race, RaceContext } from '../types';
import { RaceResultInput } from './RaceResultInput';
import { Leaderboard } from './Leaderboard';
import { Button } from './Button';
import { Calendar, Trophy, ArrowRight, CheckCircle } from 'lucide-react';

interface ChampionshipViewProps {
  players: Player[];
  championshipRaces: Race[];
  onUpdateRaceResult: (raceId: string, results: Record<string, number>, context: RaceContext) => void;
  onStartSemiFinals: () => void;
}

export const ChampionshipView: React.FC<ChampionshipViewProps> = ({
  players,
  championshipRaces,
  onUpdateRaceResult,
  onStartSemiFinals,
}) => {
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  const completedRaces = championshipRaces.filter(r => r.isCompleted).length;
  const totalRaces = championshipRaces.length;
  const progress = totalRaces > 0 ? Math.round((completedRaces / totalRaces) * 100) : 0;

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
          {championshipRaces.map(race => (
            <div key={race.id}>
              {editingRaceId === race.id ? (
                <RaceResultInput
                  race={race}
                  players={players}
                  onSave={(rid, res) => {
                    onUpdateRaceResult(rid, res, { type: 'championship' });
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
                      const p = players.find(pl => pl.id === pid);
                      const pos = race.results[pid];
                      return (
                        <div key={pid} className="flex items-center gap-2 text-sm text-gray-300">
                          <div className={`w-2 h-2 rounded-full ${pos ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                          <span className={pos ? 'text-white font-medium' : ''}>{p?.gamerTag}</span>
                          {pos && <span className="text-yellow-500 font-bold ml-auto">#{pos}</span>}
                        </div>
                      );
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
          <Leaderboard players={players} highlightTop={8} />

          <div className="p-4 border-t border-gray-700">
            <Button
              fullWidth
              variant="primary"
              disabled={completedRaces < totalRaces}
              onClick={onStartSemiFinals}
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
