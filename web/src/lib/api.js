export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers =
    body === undefined ? {} : { 'Content-Type': 'application/json' };
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'Network error. Please check your connection and try again.',
    );
  }
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(
      res.status,
      json.error?.message || `Request failed (${res.status})`,
      json.error?.details,
    );
  return json;
}

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return s ? `?${s}` : '';
};

export const api = {
  venues: (filters = {}) =>
    request(
      `/venues${qs({ ...filters, location: filters.city || filters.location })}`,
    ).then((r) => r.data),
  venueFilters: () => request('/venues/filters').then((r) => r.data),
  venue: (id) => request(`/venues/${id}`).then((r) => r.data),
  slots: (id, date) =>
    request(`/venues/${id}/slots${qs({ date })}`).then((r) => r.data),
  book: (data) =>
    request('/bookings', { method: 'POST', body: data }).then((r) => r.data),
  confirmation: (reference) =>
    request(`/bookings/confirmation/${encodeURIComponent(reference)}`).then(
      (r) => r.data,
    ),
  cancelByReference: (reference) =>
    request(`/bookings/confirmation/${encodeURIComponent(reference)}/cancel`, {
      method: 'POST',
    }).then((r) => r.data),
  // "My bookings": prove email ownership with a one-time code.
  requestAccessCode: (email) =>
    request('/bookings/access', { method: 'POST', body: { email } }).then(
      (r) => r.data,
    ),
  verifyAccessCode: (email, code) =>
    request('/bookings/access/verify', {
      method: 'POST',
      body: { email, code },
    }).then((r) => r.data),
  signOutCustomer: () => request('/bookings/access/logout', { method: 'POST' }),
  /** Returns { data: bookings, meta: { email } }; throws 401 when not verified. */
  myBookings: () => request('/bookings'),
  cancel: (id) =>
    request(`/bookings/${id}/cancel`, { method: 'POST' }).then((r) => r.data),
};

const authenticated = (path, options) =>
  request(path, options).then((r) => r?.data);
export const adminApi = {
  me: () => authenticated('/admin/me'),
  login: (credentials) =>
    authenticated('/admin/login', { method: 'POST', body: credentials }),
  logout: () => authenticated('/admin/logout', { method: 'POST' }),
  venues: () => authenticated('/admin/venues'),
  venue: (id) => authenticated(`/admin/venues/${id}`),
  createVenue: (data) =>
    authenticated('/admin/venues', { method: 'POST', body: data }),
  updateVenue: (id, data) =>
    authenticated(`/admin/venues/${id}`, { method: 'PUT', body: data }),
  setVenueActive: (id, isActive) =>
    authenticated(`/admin/venues/${id}/status`, {
      method: 'PATCH',
      body: { isActive },
    }),
  deleteVenue: (id) =>
    authenticated(`/admin/venues/${id}`, { method: 'DELETE' }),
  templates: (id) => authenticated(`/admin/venues/${id}/templates`),
  createTemplate: (id, data) =>
    authenticated(`/admin/venues/${id}/templates`, {
      method: 'POST',
      body: data,
    }),
  deleteTemplate: (id, slotId) =>
    authenticated(`/admin/venues/${id}/templates/${slotId}`, {
      method: 'DELETE',
    }),
  dateSlots: (id) => authenticated(`/admin/venues/${id}/date-slots`),
  createDateSlot: (id, data) =>
    authenticated(`/admin/venues/${id}/date-slots`, {
      method: 'POST',
      body: data,
    }),
  deleteDateSlot: (id, slotId) =>
    authenticated(`/admin/venues/${id}/date-slots/${slotId}`, {
      method: 'DELETE',
    }),
  bookings: (filters = {}) => request(`/admin/bookings${qs(filters)}`),
  cancelBooking: (id) =>
    authenticated(`/admin/bookings/${id}/cancel`, { method: 'POST' }),
};
