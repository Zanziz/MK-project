import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Trash2, Upload, List, UserPlus } from 'lucide-react';

type AddMode = 'single' | 'bulk' | 'csv';

interface RegistrationViewProps {
  players: Player[];
  onAddPlayer: (firstName: string, gamerTag: string) => void;
  onRemovePlayer: (id: string) => void;
  onStartChampionship: () => void;
}

function parsePlayerLines(text: string): Array<{ firstName: string; gamerTag: string }> {
  const results: Array<{ firstName: string; gamerTag: string }> = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const sep = line.includes(',') ? ',' : line.includes(';') ? ';' : '\t';
    const parts = line.split(sep).map(p => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      results.push({ firstName: parts[0], gamerTag: parts[1] });
    }
  }
  return results;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onStartChampionship,
}) => {
  const [mode, setMode] = useState<AddMode>('single');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && tag) {
      onAddPlayer(name, tag);
      setName('');
      setTag('');
    }
  };

  const addFromParsed = (parsed: Array<{ firstName: string; gamerTag: string }>) => {
    if (parsed.length === 0) {
      setMessage({ text: 'Aucune ligne valide. Format attendu : Prénom, GamerTag', type: 'error' });
      return;
    }
    const remaining = 50 - players.length;
    const toAdd = parsed.slice(0, remaining);
    toAdd.forEach(p => onAddPlayer(p.firstName, p.gamerTag));
    if (parsed.length > remaining) {
      setMessage({ text: `Limite 50 joueurs atteinte : ${remaining} joueur(s) ajouté(s) sur ${parsed.length}.`, type: 'error' });
    } else {
      setMessage({ text: `${toAdd.length} joueur(s) ajouté(s) avec succès !`, type: 'success' });
    }
    setBulkText('');
  };

  const handleBulkSubmit = () => {
    setMessage(null);
    addFromParsed(parsePlayerLines(bulkText));
  };

  const handleFile = (file: File) => {
    setMessage(null);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const first = lines[0]?.toLowerCase() ?? '';
      const isHeader = first.includes('first') || first.includes('name') || first.includes('prenom') || first.includes('prénom') || first.includes('tag');
      const content = isHeader ? lines.slice(1).join('\n') : text;
      addFromParsed(parsePlayerLines(content));
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const tabs: { id: AddMode; label: string; icon: React.ReactNode }[] = [
    { id: 'single', label: 'Un par un', icon: <UserPlus size={15} /> },
    { id: 'bulk', label: 'Saisie rapide', icon: <List size={15} /> },
    { id: 'csv', label: 'Import CSV', icon: <Upload size={15} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-gaming text-yellow-400 drop-shadow-lg">Mario Kart Cup</h1>
        <p className="text-gray-400">Manage your office tournament like a pro.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left panel with tabs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-700 bg-gray-900/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id); setMessage(null); }}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center ${
                  mode === tab.id
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Single */}
            {mode === 'single' && (
              <form onSubmit={handleSubmitSingle} className="space-y-4">
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
            )}

            {/* Bulk paste */}
            {mode === 'bulk' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Une entrée par ligne :{' '}
                  <span className="text-yellow-400 font-mono">Prénom, GamerTag</span>
                  <br />
                  Séparateur : virgule, point-virgule ou tabulation.
                </p>
                <textarea
                  value={bulkText}
                  onChange={e => { setBulkText(e.target.value); setMessage(null); }}
                  className="w-full h-48 bg-gray-900 border border-gray-700 rounded p-3 text-white font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
                  placeholder={"Mario, SpeedDemon\nLuigi, GreenMachine\nPeach, PinkRacer"}
                />
                {message && (
                  <p className={`text-xs ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {message.text}
                  </p>
                )}
                <Button fullWidth onClick={handleBulkSubmit} disabled={!bulkText.trim() || players.length >= 50}>
                  Ajouter les joueurs
                </Button>
              </div>
            )}

            {/* CSV Import */}
            {mode === 'csv' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Fichier CSV avec colonnes{' '}
                  <span className="text-yellow-400 font-mono">Prénom,GamerTag</span>.{' '}
                  L'en-tête est ignorée automatiquement.
                </p>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors select-none ${
                    isDragging
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700/30'
                  }`}
                >
                  <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-300 text-sm font-medium">Glisse ton fichier CSV ici</p>
                  <p className="text-gray-500 text-xs mt-1">ou clique pour sélectionner (.csv, .txt)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
                {message && (
                  <p className={`text-xs ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {message.text}
                  </p>
                )}
                <div className="bg-gray-900 rounded p-3 text-xs text-gray-500 font-mono">
                  <p className="text-gray-400 mb-1">Exemple de fichier :</p>
                  <p>Prénom,GamerTag</p>
                  <p>Mario,SpeedDemon</p>
                  <p>Luigi,GreenMachine</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player list */}
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
