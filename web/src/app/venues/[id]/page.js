'use client';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import {
  forgetBooking,
  saveBooking,
  savedReferenceFor,
} from '@/lib/savedBookings';
import { formatPrice, formatRange, todayISO } from '@/lib/format';
import DateStrip from '@/components/DateStrip';
import SlotGrid from '@/components/SlotGrid';
import BookingForm from '@/components/BookingForm';
import BookingSuccess from '@/components/BookingSuccess';
import { SportIcon } from '@/components/icons';
import VenueImage from '@/components/VenueImage';
import DetailSkeleton from '@/components/LoadingSkeletons';
import { Alert, Button, Card, EmptyState, Loading } from '@/components/ui';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Mirror page state into the query string (?date=…&booking=…) so a refresh or
 * shared link restores the same day and the confirmation panel.
 */
function syncUrl(updates) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, '', url);
}

export default function VenuePage({ params, searchParams }) {
  const { id } = use(params);
  const query = use(searchParams);
  const [date, setDate] = useState(() => {
    const today = todayISO();
    const fromUrl = typeof query.date === 'string' ? query.date : '';
    return ISO_DATE.test(fromUrl) && fromUrl >= today ? fromUrl : today;
  });
  const [selected, setSelected] = useState(null);
  const [booking, setBookingState] = useState(null);

  const setBooking = (b) => {
    setBookingState(b);
    syncUrl({ booking: b?.reference });
  };

  // After a refresh, reload the confirmed booking from the server.
  useEffect(() => {
    const ref = typeof query.booking === 'string' ? query.booking : '';
    if (!ref) return;
    let active = true;
    api
      .confirmation(ref)
      .then((b) => {
        if (!active) return;
        if (String(b.venueId) !== String(id) || b.status === 'cancelled') {
          syncUrl({ booking: null });
          return;
        }
        setBookingState(b);
        setDate(b.date);
        syncUrl({ date: b.date });
      })
      .catch(() => active && syncUrl({ booking: null }));
    return () => {
      active = false;
    };
    // Only on first load; later changes are written by setBooking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [notice, setNotice] = useState('');
  const formRef = useRef(null);
  const [formVisible, setFormVisible] = useState(false);

  // Hide the mobile sticky bar while the booking form itself is on screen.
  useEffect(() => {
    const el = formRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  });

  const venue = useAsync(() => api.venue(id), [id]);
  const slots = useAsync(() => api.slots(id, date), [id, date]);

  const changeDate = (d) => {
    setDate(d);
    syncUrl({ date: d });
    setSelected(null);
    setNotice('');
  };

  // Clicking a "Your booking" slot reopens that booking's confirmation.
  async function openMine(slot) {
    const ref = savedReferenceFor(id, date, slot.startTime);
    if (!ref) return;
    try {
      const b = await api.confirmation(ref);
      if (b.status === 'cancelled') {
        forgetBooking(ref);
        setNotice('That booking was cancelled.');
        slots.reload();
        return;
      }
      setSelected(null);
      setNotice('');
      setBooking(b);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      if (err.status === 404) forgetBooking(ref);
      setNotice(err.message);
      slots.reload();
    }
  }

  async function submit(details) {
    try {
      const created = await api.book({
        venueId: Number(id),
        date,
        startTime: selected.startTime,
        ...details,
      });
      saveBooking(created);
      setBooking(created);
      setSelected(null);
      slots.reload();
    } catch (err) {
      if (err.status === 409) {
        // someone else got it first
        setSelected(null);
        setNotice(err.message);
        slots.reload();
        return;
      }
      throw err;
    }
  }

  if (venue.loading) return <DetailSkeleton />;
  if (venue.error) {
    return (
      <EmptyState
        icon="stadium"
        title={
          venue.error.status === 404
            ? 'Venue not found'
            : 'Could not load venue'
        }
        action={
          <Link href="/" className="text-brand-700 text-sm font-semibold">
            ← Back to venues
          </Link>
        }
      >
        {venue.error.status === 404
          ? 'It may have been removed or is no longer listed.'
          : venue.error.message}
      </EmptyState>
    );
  }
  const v = venue.data;

  return (
    <div className="pb-24 lg:pb-0">
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← All venues
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {v.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{v.location}</p>
              </div>
              <p className="text-lg font-bold">
                {formatPrice(v.pricePerHour)}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  / hour
                </span>
              </p>
            </div>
            <VenueImage
              venue={v}
              className="mt-4 h-56 w-full rounded-2xl sm:h-96"
            />
            <div className="mt-6 space-y-6 sm:px-2">
              <div>
                <h2 className="text-lg font-bold">Sports available</h2>
                <span className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold">
                  <SportIcon sport={v.sport} className="h-4 w-4" /> {v.sport}
                </span>
              </div>
              {v.description && (
                <div>
                  <h2 className="text-lg font-bold">About</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {v.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Card className="space-y-5 p-4 sm:p-6">
            <h2 className="text-lg font-bold">Pick a date and time</h2>
            <DateStrip value={date} onChange={changeDate} />
            {notice && <Alert>{notice}</Alert>}
            {slots.loading && !slots.data ? (
              <Loading label="Checking availability…" />
            ) : slots.error ? (
              <Alert>{slots.error.message}</Alert>
            ) : (
              <SlotGrid
                slots={slots.data}
                selected={selected}
                isMine={(s) => !!savedReferenceFor(id, date, s.startTime)}
                onOpenMine={openMine}
                onSelect={(s) => {
                  setSelected(s);
                  setBooking(null);
                  setNotice('');
                }}
              />
            )}
          </Card>
        </div>

        <aside
          ref={formRef}
          className="min-w-0 scroll-mt-20 lg:sticky lg:top-24 lg:self-start"
        >
          <Card className="p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-slate-100 sm:p-6">
            {booking ? (
              <BookingSuccess
                booking={booking}
                onDone={() => setBooking(null)}
              />
            ) : (
              <>
                <h2 className="mb-4 text-lg font-bold">Book a slot</h2>
                <BookingForm
                  venue={v}
                  date={date}
                  slot={selected}
                  onSubmit={submit}
                />
              </>
            )}
          </Card>
        </aside>
      </div>

      {/* Mobile: sticky bar so the selected slot and CTA are always reachable. */}
      {selected && !booking && !formVisible && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-3 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold">
                {formatRange(selected.startTime, selected.endTime)}
              </p>
              <p className="text-slate-500">{formatPrice(selected.price)}</p>
            </div>
            <Button
              className="px-8 py-3"
              onClick={() =>
                formRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
