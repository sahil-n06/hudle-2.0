import Link from 'next/link';
import { formatDate, formatPrice, formatRange } from '@/lib/format';
import { SportIcon } from './icons';
import { Badge, Button } from './ui';

export function statusBadge(b) {
  if (b.status === 'cancelled') return <Badge color="red">Cancelled</Badge>;
  return b.isUpcoming ? (
    <Badge color="green">Upcoming</Badge>
  ) : (
    <Badge>Completed</Badge>
  );
}

export default function BookingCard({ booking: b, onCancel }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:p-5">
      <div className="bg-play-50 text-play-600 grid h-12 w-12 shrink-0 place-items-center rounded-lg">
        <SportIcon sport={b.sport} className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/venues/${b.venueId}`}
            className="hover:text-brand-700 font-semibold"
          >
            {b.venueName}
          </Link>
          {statusBadge(b)}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {formatDate(b.date)} · {formatRange(b.startTime, b.endTime)}
        </p>
        <p className="text-xs text-slate-400">
          {b.reference} · {b.location}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-bold">{formatPrice(b.price)}</p>
        {b.canCancel && (
          <Button
            variant="danger"
            className="px-3 py-1.5"
            onClick={() => onCancel(b)}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
