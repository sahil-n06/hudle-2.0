'use client';
import { SportIcon } from './icons';
import { cx } from './ui';

/** "Explore sports" tiles: a tall card with the name on top and a big icon on a soft court-coloured floor. */
export default function SportTiles({ sports, active, onPick }) {
  if (!sports.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-6 sm:px-0">
      {sports.map((s) => {
        const on = active === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(on ? '' : s)}
            className={cx(
              'flex h-32 w-28 shrink-0 flex-col items-center justify-between overflow-hidden rounded-xl border pt-3 transition sm:w-auto',
              on
                ? 'border-slate-900 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-400',
            )}
          >
            <span className="text-sm font-bold">{s}</span>
            <span className="to-play-50 text-play-600 grid w-full flex-1 place-items-center bg-gradient-to-b from-white">
              <SportIcon sport={s} className="h-12 w-12" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
