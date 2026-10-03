import type { Ref } from 'react';
import { CircleCheck, Pencil } from 'lucide-react';
import { getPoints } from '../../domain/rules';
import type { Player, Race } from '../../domain/types';

export type RaceStatus = 'done' | 'next' | 'on-deck' | 'pending';

interface RaceCardProps {
  race: Race;
  playersById: Map<string, Player>;
  status: RaceStatus;
  onEdit: () => void;
  ref?: Ref<HTMLButtonElement>;
}

const STATUS: Record<RaceStatus, { card: string; badge: string; label: string }> = {
  done: { card: 'border-green-900/60 bg-gray-800/70', badge: 'bg-green-900/70 text-green-300', label: 'Done' },
  next: {
    card: 'border-yellow-400/70 bg-gray-800 ring-2 ring-yellow-400/30',
    badge: 'bg-yellow-400 font-bold text-yellow-950',
    label: 'Up next',
  },
  'on-deck': { card: 'border-blue-500/50 bg-gray-800', badge: 'bg-blue-900/70 text-blue-200', label: 'Get ready' },
  pending: { card: 'border-gray-700 bg-gray-800', badge: 'bg-gray-700 text-gray-300', label: 'Pending' },
};

export const RaceCard = ({ race, playersById, status, onEdit, ref }: RaceCardProps) => {
  const isDone = status === 'done';
  const lineup = race.playerIds
    .map(id => ({ id, tag: playersById.get(id)?.gamerTag ?? '?', position: race.results[id] ?? 0 }))
    .sort((a, b) => a.position - b.position);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onEdit}
      aria-label={`${isDone ? 'Edit' : 'Enter'} results for ${race.name}`}
      className={`group @container w-full rounded-xl border p-4 text-left transition-colors hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 ${STATUS[status].card}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-bold text-white">{race.name}</h3>
        <div className="flex items-center gap-2">
          <Pencil
            size={14}
            className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
          <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${STATUS[status].badge}`}>
            {isDone && <CircleCheck size={12} aria-hidden="true" />}
            {STATUS[status].label}
          </span>
        </div>
      </div>

      {isDone ? (
        <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm @xl:grid-cols-4">
          {lineup.map(({ id, tag, position }) => (
            <li key={id} className="flex items-baseline gap-2">
              <span className="w-7 shrink-0 font-mono font-bold text-yellow-400">#{position}</span>
              <span className="truncate font-medium text-white">{tag}</span>
              <span className="ml-auto text-xs text-gray-400">+{getPoints(position)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-300 @md:grid-cols-4">
          {lineup.map(({ id, tag }) => (
            <li key={id} className="truncate">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
};
