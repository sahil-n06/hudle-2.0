'use client';
import { formatPrice, formatRange } from '@/lib/format';
import { cx, EmptyState } from './ui';

const LABEL = { booked: 'Booked', past: 'Unavailable' };

/**
 * `isMine(slot)` marks booked slots made from this browser; clicking one calls
 * `onOpenMine(slot)` to show that booking.
 */
export default function SlotGrid({
  slots,
  selected,
  onSelect,
  isMine = () => false,
  onOpenMine,
}) {
  if (!slots.length) {
    return (
      <EmptyState icon="calendar" title="No slots on this date">
        This venue has no slots scheduled for the selected day. Try another
        date.
      </EmptyState>
    );
  }
  const available = slots.filter((s) => s.status === 'available').length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        {available
          ? `${available} of ${slots.length} slots available`
          : 'All slots are taken for this day'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {slots.map((s) => {
          const isSelected = selected?.startTime === s.startTime;
          const mine = s.status === 'booked' && isMine(s);
          const disabled = s.status !== 'available' && !mine;
          return (
            <button
              key={s.startTime}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() =>
                mine ? onOpenMine?.(s) : onSelect(isSelected ? null : s)
              }
              className={cx(
                'rounded-lg px-3 py-3 text-left text-sm ring-1 transition',
                disabled &&
                  'cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200',
                !disabled &&
                  !isSelected &&
                  !mine &&
                  'bg-white text-slate-800 ring-slate-200 hover:ring-slate-900',
                mine && 'bg-play-50 text-play-600 ring-play-600 hover:bg-white',
                isSelected && 'bg-brand-700 ring-brand-700 text-white',
              )}
            >
              <span className="block font-semibold">
                {formatRange(s.startTime, s.endTime)}
              </span>
              <span
                className={cx(
                  'block text-xs',
                  isSelected
                    ? 'text-brand-50'
                    : disabled || mine
                      ? ''
                      : 'text-slate-500',
                )}
              >
                {mine
                  ? 'Your booking'
                  : disabled
                    ? LABEL[s.status]
                    : formatPrice(s.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
