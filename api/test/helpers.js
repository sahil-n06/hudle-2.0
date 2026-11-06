// Point the app at the test database before anything loads the pool.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/venue_test';
process.env.ADMIN_EMAIL = 'admin@playspot.local';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.JWT_SECRET = 'test-secret';
process.env.APP_TZ = 'Asia/Kolkata';

const request = require('supertest');
const { createApp } = require('../src/app');
const { pool } = require('../src/db/pool');
const { migrate } = require('../src/db/migrate');
const { nowInAppTz } = require('../src/lib/time');

const { ensureAdminUser } = require('../src/admin/service');
const app = createApp();
const api = () => request(app);
const admin = (method, url) =>
  request(app)
    [method](url)
    .set(
      'Cookie',
      'playspot_admin=' +
        require('jsonwebtoken').sign(
          { role: 'admin', email: 'admin@playspot.local' },
          'test-secret',
          { subject: '1' },
        ),
    );

/** 'YYYY-MM-DD' offset from today in the app timezone. */
function dayOffset(days) {
  const d = new Date(`${nowInAppTz().date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function resetDb() {
  await migrate();
  await pool.query(
    'TRUNCATE bookings, date_slots, slot_templates, venues, admin_users, customer_access_codes RESTART IDENTITY CASCADE',
  );
  await ensureAdminUser();
}

/** Creates an active venue with daily 10-11 and 11-12 slots. */
async function createVenue(overrides = {}) {
  const {
    rows: [v],
  } = await pool.query(
    `INSERT INTO venues (name, sport, location, price_per_hour, is_active)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [
      overrides.name || 'Test Arena',
      overrides.sport || 'Football',
      overrides.location || 'Pune',
      overrides.price ?? 1000,
      overrides.isActive ?? true,
    ],
  );
  await pool.query(
    `INSERT INTO slot_templates (venue_id, start_time, end_time) VALUES ($1,'10:00','11:00'), ($1,'11:00','12:00')`,
    [v.id],
  );
  return v.id;
}

const bookingBody = (venueId, extra = {}) => ({
  venueId,
  date: dayOffset(1),
  startTime: '10:00',
  name: 'Asha',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  ...extra,
});

/** Signs in as a customer via the email-code flow; returns the session cookie. */
async function customerCookie(email = 'asha@example.com') {
  const sent = await api().post('/api/bookings/access').send({ email }).expect(202);
  const res = await api()
    .post('/api/bookings/access/verify')
    .send({ email, code: sent.body.data.devCode })
    .expect(200);
  return res.headers['set-cookie'][0].split(';')[0];
}

module.exports = { api, admin, customerCookie, pool, resetDb, createVenue, bookingBody, dayOffset };
