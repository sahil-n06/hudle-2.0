'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/admin/AdminContext';
import VenueForm from '@/components/admin/VenueForm';
import { Card } from '@/components/ui';

export default function NewVenuePage() {
  const { api } = useAdmin();
  const router = useRouter();
  return (
    <div className="space-y-4">
      <Link
        href="/admin"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Venues
      </Link>
      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 font-sans text-base font-semibold">Add venue</h2>
        <VenueForm
          submitLabel="Create venue"
          onSubmit={async (data) => {
            const venue = await api.createVenue(data);
            router.push(`/admin/venues/${venue.id}?created=1`);
          }}
        />
      </Card>
    </div>
  );
}
