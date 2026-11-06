'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatRange } from '@/lib/format';
import { forgetBooking } from '@/lib/savedBookings';
import BookingCard from '@/components/BookingCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Alert, Button, Field, Input, Loading } from '@/components/ui';

function Confirmation() {
  const params = useSearchParams();
  const refParam = (params.get('ref') || '').trim().toUpperCase();
  const [reference, setReference] = useState(refParam);
  const [state, setState] = useState({
    loading: false,
    data: null,
    error: null,
  });
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(null);

  const lookup = useCallback(async (value) => {
    setMessage(null);
    setState({ loading: true, data: null, error: null });
    try {
      setState({
        loading: false,
        data: await api.confirmation(value),
        error: null,
      });
      // Keep the URL shareable and refresh-safe.
      window.history.replaceState(
        null,
        '',
        `/confirmation?ref=${encodeURIComponent(value)}`,
      );
    } catch (error) {
      setState({ loading: false, data: null, error });
    }
  }, []);

  useEffect(() => {
    if (refParam) lookup(refParam);
  }, [refParam, lookup]);

  async function cancel() {
    setCancelling(true);
    try {
      const updated = await api.cancelByReference(state.data.reference);
      forgetBooking(updated.reference);
      setState((s) => ({ ...s, data: updated }));
      setMessage({
        type: 'success',
        text: 'Booking cancelled. The slot is free for others again.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  const b = state.data;
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find your booking</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the reference shown on your confirmation.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(reference.trim().toUpperCase());
        }}
        className="space-y-4"
      >
        <Field label="Booking reference" htmlFor="booking-reference">
          <Input
            id="booking-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="PS-12AB34CD"
            pattern="PS-[A-Za-z0-9]{8}"
            autoCapitalize="characters"
            required
          />
        </Field>
        <Button type="submit" className="w-full" loading={state.loading}>
          Find booking
        </Button>
      </form>
      {message && <Alert type={message.type}>{message.text}</Alert>}
      {state.error && <Alert>{state.error.message}</Alert>}
      {b && (
        <div className="space-y-3">
          <BookingCard booking={b} onCancel={() => setConfirming(true)} />
          <Link
            className="text-play-600 inline-block text-sm font-semibold"
            href={`/bookings?email=${encodeURIComponent(b.email)}`}
          >
            See all bookings for this email →
          </Link>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title="Cancel this booking?"
        confirmLabel="Yes, cancel"
        loading={cancelling}
        onConfirm={cancel}
        onClose={() => setConfirming(false)}
      >
        {b && (
          <>
            {b.venueName} on {formatDate(b.date)},{' '}
            {formatRange(b.startTime, b.endTime)}. This can&apos;t be undone.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Confirmation />
    </Suspense>
  );
}
