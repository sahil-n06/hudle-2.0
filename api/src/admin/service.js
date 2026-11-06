const bcrypt = require('bcryptjs');
const config = require('../config');
const db = require('../db/pool');

/** Seed only when the account does not exist; changed passwords are never overwritten. */
async function ensureAdminUser() {
  const hash = await bcrypt.hash(config.adminPassword, 12);
  await db.query(
    'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    [config.adminEmail, hash],
  );
}

async function verifyCredentials(email, password) {
  const {
    rows: [user],
  } = await db.query(
    'SELECT id, email, password_hash FROM admin_users WHERE lower(email) = lower($1)',
    [email],
  );
  const valid = user && (await bcrypt.compare(password, user.password_hash));
  return valid ? { id: user.id, email: user.email } : null;
}

module.exports = { ensureAdminUser, verifyCredentials };
