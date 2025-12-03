import React, { useState } from 'react';
import { Player, Race, POINTS_SYSTEM } from '../types';
import { Button } from './Button';

interface RaceResultInputProps {
  race: Race;
  players: Player[];
  onSave: (raceId: string, results: Record<string, number>) => void;
  onCancel: () => void;
}

export const RaceResultInput: React.FC<RaceResultInputProps> = ({ race, players, onSave, onCancel }) => {
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    // Initialize with existing results if any
    const initial: Record<string, string> = {};
    race.playerIds.forEach(pid => {
      initial[pid] = race.results[pid] ? race.results[pid].toString() : '';
    });
    return initial;
  });

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalResults: Record<string, number> = {};
    let isValid = true;

    race.playerIds.forEach(pid => {
      const val = parseInt(inputs[pid]);
      if (isNaN(val) || val < 1 || val > 24) {
        isValid = false;
      }
      finalResults[pid] = val;
    });

    if (!isValid) {
      alert("Please enter valid positions (1-24) for all players.");
      return;
    }

    onSave(race.id, finalResults);
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg animate-fade-in">
      <h4 className="text-xl font-bold mb-4 text-yellow-400">{race.name} - Results</h4>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 mb-6">
          {race.playerIds.map(pid => {
            const player = getPlayer(pid);
            return (
              <div key={pid} className="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-600">
                <div className="flex flex-col">
                  <span className="font-bold text-white">{player?.gamerTag}</span>
                  <span className="text-xs text-gray-400">{player?.firstName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Pos:</span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={inputs[pid] || ''}
                    onChange={(e) => setInputs({...inputs, [pid]: e.target.value})}
                    className="w-16 p-2 bg-gray-900 border border-gray-600 rounded text-center text-white focus:border-yellow-400 focus:outline-none"
                    placeholder="-"
                  />
                  {inputs[pid] && (
                     <span className="text-xs text-yellow-500 font-bold w-12 text-right">
                       +{POINTS_SYSTEM[Math.max(0, parseInt(inputs[pid]) - 1)] || 0} pts
                     </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" className="flex-1">
            Save Results
          </Button>
        </div>
      </form>
    </div>
  );
};