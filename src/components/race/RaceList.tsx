import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { isRaceComplete } from '../../domain/races';
import type { Player, Race, RaceResults } from '../../domain/types';
import { RaceCard, type RaceStatus } from './RaceCard';
import { RaceResultForm } from './RaceResultForm';

interface RaceListProps {
  races: Race[];
  players: Player[];
  onSave: (raceId: string, results: RaceResults) => void;
  hideCompleted?: boolean;
}

/**
 * Races in play order; the first unfinished one is flagged "Up next", the one after "Get ready".
 * Several result forms can be open at once so that opening one never discards another's input.
 */
export const RaceList = ({ races, players, onSave, hideCompleted = false }: RaceListProps) => {
  const playersById = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const cards = useRef(new Map<string, HTMLButtonElement>());

  const pending = races.filter(race => !isRaceComplete(race));
  const statusOf = (race: Race): RaceStatus => {
    if (isRaceComplete(race)) return 'done';
    if (race === pending[0]) return 'next';
    if (race === pending[1]) return 'on-deck';
    return 'pending';
  };

  // Hand focus back to the race's card once it replaces the form, so keyboard users keep their place.
  const close = (raceId: string) => {
    flushSync(() => setOpenIds(ids => ids.filter(id => id !== raceId)));
    cards.current.get(raceId)?.focus();
  };

  const visible = hideCompleted ? races.filter(race => openIds.includes(race.id) || !isRaceComplete(race)) : races;

  return (
    <ol className="space-y-3">
      {visible.map(race => (
        <li key={race.id}>
          {openIds.includes(race.id) ? (
            <RaceResultForm
              // Start over if the saved results change while the form is open (e.g. Undo).
              key={JSON.stringify(race.results)}
              race={race}
              playersById={playersById}
              onSave={results => {
                onSave(race.id, results);
                close(race.id);
              }}
              onCancel={() => close(race.id)}
            />
          ) : (
            <RaceCard
              ref={el => {
                if (el) cards.current.set(race.id, el);
                else cards.current.delete(race.id);
              }}
              race={race}
              playersById={playersById}
              status={statusOf(race)}
              onEdit={() => setOpenIds(ids => [...ids, race.id])}
            />
          )}
        </li>
      ))}
    </ol>
  );
};
