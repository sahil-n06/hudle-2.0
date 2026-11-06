const config = require('../config');

/** Current date ('YYYY-MM-DD') and time ('HH:MM') in the app timezone. */
function nowInAppTz(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: config.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** True when the slot (date + start time) is strictly in the future. */
function isUpcoming(date, startTime, now = new Date()) {
  const current = nowInAppTz(now);
  if (date !== current.date) return date > current.date;
  return startTime.slice(0, 5) > current.time;
}

/** 0 = Sunday ... 6 = Saturday for a 'YYYY-MM-DD' string. */
function dayOfWeek(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** 'HH:MM:SS' -> 'HH:MM' */
const shortTime = (t) => t.slice(0, 5);

/** Whole-hour-aware duration in hours, e.g. 09:00-10:30 -> 1.5 */
function durationHours(start, end) {
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return (toMin(end) - toMin(start)) / 60;
}

module.exports = { nowInAppTz, isUpcoming, dayOfWeek, shortTime, durationHours };
