'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAdmin } from '@/components/admin/AdminContext';
import { useAdminData } from '@/components/admin/useAdminData';
import { formatPrice } from '@/lib/format';
import VenueImage from '@/components/VenueImage';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Alert, Badge, Button, EmptyState } from '@/components/ui';
export default function AdminVenuesPage() {
  const { api } = useAdmin();
  const toast = useToast();
  const venues = useAdminData((a) => a.venues(), []);
  const [busy, setBusy] = useState(null);
  const [remove, setRemove] = useState(null);
  async function toggle(v) {
    setBusy(v.id);
    try {
      await api.setVenueActive(v.id, !v.isActive);
      venues.setData(
        venues.data.map((x) =>
          x.id === v.id ? { ...x, isActive: !v.isActive } : x,
        ),
      );
      toast(v.isActive ? 'Venue deactivated' : 'Venue activated');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  }
  async function softDelete() {
    setBusy(remove.id);
    try {
      await api.deleteVenue(remove.id);
      venues.setData(venues.data.filter((v) => v.id !== remove.id));
      toast('Venue deleted. Booking history was retained.');
      setRemove(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Venues</h2>
        <Link
          href="/admin/venues/new"
          className="bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
        >
          + Add venue
        </Link>
      </div>
      {venues.loading ? (
        <div
          className="h-96 animate-pulse rounded-xl bg-slate-100"
          role="status"
          aria-label="Loading venues"
        />
      ) : venues.error ? (
        <Alert>{venues.error.message}</Alert>
      ) : venues.data.length === 0 ? (
        <EmptyState icon="stadium" title="No venues yet">
          Add your first venue to start taking bookings.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          {venues.data.map((v) => (
            <li key={v.id} className="p-4">
              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/venues/${v.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <VenueImage
                    venue={v}
                    className="h-14 w-14 shrink-0 rounded-md text-2xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{v.name}</p>
                      {!v.isActive && <Badge color="amber">Hidden</Badge>}
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      {v.sport} · {v.location}
                    </p>
                  </div>
                  <p className="hidden text-sm font-semibold sm:block">
                    {formatPrice(v.pricePerHour)}/hr
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    className="px-2 py-1.5 text-xs"
                    loading={busy === v.id}
                    onClick={() => toggle(v)}
                  >
                    {v.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1.5 text-xs text-red-600"
                    onClick={() => setRemove(v)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!remove}
        title="Delete venue?"
        confirmLabel="Delete venue"
        loading={busy === remove?.id}
        onConfirm={softDelete}
        onClose={() => setRemove(null)}
      >
        {remove?.name} will be hidden and cannot be booked anymore. Existing
        bookings stay in your records.
      </ConfirmDialog>
    </div>
  );
}
