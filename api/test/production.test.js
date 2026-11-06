const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  api,
  admin,
  pool,
  resetDb,
  createVenue,
  bookingBody,
  dayOffset,
  customerCookie,
} = require('./helpers');

beforeEach(resetDb);
after(() => pool.end());

test('health is alive, readiness checks the database, every response has a request ID', async () => {
  const health = await api().get('/health');
  assert.equal(health.body.data.status, 'ok');
  assert.ok(health.headers['x-request-id']);
  const traced = await api().get('/api/ready').set('x-request-id', 'trace-me');
  assert.equal(traced.headers['x-request-id'], 'trace-me');
  assert.equal(traced.body.data.database, 'connected');
  assert.ok(health.headers['content-security-policy']);
});

test('request bodies are limited to 100 KB', async () => {
  const res = await api()
    .post('/api/bookings')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ name: 'x', padding: 'x'.repeat(130_000) }));
  assert.equal(res.status, 413);
  assert.equal(res.body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('admin login uses an httpOnly cookie, validates credentials, and logs out', async () => {
  assert.equal(
    (
      await api()
        .post('/api/admin/login')
        .send({ email: 'admin@playspot.local', password: 'nope123' })
    ).status,
    401,
  );
  const login = await api()
    .post('/api/admin/login')
    .send({ email: 'admin@playspot.local', password: 'admin123' });
  assert.equal(login.status, 200);
  const cookie = login.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(
    (await api().get('/api/admin/me').set('Cookie', cookie)).body.data.user.email,
    'admin@playspot.local',
  );
  await api().post('/api/admin/logout').expect(204);
  assert.equal(
    (await api().post('/api/admin/login').send({ email: 'bad', password: '' })).status,
    400,
  );
});

test('a unique booking reference retrieves its confirmation', async () => {
  const venueId = await createVenue();
  const first = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
  const second = await api()
    .post('/api/bookings')
    .send(bookingBody(venueId, { startTime: '11:00' }))
    .expect(201);
  assert.match(first.body.data.reference, /^PS-[A-F0-9]{8}$/);
  assert.notEqual(first.body.data.reference, second.body.data.reference);
  const lookup = await api().get(`/api/bookings/confirmation/${first.body.data.reference}`);
  assert.equal(lookup.body.data.email, 'asha@example.com');
  assert.equal((await api().get('/api/bookings/confirmation/PS-00000000')).status, 404);
});

test('soft-deleted venues disappear publicly and historically booked data remains', async () => {
  const venueId = await createVenue();
  await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
  await admin('delete', `/api/admin/venues/${venueId}`).expect(204);
  assert.equal((await api().get(`/api/venues/${venueId}`)).status, 404);
  assert.equal(
    (
      await api()
        .get('/api/bookings')
        .set('Cookie', await customerCookie())
    ).body.data.length,
    1,
  );
  const { rows } = await pool.query('SELECT deleted_at FROM venues WHERE id=$1', [venueId]);
  assert.ok(rows[0].deleted_at);
});

test('activating and deactivating a venue preserves its slots', async () => {
  const venueId = await createVenue();
  const off = await admin('patch', `/api/admin/venues/${venueId}/status`).send({ isActive: false });
  assert.equal(off.body.data.isActive, false);
  assert.equal((await api().get(`/api/venues/${venueId}`)).status, 404);
  const on = await admin('patch', `/api/admin/venues/${venueId}/status`).send({ isActive: true });
  assert.equal(on.body.data.isActive, true);
  assert.equal(
    (await api().get(`/api/venues/${venueId}/slots?date=${dayOffset(1)}`)).body.data.length,
    2,
  );
});

test('admin booking search and pagination return metadata', async () => {
  const venueId = await createVenue();
  const booked = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
  const one = await admin('get', '/api/admin/bookings?limit=1&page=1');
  assert.equal(one.body.data.length, 1);
  assert.deepEqual(one.body.meta, { page: 1, limit: 1, total: 1, pages: 1 });
  assert.equal(
    (await admin('get', `/api/admin/bookings?search=${booked.body.data.reference}`)).body.data
      .length,
    1,
  );
  assert.equal((await admin('get', '/api/admin/bookings?search=nobody')).body.data.length, 0);
});
