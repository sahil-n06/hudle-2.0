'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import SportTiles from '@/components/SportTiles';
import VenueCard from '@/components/VenueCard';
import VenueFilters from '@/components/VenueFilters';
import { VenueSkeletons } from '@/components/LoadingSkeletons';
import { Alert, Button, EmptyState } from '@/components/ui';

/** Debounce a value so typing in the search box doesn't fire a request per key. */
function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function VenuesPage() {
  const [filters, setFilters] = useState({ q: '', sport: '', location: '' });
  const debounced = useDebounced(filters);
  const options = useAsync(() => api.venueFilters(), []);
  const venues = useAsync(
    () => api.venues(debounced),
    [debounced.q, debounced.sport, debounced.location],
  );
  const opts = options.data || { sports: [], cities: [] };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Explore sports</h1>
        <SportTiles
          sports={opts.sports}
          active={filters.sport}
          onPick={(sport) => setFilters({ ...filters, sport })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          {filters.sport ? `${filters.sport} venues` : 'Venues near you'}
          {filters.location && (
            <span className="text-slate-400"> in {filters.location}</span>
          )}
        </h2>
        <VenueFilters value={filters} onChange={setFilters} options={opts} />

        {venues.loading && !venues.data ? (
          <VenueSkeletons />
        ) : venues.error ? (
          <Alert>
            {venues.error.message}{' '}
            <button className="ml-2 underline" onClick={venues.reload}>
              Retry
            </button>
          </Alert>
        ) : venues.data.length === 0 ? (
          <EmptyState
            title="No venues match your search"
            action={
              <Button
                variant="secondary"
                onClick={() => setFilters({ q: '', sport: '', location: '' })}
              >
                Clear filters
              </Button>
            }
          >
            Try a different sport or city.
          </EmptyState>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              {venues.data.length} venue{venues.data.length === 1 ? '' : 's'}{' '}
              found
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {venues.data.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
