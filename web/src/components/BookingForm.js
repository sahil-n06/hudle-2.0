'use client';
import { useEffect, useState } from 'react';
import { formatDate, formatPrice, formatRange } from '@/lib/format';
import { validateBooking } from '@/lib/validation';
import { useToast } from './Toast';
import { Alert, Button, Field, Input } from './ui';

const SAVED_KEY = 'playspot:customer';

export default function BookingForm({ venue, date, slot, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill details from the last booking on this device.
  useEffect(() => {
    try {
      setForm((f) => ({
        ...f,
        ...JSON.parse(localStorage.getItem(SAVED_KEY) || '{}'),
      }));
    } catch {
      /* ignore */
    }
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validateBooking(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      localStorage.setItem(SAVED_KEY, JSON.stringify(form));
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setServerError(err.message);
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!slot) {
    return (
      <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
        Select an available slot to continue.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">{venue.name}</p>
        <p className="mt-1 text-slate-600">
          {formatDate(date)} · {formatRange(slot.startTime, slot.endTime)}
        </p>
        <p className="text-brand-700 mt-2 text-base font-bold">
          {formatPrice(slot.price)}
        </p>
      </div>
      <Field label="Full name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="Your name"
        />
      </Field>
      <Field
        label="Email"
        htmlFor="email"
        error={errors.email}
        hint="Use this to find or cancel your booking later."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Phone" htmlFor="phone" error={errors.phone}>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          placeholder="+91 98765 43210"
        />
      </Field>
      {serverError && <Alert>{serverError}</Alert>}
      <Button type="submit" className="w-full" loading={submitting}>
        Confirm booking · {formatPrice(slot.price)}
      </Button>
    </form>
  );
}
