import React, { useState } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Trash2 } from 'lucide-react';

interface RegistrationViewProps {
  players: Player[];
  onAddPlayer: (firstName: string, gamerTag: string) => void;
  onRemovePlayer: (id: string) => void;
  onStartChampionship: () => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onStartChampionship,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && tag) {
      onAddPlayer(name, tag);
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
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Mario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Gamer Tag</label>
              <input
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="SpeedDemon"
              />
            </div>
            <Button type="submit" fullWidth disabled={players.length >= 50}>
              Add Racer
            </Button>
          </form>
        </Card>

        <Card title={`Racers (${players.length}/50)`}>
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {players.length === 0 && (
              <p className="text-gray-500 text-center py-4">No racers registered yet.</p>
            )}
            {players.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-gray-900 p-3 rounded border border-gray-700">
                <div>
                  <span className="font-bold text-white block">{p.gamerTag}</span>
                  <span className="text-xs text-gray-500">{p.firstName}</span>
                </div>
                <button
                  onClick={() => onRemovePlayer(p.id)}
                  className="text-red-500 hover:text-red-400 p-2"
                  aria-label={`Remove ${p.gamerTag}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-center pt-8">
        <Button
          onClick={onStartChampionship}
          disabled={players.length < 4}
          variant="success"
          className="text-xl px-12 py-4 shadow-blue-500/50"
        >
          Start Championship
        </Button>
      </div>
    </div>
  );
};
