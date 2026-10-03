import type { Player } from '../../domain/types';

/** Gamer tag in bold, with the first name underneath when it differs. */
export const PlayerName = ({ player }: { player: Player | undefined }) => (
  <span className="block min-w-0">
    <span className="block truncate font-bold text-white">{player?.gamerTag ?? '?'}</span>
    {player && player.firstName !== player.gamerTag && (
      <span className="block truncate text-xs font-normal text-gray-400">{player.firstName}</span>
    )}
  </span>
);
