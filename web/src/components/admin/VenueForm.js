'use client';
import { useState } from 'react';
import { Alert, Button, Field, Input, Textarea } from '../ui';

const EMPTY = {
  name: '',
  sport: '',
  location: '',
  description: '',
  pricePerHour: '',
  imageUrl: '',
  isActive: true,
};

export function validateVenue(v) {
  const errors = {};
  if (!v.name.trim()) errors.name = 'Name is required';
  if (!v.sport.trim()) errors.sport = 'Sport is required';
  if (!v.location.trim()) errors.location = 'Location is required';
  const price = Number(v.pricePerHour);
  if (v.pricePerHour === '' || !Number.isInteger(price) || price < 0)
    errors.pricePerHour = 'Enter a whole number ≥ 0';
  if (v.imageUrl && !/^https?:\/\/\S+$/.test(v.imageUrl.trim()))
    errors.imageUrl = 'Must be a valid http(s) URL';
  return errors;
}

export default function VenueForm({ initial, submitLabel = 'Save', onSubmit }) {
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    imageUrl: initial?.imageUrl || '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    const found = validateVenue(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        sport: form.sport,
        location: form.location,
        description: form.description,
        pricePerHour: Number(form.pricePerHour),
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
      });
      setStatus({ type: 'success', text: 'Saved' });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue name" htmlFor="v-name" error={errors.name}>
          <Input
            id="v-name"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />
        </Field>
        <Field label="Sport" htmlFor="v-sport" error={errors.sport}>
          <Input
            id="v-sport"
            list="sport-options"
            value={form.sport}
            onChange={set('sport')}
            error={errors.sport}
            placeholder="e.g. Football"
          />
          <datalist id="sport-options">
            {[
              'Football',
              'Badminton',
              'Tennis',
              'Cricket',
              'Basketball',
              'Swimming',
              'Table Tennis',
              'Squash',
            ].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field
          label="Location"
          htmlFor="v-location"
          error={errors.location}
          hint="Area, City — the city powers the filter."
        >
          <Input
            id="v-location"
            value={form.location}
            onChange={set('location')}
            error={errors.location}
            placeholder="Koramangala, Bengaluru"
          />
        </Field>
        <Field
          label="Price per hour (₹)"
          htmlFor="v-price"
          error={errors.pricePerHour}
        >
          <Input
            id="v-price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.pricePerHour}
            onChange={set('pricePerHour')}
            error={errors.pricePerHour}
          />
        </Field>
      </div>
      <Field
        label="Image URL (optional)"
        htmlFor="v-image"
        error={errors.imageUrl}
      >
        <Input
          id="v-image"
          value={form.imageUrl}
          onChange={set('imageUrl')}
          error={errors.imageUrl}
          placeholder="https://…"
        />
      </Field>
      <Field label="Description" htmlFor="v-desc">
        <Textarea
          id="v-desc"
          rows={3}
          value={form.description}
          onChange={set('description')}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-brand-600 h-4 w-4"
          checked={form.isActive}
          onChange={set('isActive')}
        />
        Listed publicly (uncheck to hide this venue from customers)
      </label>
      {status && <Alert type={status.type}>{status.text}</Alert>}
      <Button type="submit" loading={saving}>
        {submitLabel}
      </Button>
    </form>
  );
}
