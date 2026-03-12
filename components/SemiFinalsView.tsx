import React, { useState } from 'react';
import { Player, SemiFinalSession, RaceContext, getPoints } from '../types';
import { RaceResultInput } from './RaceResultInput';
import { Button } from './Button';
import { Card } from './Card';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface SemiFinalsViewProps {
  players: Player[];
  session1: SemiFinalSession;
  session2: SemiFinalSession;
  onUpdateRaceResult: (raceId: string, results: Record<string, number>, context: RaceContext) => void;
  onToggleSemiQualifier: (sessionId: 'session1' | 'session2', playerId: string) => void;
  onStartFinals: () => void;
}

const getSessionScore = (session: SemiFinalSession, playerId: string): number => {
  let score = 0;
  session.races.forEach(r => {
    if (r.results[playerId]) score += getPoints(r.results[playerId]);
  });
  return score;
};

export const SemiFinalsView: React.FC<SemiFinalsViewProps> = ({
  players,
  session1,
  session2,
  onUpdateRaceResult,
  onToggleSemiQualifier,
  onStartFinals,
}) => {
  const [editingRace, setEditingRace] = useState<{ sid: 'session1' | 'session2'; rid: string } | null>(null);

  const renderSession = (sessionKey: 'session1' | 'session2') => {
    const session = sessionKey === 'session1' ? session1 : session2;

    const sessionPlayers = session.playerIds.map(pid => {
      const original = players.find(p => p.id === pid)!;
      return { ...original, score: getSessionScore(session, pid) };
    }).sort((a, b) => b.score - a.score);

    const allRacesDone = session.races.every(r => r.isCompleted);

    return (
      <Card title={session.name} className="h-full flex flex-col">
        <div className="flex-1 space-y-4">
          {/* Races */}
          <div className="space-y-2">
            {session.races.map(race => (
              <div key={race.id}>
                {editingRace?.rid === race.id ? (
                  <div className="border border-blue-500 rounded p-2">
                    <RaceResultInput
                      race={race}
                      players={players}
                      onSave={(rid, res) => {
                        onUpdateRaceResult(rid, res, { type: 'semi', sessionId: sessionKey });
                        setEditingRace(null);
                      }}
                      onCancel={() => setEditingRace(null)}
                    />
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingRace({ sid: sessionKey, rid: race.id })}
                    onKeyDown={e => e.key === 'Enter' && setEditingRace({ sid: sessionKey, rid: race.id })}
                    className={`p-3 rounded border cursor-pointer flex justify-between items-center ${
                      race.isCompleted
                        ? 'bg-gray-900 border-green-800'
                        : 'bg-gray-700 border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    <span className="font-bold text-sm">{race.name}</span>
                    {race.isCompleted
                      ? <CheckCircle size={14} className="text-green-500" />
                      : <span className="text-xs text-gray-400">Tap to enter</span>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mini Leaderboard for Session */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Session Standings</h4>
            <table className="w-full text-sm">
              <tbody>
                {sessionPlayers.map((p, idx) => (
                  <tr key={p.id} className="border-b border-gray-700 last:border-0">
                    <td className="py-2 text-gray-400 w-6">#{idx + 1}</td>
                    <td className="py-2 font-bold">{p.gamerTag}</td>
                    <td className="py-2 text-right font-mono text-yellow-400">{p.score} pts</td>
                    {allRacesDone && (
                      <td className="py-2 text-right pl-2">
                        <input
                          type="checkbox"
                          checked={session.manualQualifiers.includes(p.id)}
                          onChange={() => onToggleSemiQualifier(sessionKey, p.id)}
                          className="w-5 h-5 accent-green-500 cursor-pointer"
                          aria-label={`Select ${p.gamerTag} as qualifier`}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {allRacesDone && (
              <p className="text-xs text-center text-blue-300 mt-2 bg-blue-900/20 p-2 rounded">
                Select 2 qualifiers ({session.manualQualifiers.length}/2)
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-gaming text-white">Semi-Finals</h2>
        <p className="text-gray-400">Playoff Format. Top 2 from each session advance.</p>
      </div>

      {(session1.playerIds.length < 4 || session2.playerIds.length < 4) && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 text-center text-yellow-300 text-sm">
          Warning: one or more sessions have fewer than 4 players due to insufficient qualifiers.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {renderSession('session1')}
        {renderSession('session2')}
      </div>

      <div className="flex justify-center pt-6">
        <Button
          onClick={onStartFinals}
          variant="success"
          className="px-8 text-lg"
          disabled={session1.manualQualifiers.length !== 2 || session2.manualQualifiers.length !== 2}
        >
          Start Grand Final <ArrowRight className="inline ml-2" />
        </Button>
      </div>
    </div>
  );
};
