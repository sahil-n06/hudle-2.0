'use client';
import { Icon } from './icons';
import { cx } from './ui';

// Pill-shaped controls: a rounded search bar with a row of chip dropdowns under it.
const chip = (active) =>
  cx(
    'h-9 cursor-pointer appearance-none rounded-full border bg-white pl-3.5 pr-8 text-sm font-medium outline-none transition-colors',
    'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27%2364748b%27%3E%3Cpath d=%27M5.5 7.5 10 12l4.5-4.5%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat',
    'focus-visible:ring-2 focus-visible:ring-accent-100',
    active
      ? 'border-slate-900 text-slate-900'
      : 'border-slate-300 text-slate-700 hover:border-slate-500',
  );

export default function VenueFilters({ value, options, onChange }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const hasFilters = value.q || value.sport || value.location;

  return (
    <div className="space-y-3">
      <label className="focus-within:border-accent-500 focus-within:ring-accent-100 flex h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 transition-colors focus-within:ring-2">
        <Icon name="search" className="text-accent-500 h-5 w-5" />
        <input
          type="search"
          placeholder="Search venues, sports or areas"
          aria-label="Search"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          value={value.q}
          onChange={set('q')}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Sport"
          className={chip(value.sport)}
          value={value.sport}
          onChange={set('sport')}
        >
          <option value="">All sports</option>
          {options.sports.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="City"
          className={chip(value.location)}
          value={value.location}
          onChange={set('location')}
        >
          <option value="">All cities</option>
          {options.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            className="text-accent-600 hover:bg-accent-50 h-9 rounded-full px-3 text-sm font-semibold"
            onClick={() => onChange({ q: '', sport: '', location: '' })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
