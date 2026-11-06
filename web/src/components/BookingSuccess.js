import Link from 'next/link';
import { formatDate, formatPrice, formatRange } from '@/lib/format';
import { Button } from './ui';
import { Icon } from './icons';

export default function BookingSuccess({ booking, onDone }) {
  return (
    <div className="space-y-4 text-center" role="status">
      <div className="bg-play-600 mx-auto grid h-12 w-12 place-items-center rounded-full text-white">
        <Icon name="check" className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">You&apos;re booked in</h3>
        <p className="mt-1 text-sm text-slate-500">
          Booking {booking.reference}
        </p>
      </div>
      <div className="rounded-xl bg-slate-50 p-4 text-left text-sm">
        <p className="font-semibold">{booking.venueName}</p>
        <p className="text-slate-600">
          {formatDate(booking.date)} ·{' '}
          {formatRange(booking.startTime, booking.endTime)}
        </p>
        <p className="mt-1 text-slate-600">
          {booking.name} · {booking.email}
        </p>
        <p className="text-brand-700 mt-2 font-bold">
          {formatPrice(booking.price)}
        </p>
      </div>
      <p className="text-xs text-slate-500">
        Save this reference. Anyone with it can view or cancel this booking.{' '}
        <Link
          href={`/confirmation?ref=${encodeURIComponent(booking.reference)}`}
          className="text-brand-700 font-semibold"
        >
          Manage this booking
        </Link>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/bookings?email=${encodeURIComponent(booking.email)}`}
          className="bg-brand-600 inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-white hover:bg-black"
        >
          View my bookings
        </Link>
        {onDone && (
          <Button variant="secondary" className="flex-1" onClick={onDone}>
            Book another slot
          </Button>
        )}
      </div>
    </div>
  );
}
