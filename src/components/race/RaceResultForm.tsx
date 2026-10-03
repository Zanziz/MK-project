import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { validateResults } from '../../domain/races';
import { MAX_POSITION, getPoints } from '../../domain/rules';
import type { Player, Race, RaceResults } from '../../domain/types';
import { Button } from '../ui/Button';
import { PlayerName } from '../ui/PlayerName';

interface RaceResultFormProps {
  race: Race;
  playersById: Map<string, Player>;
  onSave: (results: RaceResults) => void;
  onCancel: () => void;
}

export const RaceResultForm = ({ race, playersById, onSave, onCancel }: RaceResultFormProps) => {
  const id = useId();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(race.playerIds.map(pid => [pid, race.results[pid]?.toString() ?? ''])),
  );
  const [submitted, setSubmitted] = useState(false);
  const { errors } = validateResults(race, values, submitted);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Validate as submitted: the render-time errors don't flag empty fields yet.
    const check = validateResults(race, values, true);
    if (check.results) onSave(check.results);
    else inputs.current[race.playerIds.findIndex(pid => check.errors[pid])]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Escape') onCancel();
    // Enter moves to the next field; on the last one it submits the form.
    if (e.key === 'Enter' && index < race.playerIds.length - 1) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="animate-fade-in rounded-xl border border-blue-500 bg-gray-700/60 p-4"
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-yellow-400">{race.name}</h3>
        <p className="text-sm text-gray-300">Finishing position of each racer (1–{MAX_POSITION}, CPUs included).</p>
      </div>

      <div className="mb-5 grid gap-2">
        {race.playerIds.map((pid, index) => {
          const player = playersById.get(pid);
          const value = values[pid] ?? '';
          const error = errors[pid];
          const inputId = `${id}-${pid}`;
          return (
            <div key={pid} className="rounded-lg border border-gray-600 bg-gray-800 p-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={inputId} className="min-w-0">
                  <PlayerName player={player} />
                </label>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="w-14 text-right text-sm font-bold text-yellow-400" aria-hidden="true">
                    {value && !error ? `+${getPoints(Number(value))} pts` : ''}
                  </span>
                  <input
                    id={inputId}
                    ref={el => {
                      inputs.current[index] = el;
                    }}
                    value={value}
                    onChange={e => setValues({ ...values, [pid]: e.target.value.replace(/\D/g, '') })}
                    onKeyDown={e => handleKeyDown(e, index)}
                    inputMode="numeric"
                    maxLength={2}
                    autoComplete="off"
                    autoFocus={index === 0}
                    placeholder="–"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className="w-16 rounded-lg border border-gray-600 bg-gray-900 p-2 text-center text-lg font-bold text-white focus:border-yellow-400 focus:outline-none aria-invalid:border-red-500"
                  />
                </div>
              </div>
              {error && (
                <p id={`${inputId}-error`} className="mt-1 text-right text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="success" className="flex-1">
          Save results
        </Button>
      </div>
    </form>
  );
};
