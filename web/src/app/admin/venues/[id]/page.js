'use client';
import Link from 'next/link';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/components/admin/AdminContext';
import { useAdminData } from '@/components/admin/useAdminData';
import VenueForm from '@/components/admin/VenueForm';
import SlotManager from '@/components/admin/SlotManager';
import { Alert, Card, Loading } from '@/components/ui';

export default function EditVenuePage({ params }) {
  const { id } = use(params);
  const { api } = useAdmin();
  const created = useSearchParams().get('created');
  const venue = useAdminData((a) => a.venue(id), [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Venues
        </Link>
        <Link
          href={`/admin/bookings?venueId=${id}`}
          className="text-brand-700 text-sm font-medium"
        >
          View bookings →
        </Link>
      </div>
      {created && (
        <Alert type="success">
          Venue created. Now add some slots so customers can book it.
        </Alert>
      )}
      {venue.loading ? (
        <Loading />
      ) : venue.error ? (
        <Alert>{venue.error.message}</Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-6 lg:self-start">
            <h2 className="mb-4 font-sans text-base font-semibold">
              Venue details
            </h2>
            <VenueForm
              initial={venue.data}
              onSubmit={(data) => api.updateVenue(id, data)}
            />
          </Card>
          <SlotManager venueId={id} />
        </div>
      )}
    </div>
  );
}
