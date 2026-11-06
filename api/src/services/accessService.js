const { createHmac, randomInt, timingSafeEqual } = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/pool');
const mailer = require('../lib/mailer');
const { AppError, badRequest } = require('../lib/errors');

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const SESSION_HOURS = 24;

const hash = (email, code) =>
  createHmac('sha256', config.jwtSecret).update(`${email.toLowerCase()}:${code}`).digest('hex');

/**
 * Email a 6-digit code that proves the customer owns `email`.
 * Without SMTP (local development) the code is printed to the API console and,
 * outside production, also returned so the UI can show it.
 */
async function requestCode(email) {
  if (mailer.devMode && config.production)
    throw new AppError(503, 'EMAIL_UNAVAILABLE', 'Email sign-in is not configured on this server');

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.withTransaction(async (client) => {
    // Only the newest code for an email is valid.
    await client.query('DELETE FROM customer_access_codes WHERE lower(email) = lower($1)', [email]);
    await client.query(
      `INSERT INTO customer_access_codes (email, code_hash, expires_at)
       VALUES ($1, $2, now() + make_interval(mins => $3))`,
      [email, hash(email, code), CODE_TTL_MINUTES],
    );
  });
  await mailer.send({
    to: email,
    subject: `Your PlaySpot code: ${code}`,
    text: `Your PlaySpot sign-in code is ${code}.\n\nIt expires in ${CODE_TTL_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
  });
  return mailer.devMode ? { devCode: code } : {};
}

/** Check a code; returns a signed session token for `email` on success. */
async function verifyCode(email, code) {
  // Commit the result first: throwing inside the transaction would roll back
  // the failed-attempt counter and allow unlimited guesses.
  const ok = await db.withTransaction(async (client) => {
    const {
      rows: [row],
    } = await client.query(
      `SELECT id, code_hash, attempts FROM customer_access_codes
        WHERE lower(email) = lower($1) AND used_at IS NULL AND expires_at > now()
        ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [email],
    );
    if (!row || row.attempts >= MAX_ATTEMPTS) return false;

    const expected = Buffer.from(row.code_hash, 'hex');
    const actual = Buffer.from(hash(email, code), 'hex');
    if (!timingSafeEqual(expected, actual)) {
      await client.query('UPDATE customer_access_codes SET attempts = attempts + 1 WHERE id = $1', [
        row.id,
      ]);
      return false;
    }
    await client.query('UPDATE customer_access_codes SET used_at = now() WHERE id = $1', [row.id]);
    return true;
  });
  if (!ok)
    throw badRequest('That code is wrong or has expired. Request a new one.', [
      { field: 'code', message: 'Wrong or expired code' },
    ]);
  return jwt.sign({ email: email.toLowerCase(), role: 'customer' }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: `${SESSION_HOURS}h`,
  });
}

/** Returns the verified email in a customer session token, or null. */
function readSession(token) {
  try {
    const payload = jwt.verify(token || '', config.jwtSecret, { algorithms: ['HS256'] });
    return payload.role === 'customer' ? payload.email : null;
  } catch {
    return null;
  }
}

module.exports = { requestCode, verifyCode, readSession, SESSION_HOURS };
