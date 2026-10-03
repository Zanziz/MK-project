import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Trophy } from 'lucide-react';
import { isRaceComplete } from '../domain/races';
import { RACES_PER_PLAYER, playoffSpots, playoffStageName } from '../domain/rules';
import { computeStandings } from '../domain/standings';
import type { Player, Race, RaceResults } from '../domain/types';
import { RaceList } from './race/RaceList';
import { StandingsTable } from './StandingsTable';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ChampionshipViewProps {
  players: Player[];
  races: Race[];
  canStartPlayoffs: boolean;
  onSaveResult: (raceId: string, results: RaceResults) => void;
  onStartPlayoffs: () => void;
}

type Tab = 'schedule' | 'standings';

export const ChampionshipView = ({
  players,
  races,
  canStartPlayoffs,
  onSaveResult,
  onStartPlayoffs,
}: ChampionshipViewProps) => {
  const [tab, setTab] = useState<Tab>('schedule');
  const [hideCompleted, setHideCompleted] = useState(false);

  const standings = useMemo(() => computeStandings(players, races), [players, races]);
  const completed = races.filter(isRaceComplete).length;
  const spots = playoffSpots(players.length);
  const nextStage = playoffStageName(players.length);

  const startButton = (
    <Button variant="success" fullWidth disabled={!canStartPlayoffs} onClick={onStartPlayoffs}>
      {canStartPlayoffs ? `Start the ${nextStage}` : `${races.length - completed} GP left before the ${nextStage}`}
      {canStartPlayoffs && <ArrowRight size={18} aria-hidden="true" />}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Championship</h1>
          <p className="text-sm text-gray-400">
            Everyone races {RACES_PER_PLAYER} times · top {spots} go to the {nextStage}
          </p>
        </div>
        <div className="w-40 text-right" aria-label={`${completed} of ${races.length} Grands Prix completed`}>
          <span className="font-mono text-xl font-bold text-blue-300">
            {completed}/{races.length}
          </span>
          <span className="ml-1 text-sm text-gray-400">GP</span>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-blue-500 transition-[width] duration-500"
              style={{ width: `${races.length ? (completed / races.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {canStartPlayoffs && (
        <div className="flex animate-fade-in flex-col items-center justify-between gap-3 rounded-xl border border-green-600/50 bg-green-900/20 p-4 sm:flex-row">
          <p className="font-bold text-green-200">All Grands Prix are done. Check the standings, then move on!</p>
          <div className="w-full sm:w-auto">{startButton}</div>
        </div>
      )}

      <div role="tablist" aria-label="Championship" className="grid grid-cols-2 rounded-lg bg-gray-800 p-1 lg:hidden">
        {(['schedule', 'standings'] as const).map(t => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-md py-2 text-sm font-bold capitalize ${tab === t ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className={`space-y-4 lg:col-span-7 ${tab === 'schedule' ? '' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Calendar className="text-blue-400" aria-hidden="true" /> Schedule
            </h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={e => setHideCompleted(e.target.checked)}
                className="size-4 accent-blue-500"
              />
              Hide completed
            </label>
          </div>
          <RaceList races={races} players={players} onSave={onSaveResult} hideCompleted={hideCompleted} />
        </section>

        <section className={`lg:col-span-5 ${tab === 'standings' ? '' : 'hidden lg:block'}`}>
          <Card
            flush
            className="lg:sticky lg:top-20"
            title={
              <span className="flex items-center gap-2 text-yellow-400">
                <Trophy size={20} aria-hidden="true" /> Standings
              </span>
            }
            actions={
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Top {spots} qualify</span>
            }
          >
            <div className="lg:max-h-[calc(100dvh-16rem)] lg:overflow-y-auto">
              <StandingsTable standings={standings} cutoff={spots} caption="Championship standings" />
            </div>
            <div className="border-t border-gray-700 p-4">{startButton}</div>
          </Card>
        </section>
      </div>
    </div>
  );
};
