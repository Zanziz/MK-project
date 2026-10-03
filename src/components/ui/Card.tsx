import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  /** Drops the body padding, for content that runs edge to edge such as tables. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export const Card = ({ title, actions, flush = false, className = '', children }: CardProps) => (
  <section className={`overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl ${className}`}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 border-b border-gray-700 bg-gray-900/50 px-4 py-3">
        {title && <h2 className="text-lg font-bold text-gray-100">{title}</h2>}
        {actions}
      </header>
    )}
    <div className={flush ? '' : 'p-4'}>{children}</div>
  </section>
);
