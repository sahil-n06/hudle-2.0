const config = require('./config');
const { createApp } = require('./app');
const { migrate } = require('./db/migrate');
const { ensureAdminUser } = require('./admin/service');
const { pool } = require('./db/pool');
const logger = require('./lib/logger');

async function start() {
  await migrate();
  await ensureAdminUser();
  const server = createApp().listen(config.port, () =>
    logger.info({ port: config.port }, 'API listening'),
  );
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const shutdown = (signal) => {
    logger.info({ signal }, 'Graceful shutdown started');
    server.close(async () => {
      await pool.end();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
