const fs = require('fs');
const path = require('path');
const { pool, withTransaction } = require('./pool');

async function migrate() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const dir = path.join(__dirname, 'migrations');
  for (const file of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await withTransaction(async (client) => {
      const { rowCount } = await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
        [file],
      );
      if (rowCount) await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    });
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Migrations applied'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { migrate };
