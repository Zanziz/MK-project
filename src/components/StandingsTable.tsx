import { Fragment, type ReactNode } from 'react';
import { Medal, Trophy } from 'lucide-react';
import type { Standing } from '../domain/standings';
import { PlayerName } from './ui/PlayerName';

interface ExtraColumn {
  header: string;
  render: (row: Standing) => ReactNode;
}

interface StandingsTableProps {
  standings: Standing[];
  caption: string;
  /** Number of qualifying spots; draws a qualification line below them. */
  cutoff?: number;
  /** Trailing columns specific to one screen (seed, qualifier checkbox…). */
  extraColumns?: ExtraColumn[];
}

const RankCell = ({ rank, tied }: Pick<Standing, 'rank' | 'tied'>) => {
  if (rank === null) return <span className="text-gray-500">–</span>;
  const label = `Rank ${rank}${tied ? ', tied' : ''}`;
  if (rank === 1) return <Trophy className="size-5 text-yellow-400" aria-label={label} />;
  if (rank <= 3) {
    return <Medal className={`size-5 ${rank === 2 ? 'text-gray-300' : 'text-amber-600'}`} aria-label={label} />;
  }
  return (
    <span className="font-mono text-gray-400" aria-label={label}>
      #{rank}
      {tied && '='}
    </span>
  );
};

export const StandingsTable = ({ standings, caption, cutoff, extraColumns = [] }: StandingsTableProps) => {
  const hasResults = standings.some(s => s.rank !== null);
  const showCut = hasResults && cutoff !== undefined && cutoff < standings.length;

  return (
    <div className="@container">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-900 text-xs text-gray-400 uppercase">
          <tr>
            <th scope="col" className="w-14 p-3">
              Rank
            </th>
            <th scope="col" className="p-3">
              Racer
            </th>
            <th scope="col" className="hidden p-3 text-center @lg:table-cell" title="Finishing positions, best first">
              Finishes
            </th>
            <th scope="col" className="p-3 text-center" title="Grands Prix played">
              GP
            </th>
            <th scope="col" className="p-3 text-right">
              Pts
            </th>
            {extraColumns.map(column => (
              <th key={column.header} scope="col" className="p-3 text-center">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const belowCut = showCut && index >= cutoff;
            return (
              <Fragment key={row.player.id}>
                {showCut && index === cutoff && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={5 + extraColumns.length}
                      className="border-t-2 border-dashed border-yellow-500/60 px-3 py-1 text-[11px] tracking-wider text-yellow-500/80 uppercase"
                    >
                      Qualification line
                    </td>
                  </tr>
                )}
                <tr
                  className={`border-t border-gray-700 ${showCut && !belowCut ? 'bg-green-900/15' : ''} ${belowCut ? 'opacity-70' : ''}`}
                >
                  <td className="p-3">
                    <RankCell rank={row.rank} tied={row.tied} />
                  </td>
                  <td className="max-w-0 p-3">
                    <PlayerName player={row.player} />
                  </td>
                  <td className="hidden p-3 text-center font-mono text-sm text-gray-300 @lg:table-cell">
                    {row.positions.join(' · ') || '–'}
                  </td>
                  <td className="p-3 text-center text-gray-300">{row.racesPlayed}</td>
                  <td className="p-3 text-right font-mono text-lg font-bold text-yellow-400">{row.points}</td>
                  {extraColumns.map(column => (
                    <td key={column.header} className="p-3 text-center">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
