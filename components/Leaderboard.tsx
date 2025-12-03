import React from 'react';
import { Player } from '../types';
import { Trophy, Medal, Flag } from 'lucide-react';

interface LeaderboardProps {
  players: Player[];
  highlightTop?: number; // Highlight the top N players (e.g., 8 for semis)
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, highlightTop = 0, compact = false }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="font-mono text-gray-500">#{index + 1}</span>;
  };

  return (
    <div className="overflow-hidden rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
          <tr>
            <th className="p-3">Rank</th>
            <th className="p-3">Racer</th>
            <th className="p-3 text-center">GP</th>
            <th className="p-3 text-right">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedPlayers.map((player, index) => {
            const isQualifying = highlightTop > 0 && index < highlightTop;
            const isEliminated = highlightTop > 0 && index >= highlightTop;

            return (
              <tr 
                key={player.id} 
                className={`
                  ${isQualifying ? 'bg-green-900/20' : 'bg-gray-800'} 
                  ${isEliminated ? 'opacity-60' : ''}
                  hover:bg-gray-700 transition-colors
                `}
              >
                <td className="p-3 font-bold flex items-center gap-2">
                  {getRankIcon(index)}
                </td>
                <td className="p-3">
                  <div className="font-bold text-white">{player.gamerTag}</div>
                  {!compact && <div className="text-xs text-gray-400">{player.firstName}</div>}
                  {isQualifying && !compact && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">
                      Qualifying
                    </span>
                  )}
                </td>
                <td className="p-3 text-center text-gray-300">
                  {player.racesPlayed}
                </td>
                <td className="p-3 text-right font-mono text-lg font-bold text-yellow-400">
                  {player.score}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};