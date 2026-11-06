'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/components/admin/AdminContext';
import { useAdminData } from '@/components/admin/useAdminData';
import { statusBadge } from '@/components/BookingCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { formatDate, formatPrice, formatRange } from '@/lib/format';
import {
  Alert,
  Button,
  EmptyState,
  Input,
  Loading,
  Select,
} from '@/components/ui';
function AdminBookings() {
  const { api } = useAdmin();
  const toast = useToast();
  const params = useSearchParams();
  const [filters, setFilters] = useState({
    venueId: params.get('venueId') || '',
    date: '',
    status: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const venues = useAdminData((a) => a.venues(), []);
  const bookings = useAdminData(
    (a) => a.bookings(filters),
    Object.values(filters),
  );
  const [toCancel, setToCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value, page: 1 }));
  async function cancel() {
    setBusy(true);
    setError('');
    try {
      await api.cancelBooking(toCancel.id);
      bookings.reload();
      toast('Booking cancelled');
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      setToCancel(null);
    }
  }
  const rows = bookings.data?.data || [];
  const meta = bookings.data?.meta || { page: 1, pages: 1, total: 0 };
  const revenue = rows
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.price, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          aria-label="Search bookings"
          placeholder="Reference, name or email"
          value={filters.search}
          onChange={set('search')}
        />
        <Select
          aria-label="Venue"
          value={filters.venueId}
          onChange={set('venueId')}
          className="lg:col-span-2"
        >
          <option value="">All venues</option>
          {(venues.data || []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          aria-label="Date"
          value={filters.date}
          onChange={set('date')}
        />
        <Select
          aria-label="Status"
          value={filters.status}
          onChange={set('status')}
        >
          <option value="">Any status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      {error && <Alert>{error}</Alert>}
      {bookings.loading && !bookings.data ? (
        <Loading />
      ) : bookings.error ? (
        <Alert>{bookings.error.message}</Alert>
      ) : rows.length === 0 ? (
        <EmptyState icon="calendar" title="No bookings match these filters" />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {meta.total} booking{meta.total === 1 ? '' : 's'} · confirmed value{' '}
            {formatPrice(revenue)} (this page)
          </p>
          <div className="hidden overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Admin booking results</caption>
              <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  {[
                    'Reference',
                    'Venue',
                    'When',
                    'Customer',
                    'Price',
                    'Status',
                    '',
                  ].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      {b.reference}
                    </td>
                    <td className="px-4 py-3 font-medium">{b.venueName}</td>
                    <td className="px-4 py-3">
                      {formatDate(b.date)}
                      <br />
                      <span className="text-slate-500">
                        {formatRange(b.startTime, b.endTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.name}
                      <br />
                      <span className="text-slate-500">
                        {b.email} · {b.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatPrice(b.price)}</td>
                    <td className="px-4 py-3">{statusBadge(b)}</td>
                    <td className="px-4 py-3 text-right">
                      {b.canCancel && (
                        <Button
                          variant="danger"
                          className="px-3 py-1.5"
                          onClick={() => setToCancel(b)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {rows.map((b) => (
              <li
                key={b.id}
                className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{b.venueName}</p>
                  {statusBadge(b)}
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {b.reference}
                </p>
                <p className="mt-1 text-slate-600">
                  {formatDate(b.date)} · {formatRange(b.startTime, b.endTime)}
                </p>
                <p className="mt-1 text-slate-500">
                  {b.name} · {b.email} · {b.phone}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold">{formatPrice(b.price)}</span>
                  {b.canCancel && (
                    <Button
                      variant="danger"
                      className="px-3 py-1.5"
                      onClick={() => setToCancel(b)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <nav
            aria-label="Booking pages"
            className="flex items-center justify-between border-t border-slate-200 pt-4"
          >
            <Button
              variant="secondary"
              disabled={meta.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {meta.page} of {meta.pages}
            </span>
            <Button
              variant="secondary"
              disabled={meta.page >= meta.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Next
            </Button>
          </nav>
        </>
      )}
      <ConfirmDialog
        open={!!toCancel}
        title="Cancel booking?"
        confirmLabel="Cancel booking"
        loading={busy}
        onConfirm={cancel}
        onClose={() => setToCancel(null)}
      >
        {toCancel && (
          <>
            {toCancel.reference} for {toCancel.name} at {toCancel.venueName}.
            The slot becomes bookable again.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminBookings />
    </Suspense>
  );
}
