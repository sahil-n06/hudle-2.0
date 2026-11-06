'use client';
import { addDays, formatDate, todayISO } from '@/lib/format';
import { cx } from './ui';

export const MAX_DAYS_AHEAD = 60;

/** Horizontal list of the next 14 days plus a native picker for later dates. */
export default function DateStrip({ value, onChange }) {
  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const max = addDays(today, MAX_DAYS_AHEAD);

  return (
    <div className="space-y-3">
      <div
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        role="listbox"
        aria-label="Choose a date"
      >
        {days.map((d, i) => {
          const selected = d === value;
          return (
            <button
              key={d}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(d)}
              className={cx(
                'flex min-w-16 shrink-0 flex-col items-center rounded-xl px-3 py-2 text-sm ring-1 transition',
                selected
                  ? 'bg-brand-700 ring-brand-700 text-white'
                  : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-900',
              )}
            >
              <span
                className={cx(
                  'text-xs',
                  selected ? 'text-brand-50' : 'text-slate-500',
                )}
              >
                {i === 0 ? 'Today' : formatDate(d, { weekday: 'short' })}
              </span>
              <span className="text-lg leading-tight font-semibold">
                {formatDate(d, { day: 'numeric' })}
              </span>
              <span
                className={cx(
                  'text-xs',
                  selected ? 'text-brand-50' : 'text-slate-500',
                )}
              >
                {formatDate(d, { month: 'short' })}
              </span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Or pick a date:
        <input
          type="date"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
          min={today}
          max={max}
          value={value}
          onChange={(e) =>
            e.target.value &&
            e.target.value >= today &&
            e.target.value <= max &&
            onChange(e.target.value)
          }
        />
      </label>
    </div>
  );
}
