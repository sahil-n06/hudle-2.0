/**
 * Bookings made in this browser, so the venue page can mark "your" slots and
 * reopen their confirmation. Only references are kept; the server stays the
 * source of truth.
 */
const KEY = 'playspot:bookings';
const MAX = 50;

export function getSavedBookings() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* storage unavailable: the feature just switches off */
  }
}

export function saveBooking(b) {
  const entry = {
    reference: b.reference,
    venueId: Number(b.venueId),
    date: b.date,
    startTime: b.startTime,
  };
  write([
    ...getSavedBookings().filter((s) => s.reference !== b.reference),
    entry,
  ]);
}

export function forgetBooking(reference) {
  write(getSavedBookings().filter((s) => s.reference !== reference));
}

/** Reference of this browser's booking for a slot, if any. */
export function savedReferenceFor(venueId, date, startTime) {
  return getSavedBookings().find(
    (s) =>
      s.venueId === Number(venueId) &&
      s.date === date &&
      s.startTime === startTime,
  )?.reference;
}
