# MK Tournament Pro

Run an office Mario Kart tournament from a laptop: register racers, play the championship, the semi-finals and the grand final. Everything is saved in the browser, no backend needed.

## Format

1. **Registration**: 4 to 50 racers. Paste a whole list at once (`First name, Gamer tag` per line); the gamer tag is optional.
2. **Championship**: everyone races 3 times in Grands Prix of 3 or 4 players. The schedule avoids back-to-back races, spreads each racer's races evenly and limits repeated opponents.
3. **Semi-finals** (8+ racers): the top 8 are seeded into two balanced sessions (A: seeds 1, 3, 6, 8 · B: seeds 2, 4, 5, 7), 2 GPs each. The top 2 of each session are pre-selected for the final; the organizer can swap them after a tie-breaker.
   With fewer than 8 racers, the top 4 go straight to the final.
4. **Grand final**: 4 racers, 3 GPs, most points wins.

### Points

| Position | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th | 12th+ |
| -------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---- | ---- | ----- |
| Points   | 15  | 12  | 10  | 8   | 7   | 6   | 5   | 4   | 3   | 2    | 1    | 0     |

Positions are the in-game finishing positions (1–24, CPUs included). Ties on points are broken by countback: best finish, then second best, and so on.

## Using it

- The next Grand Prix is flagged **Up next**, the one after **Get ready**, so racers know when to grab a controller.
- Result entry is keyboard friendly: type a position, press Enter to move to the next racer, Enter on the last one saves, Escape cancels.
- Made a mistake? **Undo** (or Ctrl/⌘ Z) reverts the last change, including starting a phase.

## Development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173 (add -- --host to open it from a phone on the same network)
npm run check      # typecheck + format check + tests + build
```

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run typecheck` | TypeScript in strict mode            |
| `npm test`          | Vitest unit tests for the game logic |
| `npm run format`    | Prettier (with Tailwind class order) |
| `npm run build`     | Production build in `dist/`          |

### Structure

```
src/
  domain/      Pure game logic, fully unit-tested: rules, schedule, standings, tournament reducer, storage
  hooks/       useTournament: reducer + undo history + localStorage persistence
  components/  React views (one per phase) and shared UI
```

Stack: React 19, TypeScript, Vite, Tailwind CSS 4, Vitest, lucide-react.
