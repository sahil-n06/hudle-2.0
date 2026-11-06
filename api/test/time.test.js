const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.APP_TZ = 'Asia/Kolkata';
const { isUpcoming, nowInAppTz, dayOfWeek, durationHours } = require('../src/lib/time');

test('nowInAppTz uses the configured timezone', () => {
  // 2026-01-01T20:00Z is 01:30 on Jan 2 in India.
  assert.deepEqual(nowInAppTz(new Date('2026-01-01T20:00:00Z')), {
    date: '2026-01-02',
    time: '01:30',
  });
});

test('isUpcoming compares date and start time', () => {
  const now = new Date('2026-01-02T04:30:00Z'); // 10:00 IST
  assert.equal(isUpcoming('2026-01-02', '10:30', now), true);
  assert.equal(isUpcoming('2026-01-02', '10:00', now), false);
  assert.equal(isUpcoming('2026-01-01', '23:00', now), false);
  assert.equal(isUpcoming('2026-01-03', '06:00', now), true);
});

test('dayOfWeek and durationHours', () => {
  assert.equal(dayOfWeek('2026-11-08'), 0); // Sunday
  assert.equal(durationHours('09:00', '10:30'), 1.5);
});
