import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import VenueImage from './VenueImage';

export default function VenueCard({ venue }) {
  const city = venue.location.split(',').pop().trim();
  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="overflow-hidden">
        <VenueImage
          venue={venue}
          className="aspect-[16/10] w-full transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="leading-snug font-bold text-slate-900">{venue.name}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {venue.location.replace(`, ${city}`, '')} • {city}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {venue.sport}
          </span>
        </div>
        <p className="mt-auto pt-3 text-sm text-slate-500">
          <span className="font-bold text-slate-900">
            {formatPrice(venue.pricePerHour)}
          </span>{' '}
          onwards / hr
        </p>
      </div>
    </Link>
  );
}
