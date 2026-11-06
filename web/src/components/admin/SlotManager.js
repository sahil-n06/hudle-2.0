'use client';
import { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useAdminData } from './useAdminData';
import { DAYS, addDays, formatDate, formatRange, todayISO } from '@/lib/format';
import { Alert, Button, Card, Field, Input, Loading, cx } from '../ui';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function describeDays(days) {
  if (days.length === 7) return 'Every day';
  if (days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.join() === '0,6') return 'Weekends';
  return days.map((d) => DAYS[d]).join(', ');
}

function SlotRow({ label, sub, onDelete }) {
  const [busy, setBusy] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <Button
        variant="danger"
        className="px-3 py-1.5"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onDelete();
          } finally {
            setBusy(false);
          }
        }}
      >
        Delete
      </Button>
    </li>
  );
}

function TimeInputs({ value, onChange, errors }) {
  return (
    <>
      <Field label="Start" error={errors.startTime}>
        <Input
          type="time"
          step="1800"
          value={value.startTime}
          onChange={(e) => onChange({ ...value, startTime: e.target.value })}
        />
      </Field>
      <Field label="End" error={errors.endTime}>
        <Input
          type="time"
          step="1800"
          value={value.endTime}
          onChange={(e) => onChange({ ...value, endTime: e.target.value })}
        />
      </Field>
    </>
  );
}

function checkTimes({ startTime, endTime }) {
  if (!startTime) return { startTime: 'Required' };
  if (!endTime) return { endTime: 'Required' };
  if (endTime <= startTime) return { endTime: 'Must be after start' };
  return {};
}

export default function SlotManager({ venueId }) {
  const { api } = useAdmin();
  const templates = useAdminData((a) => a.templates(venueId), [venueId]);
  const dateSlots = useAdminData((a) => a.dateSlots(venueId), [venueId]);
  const [tpl, setTpl] = useState({
    startTime: '',
    endTime: '',
    daysOfWeek: ALL_DAYS,
  });
  const [one, setOne] = useState({
    date: addDays(todayISO(), 1),
    startTime: '',
    endTime: '',
  });
  const [errors, setErrors] = useState({ tpl: {}, one: {} });
  const [message, setMessage] = useState(null);

  async function run(kind, action, reset) {
    setMessage(null);
    try {
      await action();
      reset?.();
      setErrors((e) => ({ ...e, [kind]: {} }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  const addTemplate = (e) => {
    e.preventDefault();
    const found = checkTimes(tpl);
    if (!tpl.daysOfWeek.length) found.days = 'Pick at least one day';
    setErrors((er) => ({ ...er, tpl: found }));
    if (Object.keys(found).length) return;
    run(
      'tpl',
      async () => {
        await api.createTemplate(venueId, tpl);
        templates.reload();
      },
      () => setTpl((t) => ({ ...t, startTime: t.endTime, endTime: '' })),
    );
  };

  const addDateSlot = (e) => {
    e.preventDefault();
    const found = checkTimes(one);
    if (!one.date) found.date = 'Required';
    setErrors((er) => ({ ...er, one: found }));
    if (Object.keys(found).length) return;
    run(
      'one',
      async () => {
        await api.createDateSlot(venueId, one);
        dateSlots.reload();
      },
      () => setOne((s) => ({ ...s, startTime: '', endTime: '' })),
    );
  };

  const toggleDay = (d) =>
    setTpl((t) => ({
      ...t,
      daysOfWeek: t.daysOfWeek.includes(d)
        ? t.daysOfWeek.filter((x) => x !== d)
        : [...t.daysOfWeek, d].sort(),
    }));

  return (
    <div className="space-y-6">
      {message && <Alert type={message.type}>{message.text}</Alert>}

      <Card className="p-5 sm:p-6">
        <h3 className="font-semibold">Recurring slots</h3>
        <p className="mt-1 text-sm text-slate-500">
          Repeat every week on the selected days. Existing bookings are kept if
          you delete a slot.
        </p>
        <form onSubmit={addTemplate} className="mt-4 space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <TimeInputs value={tpl} onChange={setTpl} errors={errors.tpl} />
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Days of week"
          >
            {DAYS.map((label, d) => (
              <button
                key={d}
                type="button"
                aria-pressed={tpl.daysOfWeek.includes(d)}
                onClick={() => toggleDay(d)}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold ring-1',
                  tpl.daysOfWeek.includes(d)
                    ? 'bg-brand-600 ring-brand-600 text-white'
                    : 'bg-white text-slate-600 ring-slate-300',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.tpl.days && (
            <p className="text-xs text-red-600">{errors.tpl.days}</p>
          )}
          <Button type="submit">Add recurring slot</Button>
        </form>
        {templates.loading ? (
          <Loading />
        ) : templates.error ? (
          <Alert className="mt-4">{templates.error.message}</Alert>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {templates.data.length === 0 && (
              <li className="py-3 text-sm text-slate-500">
                No recurring slots yet.
              </li>
            )}
            {templates.data.map((t) => (
              <SlotRow
                key={t.id}
                label={formatRange(t.startTime, t.endTime)}
                sub={describeDays(t.daysOfWeek)}
                onDelete={() =>
                  run('tpl', async () => {
                    await api.deleteTemplate(venueId, t.id);
                    templates.reload();
                  })
                }
              />
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="font-semibold">One-off slots</h3>
        <p className="mt-1 text-sm text-slate-500">
          Extra slots for a specific date only.
        </p>
        <form onSubmit={addDateSlot} className="mt-4 space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3 sm:max-w-lg sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <Field label="Date" error={errors.one.date}>
                <Input
                  type="date"
                  min={todayISO()}
                  value={one.date}
                  onChange={(e) => setOne({ ...one, date: e.target.value })}
                />
              </Field>
            </div>
            <TimeInputs value={one} onChange={setOne} errors={errors.one} />
          </div>
          <Button type="submit">Add one-off slot</Button>
        </form>
        {dateSlots.loading ? (
          <Loading />
        ) : dateSlots.error ? (
          <Alert className="mt-4">{dateSlots.error.message}</Alert>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {dateSlots.data.length === 0 && (
              <li className="py-3 text-sm text-slate-500">No one-off slots.</li>
            )}
            {dateSlots.data.map((s) => (
              <SlotRow
                key={s.id}
                label={formatRange(s.startTime, s.endTime)}
                sub={formatDate(s.date)}
                onDelete={() =>
                  run('one', async () => {
                    await api.deleteDateSlot(venueId, s.id);
                    dateSlots.reload();
                  })
                }
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
