export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

/** Local 'YYYY-MM-DD' for a Date (not UTC, so late-night users don't get tomorrow). */
export function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

export const todayISO = () => toISODate(new Date());

const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (
  iso,
  opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
) => new Intl.DateTimeFormat('en-IN', opts).format(parse(iso));

/** '18:00' -> '6:00 PM' */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const formatRange = (start, end) =>
  `${formatTime(start)} – ${formatTime(end)}`;

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
