const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  api,
  pool,
  resetDb,
  createVenue,
  bookingBody,
  dayOffset,
  customerCookie,
} = require('./helpers');

let venueId;
beforeEach(async () => {
  await resetDb();
  venueId = await createVenue();
});
after(() => pool.end());

describe('creating bookings', () => {
  test('books an available slot and marks it as booked', async () => {
    const res = await api().post('/api/bookings').send(bookingBody(venueId));
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'confirmed');
    assert.equal(res.body.data.endTime, '11:00');
    assert.equal(res.body.data.price, 1000);

    const slots = await api().get(`/api/venues/${venueId}/slots?date=${dayOffset(1)}`);
    assert.deepEqual(
      slots.body.data.map((s) => s.status),
      ['booked', 'available'],
    );
  });

  test('rejects double booking of the same slot with 409', async () => {
    await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    const res = await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { email: 'other@example.com' }));
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  test('only one of many concurrent requests for a slot succeeds', async () => {
    const results = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        api()
          .post('/api/bookings')
          .send(bookingBody(venueId, { email: `u${i}@example.com` })),
      ),
    );
    const statuses = results.map((r) => r.status);
    assert.equal(statuses.filter((s) => s === 201).length, 1);
    assert.equal(statuses.filter((s) => s === 409).length, 14);
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM bookings WHERE status='confirmed'",
    );
    assert.equal(rows[0].n, 1);
  });

  test('database rejects overlapping confirmed bookings even when inserted directly', async () => {
    const date = dayOffset(1);
    const insert = (start, end) =>
      pool.query(
        `INSERT INTO bookings (venue_id, booking_date, start_time, end_time, customer_name, email, phone, price)
       VALUES ($1,$2,$3,$4,'x','x@x.com','9999999999',1)`,
        [venueId, date, start, end],
      );
    await insert('10:00', '11:00');
    await assert.rejects(insert('10:30', '11:30'), (e) => e.code === '23P01');
    await insert('11:00', '12:00'); // touching, not overlapping
  });

  test('rejects past dates', async () => {
    const res = await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { date: dayOffset(-1) }));
    assert.equal(res.status, 400);
    assert.match(res.body.error.message, /past/);
  });

  test('rejects dates too far ahead', async () => {
    const res = await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { date: dayOffset(61) }));
    assert.equal(res.status, 400);
  });

  test('rejects a time that is not one of the venue slots', async () => {
    const res = await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { startTime: '15:00' }));
    assert.equal(res.status, 400);
    assert.match(res.body.error.message, /no slot/);
  });

  test('rejects inactive or unknown venues', async () => {
    const inactive = await createVenue({ isActive: false });
    assert.equal((await api().post('/api/bookings').send(bookingBody(inactive))).status, 404);
    assert.equal((await api().post('/api/bookings').send(bookingBody(9999))).status, 404);
  });

  test('validates customer details', async () => {
    const cases = [
      [{ email: 'not-an-email' }, 'email'],
      [{ phone: 'abc' }, 'phone'],
      [{ name: '   ' }, 'name'],
      [{ date: '2026-02-30' }, 'date'],
      [{ startTime: '25:00' }, 'startTime'],
    ];
    for (const [extra, field] of cases) {
      const res = await api().post('/api/bookings').send(bookingBody(venueId, extra));
      assert.equal(res.status, 400, field);
      assert.ok(
        res.body.error.details.some((d) => d.field === field),
        field,
      );
    }
  });

  test('returns 400 for malformed JSON', async () => {
    const res = await api()
      .post('/api/bookings')
      .set('content-type', 'application/json')
      .send('{oops');
    assert.equal(res.status, 400);
  });
});

describe('email verification for my bookings', () => {
  test('bookings cannot be listed without verifying the email', async () => {
    await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    assert.equal((await api().get('/api/bookings')).status, 401);
    assert.equal((await api().get('/api/bookings?email=asha@example.com')).status, 401);
  });

  test('a correct code signs in with an httpOnly cookie and lists only that email', async () => {
    await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { email: 'Mixed@Example.com' }))
      .expect(201);
    await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { startTime: '11:00', email: 'other@example.com' }))
      .expect(201);
    const sent = await api()
      .post('/api/bookings/access')
      .send({ email: 'mixed@EXAMPLE.com' })
      .expect(202);
    assert.match(sent.body.data.devCode, /^\d{6}$/);
    const verified = await api()
      .post('/api/bookings/access/verify')
      .send({ email: 'mixed@example.com', code: sent.body.data.devCode })
      .expect(200);
    const cookie = verified.headers['set-cookie'][0];
    assert.match(cookie, /HttpOnly/);
    const res = await api().get('/api/bookings').set('Cookie', cookie.split(';')[0]);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.meta.email, 'mixed@example.com');
    assert.equal(res.body.data[0].canCancel, true);
  });

  test('wrong, reused and brute-forced codes are rejected', async () => {
    const sent = await api().post('/api/bookings/access').send({ email: 'asha@example.com' });
    const code = sent.body.data.devCode;
    const wrong = code === '000000' ? '111111' : '000000';
    const bad = await api()
      .post('/api/bookings/access/verify')
      .send({ email: 'asha@example.com', code: wrong });
    assert.equal(bad.status, 400);
    await api()
      .post('/api/bookings/access/verify')
      .send({ email: 'asha@example.com', code })
      .expect(200);
    // Each code works once.
    assert.equal(
      (await api().post('/api/bookings/access/verify').send({ email: 'asha@example.com', code }))
        .status,
      400,
    );
    // After five wrong guesses even the right code stops working.
    const again = await api().post('/api/bookings/access').send({ email: 'asha@example.com' });
    for (let i = 0; i < 5; i++)
      await api()
        .post('/api/bookings/access/verify')
        .send({
          email: 'asha@example.com',
          code: again.body.data.devCode === '000000' ? '111111' : '000000',
        });
    assert.equal(
      (
        await api()
          .post('/api/bookings/access/verify')
          .send({ email: 'asha@example.com', code: again.body.data.devCode })
      ).status,
      400,
    );
  });

  test('a code for one email cannot be used for another', async () => {
    const sent = await api().post('/api/bookings/access').send({ email: 'asha@example.com' });
    const res = await api()
      .post('/api/bookings/access/verify')
      .send({ email: 'intruder@example.com', code: sent.body.data.devCode });
    assert.equal(res.status, 400);
  });

  test('validates email and code format', async () => {
    assert.equal((await api().post('/api/bookings/access').send({ email: 'nope' })).status, 400);
    assert.equal(
      (
        await api()
          .post('/api/bookings/access/verify')
          .send({ email: 'asha@example.com', code: '12' })
      ).status,
      400,
    );
  });
});

describe('cancellation', () => {
  test('cancelling frees the slot so it can be booked again', async () => {
    const { body } = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    const res = await api()
      .post(`/api/bookings/${body.data.id}/cancel`)
      .set('Cookie', await customerCookie());
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'cancelled');
    assert.equal(res.body.data.canCancel, false);
    await api()
      .post('/api/bookings')
      .send(bookingBody(venueId, { email: 'next@example.com' }))
      .expect(201);
  });

  test('cancelling requires a verified email', async () => {
    const { body } = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    const res = await api()
      .post(`/api/bookings/${body.data.id}/cancel`)
      .send({ email: 'asha@example.com' });
    assert.equal(res.status, 401);
  });

  test("cannot cancel someone else's booking", async () => {
    const { body } = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    const res = await api()
      .post(`/api/bookings/${body.data.id}/cancel`)
      .set('Cookie', await customerCookie('intruder@example.com'));
    assert.equal(res.status, 404);
  });

  test('cannot cancel twice', async () => {
    const { body } = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    const cookie = await customerCookie();
    await api().post(`/api/bookings/${body.data.id}/cancel`).set('Cookie', cookie).expect(200);
    const res = await api().post(`/api/bookings/${body.data.id}/cancel`).set('Cookie', cookie);
    assert.equal(res.status, 409);
  });

  test('cannot cancel a past booking', async () => {
    const {
      rows: [b],
    } = await pool.query(
      `INSERT INTO bookings (venue_id, booking_date, start_time, end_time, customer_name, email, phone, price)
       VALUES ($1,$2,'10:00','11:00','Asha','asha@example.com','9999999999',1000) RETURNING id`,
      [venueId, dayOffset(-2)],
    );
    const cookie = await customerCookie();
    const list = await api().get('/api/bookings').set('Cookie', cookie);
    assert.equal(list.body.data[0].canCancel, false);
    const res = await api().post(`/api/bookings/${b.id}/cancel`).set('Cookie', cookie);
    assert.equal(res.status, 409);
    assert.match(res.body.error.message, /Past/);
  });

  test('the booking reference can cancel without signing in', async () => {
    const { body } = await api().post('/api/bookings').send(bookingBody(venueId)).expect(201);
    const ref = body.data.reference;
    const res = await api().post(`/api/bookings/confirmation/${ref.toLowerCase()}/cancel`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'cancelled');
    assert.equal((await api().post(`/api/bookings/confirmation/${ref}/cancel`)).status, 409);
    assert.equal((await api().post('/api/bookings/confirmation/PS-00000000/cancel')).status, 404);
  });
});
