import { useMemo } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { areRacesComplete } from '../domain/races';
import { FINAL_RACES, FINALISTS } from '../domain/rules';
import { leader } from '../domain/standings';
import { stageStandings } from '../domain/tournament';
import type { Player, Race, RaceResults } from '../domain/types';
import { RaceList } from './race/RaceList';
import { StandingsTable } from './StandingsTable';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface FinalViewProps {
  players: Player[];
  races: Race[];
  onSaveResult: (raceId: string, results: RaceResults) => void;
  onNewTournament: () => void;
}

export const FinalView = ({ players, races, onSaveResult, onNewTournament }: FinalViewProps) => {
  const standings = useMemo(() => stageStandings(players, races[0]?.playerIds ?? [], races), [players, races]);
  const done = areRacesComplete(races);
  const champion = done ? leader(standings) : null;
  const tiedForFirst = done && !champion ? standings.filter(s => s.rank === 1) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="font-gaming text-3xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] sm:text-5xl">
          Grand Final
        </h1>
        <p className="text-gray-300">
          {FINAL_RACES} Grands Prix · {FINALISTS} racers · 1 champion
        </p>
      </div>

      {champion && (
        <div className="rounded-2xl border border-yellow-500/50 bg-gradient-to-b from-yellow-600/20 to-yellow-900/20 p-8 text-center motion-safe:animate-pop-in">
          <Trophy className="mx-auto mb-4 size-20 text-yellow-400 drop-shadow-lg" aria-hidden="true" />
          <p className="text-xl text-yellow-200">The champion is</p>
          <p className="mt-2 mb-3 text-5xl font-black tracking-tight break-words text-white">
            {champion.player.gamerTag}
          </p>
          <p className="font-mono text-xl text-yellow-400">{champion.points} pts</p>
        </div>
      )}

      {tiedForFirst.length > 0 && (
        <div
          role="status"
          className="rounded-2xl border border-orange-500/50 bg-orange-900/20 p-6 text-center text-orange-200"
        >
          <p className="text-lg font-bold">
            Perfect tie between {tiedForFirst.map(s => s.player.gamerTag).join(' and ')}!
          </p>
          <p className="text-sm">Same points and same finishes: settle it with a tie-breaker race.</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-4">
          <h2 className="border-b border-gray-700 pb-2 text-xl font-bold text-white">Races</h2>
          <RaceList races={races} players={players} onSave={onSaveResult} />
        </section>

        <section>
          <h2 className="mb-4 border-b border-gray-700 pb-2 text-xl font-bold text-white">
            {done ? 'Final podium' : 'Live podium'}
          </h2>
          <Card flush>
            <StandingsTable standings={standings} caption="Final standings" />
          </Card>
        </section>
      </div>

      {done && (
        <div className="flex justify-center pt-6">
          <Button variant="danger" onClick={onNewTournament}>
            <RotateCcw size={18} aria-hidden="true" /> Start a new tournament
          </Button>
        </div>
      )}
    </div>
  );
};
