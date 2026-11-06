const db = require('../db/pool');
const { notFound, conflict } = require('../lib/errors');
const { dayOfWeek, isUpcoming, durationHours } = require('../lib/time');
const venueService = require('./venueService');

const overlaps = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime;

// ---- Recurring templates -------------------------------------------------

async function listTemplates(venueId) {
  const { rows } = await db.query(
    `SELECT id, to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime",
            days_of_week AS "daysOfWeek"
       FROM slot_templates WHERE venue_id = $1 ORDER BY start_time`,
    [venueId],
  );
  return rows;
}

async function createTemplate(venueId, { startTime, endTime, daysOfWeek }) {
  await venueService.get(venueId, { includeInactive: true });
  const clash = (await listTemplates(venueId)).find(
    (t) => overlaps(t, { startTime, endTime }) && t.daysOfWeek.some((d) => daysOfWeek.includes(d)),
  );
  if (clash) throw conflict(`Overlaps existing slot ${clash.startTime}-${clash.endTime}`);
  const { rows } = await db.query(
    `INSERT INTO slot_templates (venue_id, start_time, end_time, days_of_week) VALUES ($1,$2,$3,$4)
     RETURNING id, to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime",
               days_of_week AS "daysOfWeek"`,
    [venueId, startTime, endTime, daysOfWeek],
  );
  return rows[0];
}

async function deleteTemplate(venueId, templateId) {
  const { rowCount } = await db.query('DELETE FROM slot_templates WHERE id=$1 AND venue_id=$2', [
    templateId,
    venueId,
  ]);
  if (!rowCount) throw notFound('Slot template not found');
}

// ---- One-off date slots --------------------------------------------------

async function listDateSlots(venueId) {
  const { rows } = await db.query(
    `SELECT id, slot_date AS "date", to_char(start_time,'HH24:MI') AS "startTime",
            to_char(end_time,'HH24:MI') AS "endTime"
       FROM date_slots WHERE venue_id = $1 AND slot_date >= CURRENT_DATE - 1
      ORDER BY slot_date, start_time`,
    [venueId],
  );
  return rows;
}

async function createDateSlot(venueId, { date, startTime, endTime }) {
  await venueService.get(venueId, { includeInactive: true });
  const clash = (await slotsForDate(venueId, date)).find((s) =>
    overlaps(s, { startTime, endTime }),
  );
  if (clash)
    throw conflict(`Overlaps existing slot ${clash.startTime}-${clash.endTime} on ${date}`);
  const { rows } = await db.query(
    `INSERT INTO date_slots (venue_id, slot_date, start_time, end_time) VALUES ($1,$2,$3,$4)
     RETURNING id, slot_date AS "date", to_char(start_time,'HH24:MI') AS "startTime",
               to_char(end_time,'HH24:MI') AS "endTime"`,
    [venueId, date, startTime, endTime],
  );
  return rows[0];
}

async function deleteDateSlot(venueId, slotId) {
  const { rowCount } = await db.query('DELETE FROM date_slots WHERE id=$1 AND venue_id=$2', [
    slotId,
    venueId,
  ]);
  if (!rowCount) throw notFound('Date slot not found');
}

// ---- Availability --------------------------------------------------------

/** All slots defined for a venue on a date (templates for that weekday + one-off slots). */
async function slotsForDate(venueId, date, client = db) {
  const { rows } = await client.query(
    `SELECT to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime"
       FROM slot_templates WHERE venue_id = $1 AND $3::smallint = ANY(days_of_week)
     UNION
     SELECT to_char(start_time,'HH24:MI'), to_char(end_time,'HH24:MI')
       FROM date_slots WHERE venue_id = $1 AND slot_date = $2
     ORDER BY 1`,
    [venueId, date, dayOfWeek(date)],
  );
  return rows;
}

/** Slots for a date with status: available | booked | past. */
async function availability(venueId, date) {
  const venue = await venueService.get(venueId);
  const [slots, booked] = await Promise.all([
    slotsForDate(venueId, date),
    db
      .query(
        `SELECT to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime"
         FROM bookings WHERE venue_id=$1 AND booking_date=$2 AND status='confirmed'`,
        [venueId, date],
      )
      .then((r) => r.rows),
  ]);
  return slots.map((s) => {
    let status = 'available';
    if (booked.some((b) => overlaps(b, s))) status = 'booked';
    else if (!isUpcoming(date, s.startTime)) status = 'past';
    return {
      ...s,
      status,
      price: Math.round(venue.pricePerHour * durationHours(s.startTime, s.endTime)),
    };
  });
}

module.exports = {
  listTemplates,
  createTemplate,
  deleteTemplate,
  listDateSlots,
  createDateSlot,
  deleteDateSlot,
  slotsForDate,
  availability,
};
