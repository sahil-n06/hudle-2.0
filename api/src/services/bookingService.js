const db = require('../db/pool');
const { badRequest, notFound, conflict } = require('../lib/errors');
const { isUpcoming, nowInAppTz, durationHours } = require('../lib/time');
const { randomBytes } = require('crypto');
const slotService = require('./slotService');

const MAX_DAYS_AHEAD = 60;

const COLUMNS = `b.id, b.reference, b.venue_id AS "venueId", v.name AS "venueName", v.sport, v.location,
  b.booking_date AS "date", to_char(b.start_time,'HH24:MI') AS "startTime",
  to_char(b.end_time,'HH24:MI') AS "endTime", b.customer_name AS "name", b.email, b.phone,
  b.price, b.status, b.created_at AS "createdAt", b.cancelled_at AS "cancelledAt"`;

/** Adds `isUpcoming` / `canCancel` flags so the UI doesn't need its own clock logic. */
const decorate = (b) => {
  const upcoming = isUpcoming(b.date, b.startTime);
  return { ...b, isUpcoming: upcoming, canCancel: upcoming && b.status === 'confirmed' };
};

function assertBookableDate(date) {
  const today = nowInAppTz().date;
  if (date < today) throw badRequest('Cannot book a date in the past');
  const max = new Date(`${today}T00:00:00Z`);
  max.setUTCDate(max.getUTCDate() + MAX_DAYS_AHEAD);
  if (date > max.toISOString().slice(0, 10))
    throw badRequest(`Bookings open at most ${MAX_DAYS_AHEAD} days ahead`);
}

async function create({ venueId, date, startTime, name, email, phone }) {
  assertBookableDate(date);
  return db.withTransaction(async (client) => {
    const {
      rows: [venue],
    } = await client.query('SELECT id, price_per_hour, is_active FROM venues WHERE id = $1', [
      venueId,
    ]);
    if (!venue || !venue.is_active) throw notFound('Venue not found');

    const slot = (await slotService.slotsForDate(venueId, date, client)).find(
      (s) => s.startTime === startTime,
    );
    if (!slot) throw badRequest('This venue has no slot at that time');
    if (!isUpcoming(date, startTime)) throw badRequest('This slot has already started');

    // The EXCLUDE constraint on bookings rejects overlaps atomically, even under
    // concurrent requests; the error handler maps it to a 409.
    const {
      rows: [row],
    } = await client.query(
      `INSERT INTO bookings (venue_id, booking_date, start_time, end_time, customer_name, email, phone, price, reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        venueId,
        date,
        slot.startTime,
        slot.endTime,
        name,
        email,
        phone,
        Math.round(venue.price_per_hour * durationHours(slot.startTime, slot.endTime)),
        `PS-${randomBytes(4).toString('hex').toUpperCase()}`,
      ],
    );
    return findById(row.id, client);
  });
}

async function findById(id, client = db) {
  const { rows } = await client.query(
    `SELECT ${COLUMNS} FROM bookings b JOIN venues v ON v.id = b.venue_id WHERE b.id=$1`,
    [id],
  );
  if (!rows[0]) throw notFound('Booking not found');
  return decorate(rows[0]);
}

async function findByReference(reference) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM bookings b JOIN venues v ON v.id = b.venue_id WHERE b.reference = $1`,
    [reference],
  );
  if (!rows[0]) throw notFound('Booking not found');
  return decorate(rows[0]);
}

async function listByEmail(email) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM bookings b JOIN venues v ON v.id = b.venue_id
      WHERE lower(b.email) = lower($1) ORDER BY b.booking_date DESC, b.start_time DESC`,
    [email],
  );
  return rows.map(decorate);
}

async function listAll({ venueId, date, status, search = '', page = 1, limit = 20 } = {}) {
  const where = [];
  const params = [];
  if (venueId) {
    params.push(venueId);
    where.push(`b.venue_id = $${params.length}`);
  }
  if (date) {
    params.push(date);
    where.push(`b.booking_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`b.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(b.reference ILIKE $${params.length} OR b.customer_name ILIKE $${params.length} OR b.email ILIKE $${params.length})`,
    );
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await db.query(`SELECT count(*)::int AS total FROM bookings b ${clause}`, params);
  params.push(limit, (page - 1) * limit);
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM bookings b JOIN venues v ON v.id = b.venue_id ${clause} ORDER BY b.created_at DESC, b.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return {
    data: rows.map(decorate),
    meta: {
      page,
      limit,
      total: count.rows[0].total,
      pages: Math.max(1, Math.ceil(count.rows[0].total / limit)),
    },
  };
}

/**
 * Cancel an upcoming booking. When `email` is given (customer flow) it must match
 * the booking; admins call this without an email.
 */
async function cancel(id, { email } = {}) {
  return db.withTransaction(async (client) => {
    const {
      rows: [b],
    } = await client.query(
      `SELECT id, email, status, booking_date AS "date", to_char(start_time,'HH24:MI') AS "startTime"
         FROM bookings WHERE id = $1 FOR UPDATE`,
      [id],
    );
    // Same 404 for "missing" and "not yours" so emails can't be probed.
    if (!b || (email && b.email.toLowerCase() !== email.toLowerCase()))
      throw notFound('Booking not found');
    if (b.status === 'cancelled') throw conflict('Booking is already cancelled');
    if (!isUpcoming(b.date, b.startTime))
      throw conflict('Past or ongoing bookings cannot be cancelled');
    await client.query(`UPDATE bookings SET status='cancelled', cancelled_at=now() WHERE id=$1`, [
      id,
    ]);
    return findById(id, client);
  });
}

/** Cancel using the booking reference (the secret shown on the confirmation). */
async function cancelByReference(reference) {
  const {
    rows: [b],
  } = await db.query('SELECT id FROM bookings WHERE reference = $1', [reference]);
  if (!b) throw notFound('Booking not found');
  return cancel(b.id);
}

module.exports = {
  create,
  cancelByReference,
  findById,
  findByReference,
  listByEmail,
  listAll,
  cancel,
  MAX_DAYS_AHEAD,
};
