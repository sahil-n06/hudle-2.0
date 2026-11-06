'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatRange } from '@/lib/format';
import { forgetBooking } from '@/lib/savedBookings';
import BookingCard from '@/components/BookingCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Alert,
  Button,
  EmptyState,
  Field,
  Input,
  Loading,
  cx,
} from '@/components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1 and 2: prove the email belongs to you with a one-time code. */
function VerifyEmail({ initialEmail, onVerified }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode(e) {
    e?.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError('Enter the email you used when booking');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.requestAccessCode(value);
      setEmail(value);
      setDevCode(res.devCode || '');
      setCode('');
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.verifyAccessCode(email, code.trim());
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === 'email') {
    return (
      <form
        onSubmit={sendCode}
        noValidate
        className="space-y-3 rounded-lg bg-white p-4 ring-1 ring-slate-200"
      >
        <Field
          label="Email"
          htmlFor="lookup-email"
          error={error}
          hint="We'll email you a 6-digit code to confirm it's you."
        >
          <Input
            id="lookup-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={error}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
          />
        </Field>
        <Button type="submit" loading={busy}>
          Send code
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={verify}
      noValidate
      className="space-y-3 rounded-lg bg-white p-4 ring-1 ring-slate-200"
    >
      <p className="text-sm text-slate-600">
        We sent a 6-digit code to <strong>{email}</strong>. It expires in 10
        minutes.
      </p>
      {devCode && (
        <Alert type="info">
          Development mode (no email server): your code is{' '}
          <strong className="font-mono">{devCode}</strong>. It is also printed
          in the API terminal.
        </Alert>
      )}
      <Field label="Code" htmlFor="access-code" error={error}>
        <Input
          id="access-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          error={error}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={busy}>
          Verify
        </Button>
        <Button type="button" variant="secondary" onClick={() => sendCode()}>
          Resend code
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setStep('email');
            setError('');
          }}
        >
          Change email
        </Button>
      </div>
    </form>
  );
}

function MyBookings() {
  const params = useSearchParams();
  const emailParam = params.get('email') || '';
  // checking → (signed out → verify) → signed in
  const [state, setState] = useState({ status: 'checking' });
  const [tab, setTab] = useState('upcoming');
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(
    async (checkLinkEmail = false) => {
      try {
        const res = await api.myBookings();
        // Opening a link for a different email than the signed-in one asks to
        // verify again (only on first load, so verifying another email works).
        if (
          checkLinkEmail &&
          emailParam &&
          emailParam.toLowerCase() !== res.meta.email
        ) {
          await api.signOutCustomer();
          setState({ status: 'signedOut' });
          return;
        }
        setState({ status: 'signedIn', email: res.meta.email, data: res.data });
      } catch (error) {
        setState(
          error.status === 401
            ? { status: 'signedOut' }
            : { status: 'error', error },
        );
      }
    },
    [emailParam],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  async function signOut() {
    await api.signOutCustomer().catch(() => {});
    setMessage(null);
    setState({ status: 'signedOut' });
  }

  async function confirmCancel() {
    setCancelling(true);
    try {
      const updated = await api.cancel(toCancel.id);
      forgetBooking(updated.reference);
      setState((s) => ({
        ...s,
        data: s.data.map((b) => (b.id === updated.id ? updated : b)),
      }));
      setMessage({
        type: 'success',
        text: `Booking ${updated.reference} cancelled. The slot is free for others again.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      load();
    } finally {
      setCancelling(false);
      setToCancel(null);
    }
  }

  const all = state.data || [];
  const upcoming = all
    .filter((b) => b.status === 'confirmed' && b.isUpcoming)
    .sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    );
  const past = all.filter((b) => !(b.status === 'confirmed' && b.isUpcoming));
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {state.status === 'signedIn'
              ? `Showing bookings for ${state.email}.`
              : 'Confirm your email to see and manage your bookings.'}
          </p>
        </div>
        {state.status === 'signedIn' && (
          <Button variant="secondary" onClick={signOut}>
            Use another email
          </Button>
        )}
      </div>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      {state.status === 'checking' && <Loading label="Loading…" />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'signedOut' && (
        <>
          <VerifyEmail initialEmail={emailParam} onVerified={() => load()} />
          <p className="text-sm text-slate-500">
            Have a booking reference?{' '}
            <Link href="/confirmation" className="text-brand-700 font-semibold">
              Look it up instead →
            </Link>
          </p>
        </>
      )}

      {state.status === 'signedIn' &&
        (all.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="No bookings found"
            action={
              <Link href="/" className="text-brand-700 text-sm font-semibold">
                Browse venues →
              </Link>
            }
          >
            We couldn&apos;t find any bookings for {state.email}.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <div
              className="inline-flex rounded-full bg-slate-100 p-1"
              role="tablist"
            >
              {[
                ['upcoming', `Upcoming (${upcoming.length})`],
                ['past', `Past & cancelled (${past.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cx(
                    'rounded-full px-3 py-1.5 text-sm font-semibold transition',
                    tab === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <EmptyState
                icon="ticket"
                title={
                  tab === 'upcoming'
                    ? 'No upcoming bookings'
                    : 'Nothing here yet'
                }
              >
                {tab === 'upcoming'
                  ? 'Book a slot and it will show up here.'
                  : 'Past and cancelled bookings appear here.'}
              </EmptyState>
            ) : (
              shown.map((b) => (
                <BookingCard key={b.id} booking={b} onCancel={setToCancel} />
              ))
            )}
          </div>
        ))}

      <ConfirmDialog
        open={!!toCancel}
        title="Cancel this booking?"
        confirmLabel="Yes, cancel"
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => setToCancel(null)}
      >
        {toCancel && (
          <>
            {toCancel.venueName} on {formatDate(toCancel.date)},{' '}
            {formatRange(toCancel.startTime, toCancel.endTime)}. This can&apos;t
            be undone.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MyBookings />
    </Suspense>
  );
}
