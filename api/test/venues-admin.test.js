const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, admin, pool, resetDb, createVenue, dayOffset } = require('./helpers');

let venueId;
beforeEach(async () => {
  await resetDb();
  venueId = await createVenue();
});
after(() => pool.end());

describe('public venues', () => {
  test('filters by sport and location, hides inactive venues', async () => {
    await createVenue({ name: 'Court One', sport: 'Tennis', location: 'Mumbai' });
    await createVenue({ name: 'Hidden', sport: 'Tennis', location: 'Mumbai', isActive: false });
    assert.equal((await api().get('/api/venues')).body.data.length, 2);
    const tennis = await api().get('/api/venues?sport=tennis');
    assert.deepEqual(
      tennis.body.data.map((v) => v.name),
      ['Court One'],
    );
    const pune = await api().get('/api/venues?location=pun');
    assert.deepEqual(
      pune.body.data.map((v) => v.name),
      ['Test Arena'],
    );
    const q = await api().get('/api/venues?q=court');
    assert.equal(q.body.data.length, 1);
  });

  test('past slots for today are marked as past, other days are available', async () => {
    const tomorrow = await api().get(`/api/venues/${venueId}/slots?date=${dayOffset(1)}`);
    assert.ok(tomorrow.body.data.every((s) => s.status === 'available'));
    const yesterday = await api().get(`/api/venues/${venueId}/slots?date=${dayOffset(-1)}`);
    assert.ok(yesterday.body.data.every((s) => s.status === 'past'));
  });

  test('404 for unknown venue, 400 for bad id', async () => {
    assert.equal((await api().get('/api/venues/999')).status, 404);
    assert.equal((await api().get('/api/venues/abc')).status, 400);
  });
});

describe('admin', () => {
  test('rejects requests without a valid token', async () => {
    assert.equal((await api().get('/api/admin/venues')).status, 401);
    assert.equal((await api().get('/api/admin/venues').set('x-admin-token', 'wrong')).status, 401);
  });

  test('creates and edits venues with validation', async () => {
    const bad = await admin('post', '/api/admin/venues').send({ name: '', pricePerHour: -5 });
    assert.equal(bad.status, 400);
    const created = await admin('post', '/api/admin/venues').send({
      name: 'New Pitch',
      sport: 'Cricket',
      location: 'Chennai',
      pricePerHour: 700,
    });
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    const updated = await admin('put', `/api/admin/venues/${id}`).send({
      name: 'New Pitch 2',
      sport: 'Cricket',
      location: 'Chennai',
      pricePerHour: 750,
      isActive: false,
    });
    assert.equal(updated.body.data.pricePerHour, 750);
    assert.equal((await api().get(`/api/venues/${id}`)).status, 404); // inactive hidden publicly
    assert.equal(
      (
        await admin('put', '/api/admin/venues/9999').send({
          name: 'x',
          sport: 'x',
          location: 'x',
          pricePerHour: 1,
        })
      ).status,
      404,
    );
  });

  test('manages slot templates and rejects overlaps', async () => {
    const ok = await admin('post', `/api/admin/venues/${venueId}/templates`).send({
      startTime: '18:00',
      endTime: '19:30',
      daysOfWeek: [1, 2, 2],
    });
    assert.equal(ok.status, 201);
    assert.deepEqual(ok.body.data.daysOfWeek, [1, 2]);
    const overlap = await admin('post', `/api/admin/venues/${venueId}/templates`).send({
      startTime: '10:30',
      endTime: '11:30',
    });
    assert.equal(overlap.status, 409);
    const reversed = await admin('post', `/api/admin/venues/${venueId}/templates`).send({
      startTime: '20:00',
      endTime: '19:00',
    });
    assert.equal(reversed.status, 400);
    await admin('delete', `/api/admin/venues/${venueId}/templates/${ok.body.data.id}`).expect(204);
    await admin('delete', `/api/admin/venues/${venueId}/templates/${ok.body.data.id}`).expect(404);
  });

  test('per-date slots show only on that date and can be booked', async () => {
    const date = dayOffset(2);
    await admin('post', `/api/admin/venues/${venueId}/date-slots`)
      .send({ date, startTime: '22:00', endTime: '23:00' })
      .expect(201);
    const onDay = await api().get(`/api/venues/${venueId}/slots?date=${date}`);
    assert.ok(onDay.body.data.some((s) => s.startTime === '22:00'));
    const otherDay = await api().get(`/api/venues/${venueId}/slots?date=${dayOffset(3)}`);
    assert.ok(!otherDay.body.data.some((s) => s.startTime === '22:00'));
    await api()
      .post('/api/bookings')
      .send({
        venueId,
        date,
        startTime: '22:00',
        name: 'A',
        email: 'a@a.com',
        phone: '9876543210',
      })
      .expect(201);
    const clash = await admin('post', `/api/admin/venues/${venueId}/date-slots`).send({
      date,
      startTime: '10:30',
      endTime: '11:00',
    });
    assert.equal(clash.status, 409);
  });

  test('lists all bookings with filters and can cancel', async () => {
    const { body } = await api()
      .post('/api/bookings')
      .send({
        venueId,
        date: dayOffset(1),
        startTime: '10:00',
        name: 'A',
        email: 'a@a.com',
        phone: '9876543210',
      })
      .expect(201);
    const all = await admin('get', '/api/admin/bookings');
    assert.equal(all.body.data.length, 1);
    const none = await admin('get', '/api/admin/bookings?status=cancelled');
    assert.equal(none.body.data.length, 0);
    await admin('post', `/api/admin/bookings/${body.data.id}/cancel`).expect(200);
    assert.equal((await admin('get', '/api/admin/bookings?status=cancelled')).body.data.length, 1);
  });
});
