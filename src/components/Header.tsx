import { Check, Flag, RotateCcw, Undo2 } from 'lucide-react';
import { hasSemiFinals } from '../domain/rules';
import { PHASES, type Phase } from '../domain/types';
import { Button } from './ui/Button';

const LABELS: Record<Phase, string> = {
  REGISTRATION: 'Registration',
  CHAMPIONSHIP: 'Championship',
  SEMI_FINALS: 'Semi-finals',
  FINALS: 'Final',
};

interface HeaderProps {
  phase: Phase;
  playerCount: number;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
}

export const Header = ({ phase, playerCount, canUndo, onUndo, onReset }: HeaderProps) => {
  // The semi-finals step only exists for 8+ racers, which is settled once registration closes.
  const steps = PHASES.filter(step => step !== 'SEMI_FINALS' || phase === 'REGISTRATION' || hasSemiFinals(playerCount));
  const current = steps.indexOf(phase);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-700 bg-gray-800/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <div className="flex shrink-0 items-center gap-2">
          <Flag className="fill-current text-red-500" aria-hidden="true" />
          <span className="font-gaming text-sm tracking-tighter text-white">
            MK<span className="text-red-500">PRO</span>
          </span>
        </div>

        <nav aria-label="Tournament progress" className="min-w-0 flex-1">
          <p className="truncate text-center text-sm text-gray-300 md:hidden">
            <span className="text-gray-400">
              {current + 1}/{steps.length} ·
            </span>{' '}
            <span className="font-bold text-white">{LABELS[phase]}</span>
          </p>
          <ol className="hidden items-center justify-center gap-2 text-sm md:flex">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-6 bg-gray-600" aria-hidden="true" />}
                <span
                  aria-current={i === current ? 'step' : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                    i === current
                      ? 'bg-yellow-400/15 font-bold text-yellow-300'
                      : i < current
                        ? 'text-gray-300'
                        : 'text-gray-500'
                  }`}
                >
                  {i < current && <Check size={14} aria-hidden="true" />}
                  {LABELS[step]}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last change"
            title="Undo last change (Ctrl/⌘ Z)"
          >
            <Undo2 size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Reset tournament"
            title="Start a new tournament"
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
