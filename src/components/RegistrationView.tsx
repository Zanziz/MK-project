import { useId, useRef, useState, type FormEvent } from 'react';
import { ClipboardList, Trash2, Upload, UserPlus } from 'lucide-react';
import { createPlayer, dropCsvHeader, parseRacerList, registrationError, toDraft } from '../domain/registration';
import {
  FINALISTS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  RACES_PER_PLAYER,
  SEMI_FINALISTS,
  hasSemiFinals,
  playoffSpots,
  playoffStageName,
} from '../domain/rules';
import { raceSizes } from '../domain/schedule';
import type { Player } from '../domain/types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { PlayerName } from './ui/PlayerName';

interface RegistrationViewProps {
  players: Player[];
  onAddPlayers: (players: Player[]) => void;
  onRemovePlayer: (id: string) => void;
  onStart: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none aria-invalid:border-red-500';

export const RegistrationView = ({ players, onAddPlayers, onRemovePlayer, onStart }: RegistrationViewProps) => {
  const missing = Math.max(0, MIN_PLAYERS - players.length);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="font-gaming text-3xl text-yellow-400 drop-shadow-lg sm:text-5xl">Mario Kart Cup</h1>
        <p className="text-gray-300">Register the racers, then let the championship begin.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AddRacerCard players={players} onAddPlayers={onAddPlayers} />

        <Card title={`Racers (${players.length}/${MAX_PLAYERS})`}>
          {players.length === 0 ? (
            <p className="py-8 text-center text-gray-400">No racers yet. Add the first one!</p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {players.map(p => (
                <li
                  key={p.id}
                  className="flex animate-fade-in items-center justify-between rounded-lg border border-gray-700 bg-gray-900 py-2 pr-1 pl-3"
                >
                  <PlayerName player={p} />
                  <button
                    type="button"
                    onClick={() => onRemovePlayer(p.id)}
                    className="rounded-lg p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-yellow-400"
                    aria-label={`Remove ${p.gamerTag}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <Button onClick={onStart} disabled={missing > 0} variant="success" size="lg">
          Start championship
        </Button>
        <p className="text-sm text-gray-400">
          {missing > 0
            ? `Add ${missing} more racer${missing > 1 ? 's' : ''} to start.`
            : `${raceSizes(players.length).length} Grands Prix · ${RACES_PER_PLAYER} races each · top ${playoffSpots(players.length)} go to the ${playoffStageName(players.length)}`}
        </p>
        {missing === 0 && !hasSemiFinals(players.length) && (
          <p className="text-xs text-gray-500">
            Semi-finals need {SEMI_FINALISTS} racers; with fewer, the top {FINALISTS} go straight to the final.
          </p>
        )}
      </div>
    </div>
  );
};

interface AddRacerCardProps {
  players: Player[];
  onAddPlayers: (players: Player[]) => void;
}

const AddRacerCard = ({ players, onAddPlayers }: AddRacerCardProps) => {
  const [mode, setMode] = useState<'single' | 'list'>('single');

  return (
    <Card
      title="New racer"
      className="h-fit"
      actions={
        <Button variant="ghost" size="sm" onClick={() => setMode(mode === 'single' ? 'list' : 'single')}>
          {mode === 'single' ? (
            <>
              <ClipboardList size={16} aria-hidden="true" /> Paste or import
            </>
          ) : (
            <>
              <UserPlus size={16} aria-hidden="true" /> One by one
            </>
          )}
        </Button>
      }
    >
      {mode === 'single' ? (
        <SingleRacerForm players={players} onAddPlayers={onAddPlayers} />
      ) : (
        <RacerListForm players={players} onAddPlayers={onAddPlayers} />
      )}
    </Card>
  );
};

const SingleRacerForm = ({ players, onAddPlayers }: AddRacerCardProps) => {
  const id = useId();
  const isFull = players.length >= MAX_PLAYERS;
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const invalidField = error ? (name.trim() ? 'tag' : 'name') : null;
  const errorOn = (field: 'name' | 'tag') =>
    field === invalidField ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const draft = toDraft(name, tag);
    const problem = registrationError(players, draft);
    if (problem) {
      setError(problem);
      return;
    }
    onAddPlayers([createPlayer(draft)]);
    setName('');
    setTag('');
    setError(null);
    nameRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-medium text-gray-300">
          First name
        </label>
        <input
          id={`${id}-name`}
          ref={nameRef}
          value={name}
          onChange={e => {
            setName(e.target.value);
            setError(null);
          }}
          className={inputClass}
          placeholder="Mario"
          autoComplete="off"
          autoFocus
          disabled={isFull}
          {...errorOn('name')}
        />
      </div>
      <div>
        <label htmlFor={`${id}-tag`} className="mb-1 block text-sm font-medium text-gray-300">
          Gamer tag <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id={`${id}-tag`}
          value={tag}
          onChange={e => {
            setTag(e.target.value);
            setError(null);
          }}
          className={inputClass}
          placeholder={name.trim() || 'SpeedDemon'}
          autoComplete="off"
          disabled={isFull}
          {...errorOn('tag')}
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={isFull}>
        {isFull ? 'Tournament full' : 'Add racer'}
      </Button>
    </form>
  );
};

const RacerListForm = ({ players, onAddPlayers }: AddRacerCardProps) => {
  const id = useId();
  const isFull = players.length >= MAX_PLAYERS;
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // Lines beyond the player cap come back in `rejected`, like duplicates.
  const preview = parseRacerList(text, players);

  // A CSV file lands in the text area, so its racers get the same preview before being added.
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const racers = dropCsvHeader(await file.text()).trim();
    setText(current => [current.trim(), racers].filter(Boolean).join('\n'));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAddPlayers(preview.accepted.map(createPlayer));
    // Keep the skipped lines so they can be fixed and added again.
    setText(preview.rejected.map(r => r.line).join('\n'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={`${id}-list`} className="block text-sm text-gray-300">
          One racer per line: <code className="text-yellow-300">First name, Gamer tag</code>
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={() => fileInput.current?.click()}
          disabled={isFull}
        >
          <Upload size={16} aria-hidden="true" /> CSV file
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={e => {
            void importFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <textarea
        id={`${id}-list`}
        value={text}
        onChange={e => setText(e.target.value)}
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          void importFile(e.dataTransfer.files[0]);
        }}
        rows={7}
        className={`${inputClass} font-mono text-sm ${isDragging ? 'border-yellow-400 bg-yellow-400/10' : ''}`}
        placeholder={'Alice, Turbo\nBob, Nitro\nCarol\n\n…or drop a CSV file here'}
        autoFocus
        disabled={isFull}
      />
      {preview.rejected.length > 0 && (
        <ul aria-live="polite" className="space-y-1 text-sm text-red-400">
          {preview.rejected.map(({ line, reason }, i) => (
            <li key={i}>
              <span className="font-mono">{line}</span> — {reason}
            </li>
          ))}
        </ul>
      )}
      <Button type="submit" fullWidth disabled={isFull || preview.accepted.length === 0}>
        Add {preview.accepted.length || ''} racer{preview.accepted.length === 1 ? '' : 's'}
      </Button>
    </form>
  );
};
