'use client';
import { useState } from 'react';
import { SportIcon } from './icons';

/** Venue photo. Falls back to a flat pitch-green panel with the sport icon if there's no image or it fails to load. */
export default function VenueImage({ venue, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!venue.imageUrl || failed) {
    return (
      <div
        className={`bg-play-50 text-play-600 grid place-items-center ${className}`}
      >
        <SportIcon sport={venue.sport} className="h-12 w-12" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={venue.imageUrl}
      alt={venue.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
