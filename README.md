# MK Tournament Pro

A professional Mario Kart tournament organizer for office competitions.

## Features

- **Registration** — Add up to 50 players with name and gamer tag
- **Championship** — Automated round-robin schedule (each player races 3 times in groups of 4), live leaderboard, top 8 qualify
- **Semi-Finals** — Two sessions of 4 players (seeded bracket), 2 GPs each, admin selects 2 qualifiers per session
- **Grand Final** — 4 players, 3 GPs, winner determined by cumulative points

## Points System

| Position | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th | 12th+ |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|-------|
| Points   | 15  | 12  | 10  | 8   | 7   | 6   | 5   | 4   | 3   | 2    | 1    | 0     |

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173)

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- lucide-react (icons)
- State persisted in `localStorage` (no backend required)
