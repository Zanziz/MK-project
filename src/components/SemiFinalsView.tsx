import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { areRacesComplete } from '../domain/races';
import { QUALIFIERS_PER_SEMI, SEMI_RACES } from '../domain/rules';
import type { Standing } from '../domain/standings';
import { BRACKETS, stageStandings } from '../domain/tournament';
import { SEMI_KEYS, type Player, type RaceResults, type SemiFinal, type SemiKey } from '../domain/types';
import { RaceList } from './race/RaceList';
import { StandingsTable } from './StandingsTable';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface SemiFinalsViewProps {
  players: Player[];
  semis: Record<SemiKey, SemiFinal>;
  canStartFinal: boolean;
  onSaveResult: (raceId: string, results: RaceResults) => void;
  onToggleQualifier: (semi: SemiKey, playerId: string) => void;
  onStartFinal: () => void;
}

export const SemiFinalsView = ({
  players,
  semis,
  canStartFinal,
  onSaveResult,
  onToggleQualifier,
  onStartFinal,
}: SemiFinalsViewProps) => (
  <div className="space-y-6">
    <div className="text-center">
      <h1 className="font-gaming text-2xl text-white sm:text-3xl">Semi-finals</h1>
      <p className="mt-2 text-gray-300">
        {SEMI_RACES} Grands Prix per session · the top {QUALIFIERS_PER_SEMI} of each go to the final.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {SEMI_KEYS.map(key => (
        <SemiFinalCard
          key={key}
          semiKey={key}
          semi={semis[key]}
          players={players}
          onSaveResult={onSaveResult}
          onToggleQualifier={onToggleQualifier}
        />
      ))}
    </div>

    <div className="flex justify-center pt-4">
      <Button onClick={onStartFinal} variant="success" size="lg" disabled={!canStartFinal}>
        Start the grand final <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  </div>
);

interface SemiFinalCardProps {
  semiKey: SemiKey;
  semi: SemiFinal;
  players: Player[];
  onSaveResult: (raceId: string, results: RaceResults) => void;
  onToggleQualifier: (semi: SemiKey, playerId: string) => void;
}

const SemiFinalCard = ({ semiKey, semi, players, onSaveResult, onToggleQualifier }: SemiFinalCardProps) => {
  const standings = useMemo(() => stageStandings(players, semi.playerIds, semi.races), [players, semi]);
  const done = areRacesComplete(semi.races);
  const full = semi.qualifierIds.length >= QUALIFIERS_PER_SEMI;
  const seedOf = (playerId: string) => BRACKETS[semiKey][semi.playerIds.indexOf(playerId)];

  const qualifierColumn = {
    header: 'Final',
    render: (row: Standing) => {
      const selected = semi.qualifierIds.includes(row.player.id);
      return (
        <input
          type="checkbox"
          checked={selected}
          disabled={!selected && full}
          onChange={() => onToggleQualifier(semiKey, row.player.id)}
          className="size-5 cursor-pointer accent-green-500 disabled:cursor-not-allowed"
          aria-label={`${row.player.gamerTag} goes to the final`}
        />
      );
    },
  };

  return (
    <Card title={`Semi-final ${semiKey}`} flush>
      <div className="p-4">
        <RaceList races={semi.races} players={players} onSave={onSaveResult} />
      </div>
      <StandingsTable
        standings={standings}
        caption={`Semi-final ${semiKey} standings`}
        extraColumns={[
          { header: 'Seed', render: row => <span className="text-gray-400">{seedOf(row.player.id)}</span> },
          ...(done ? [qualifierColumn] : []),
        ]}
      />
      {done && (
        <p className="m-4 rounded-lg bg-blue-900/30 p-2 text-center text-xs text-blue-200">
          Top {QUALIFIERS_PER_SEMI} pre-selected ({semi.qualifierIds.length}/{QUALIFIERS_PER_SEMI}). Adjust if you
          played a tie-breaker.
        </p>
      )}
    </Card>
  );
};
