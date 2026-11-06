const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { pinoHttp } = require('pino-http');
const { randomUUID } = require('crypto');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./lib/logger');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const adminAuth = require('./middleware/adminAuth');
const limits = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./lib/errors');
const { pool } = require('./db/pool');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.get('x-request-id') || randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      autoLogging: {
        ignore: (req) => ['/health', '/ready', '/api/health', '/api/ready'].includes(req.url),
      },
    }),
  );
  const origins = config.corsOrigin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: origins.includes('*') ? true : origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', limits.general);

  app.get(['/health', '/api/health'], (_req, res) =>
    res.json({ data: { status: 'ok', uptime: Math.round(process.uptime()) } }),
  );
  app.get(['/ready', '/api/ready'], async (_req, res, next) => {
    try {
      await pool.query('SELECT 1');
      res.json({ data: { status: 'ready', database: 'connected' } });
    } catch (err) {
      next(err);
    }
  });
  const document = YAML.parse(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));
  app.get('/api/openapi.json', (_req, res) => res.json(document));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document));
  app.use('/api/admin', limits.admin, adminRoutes);
  app.use('/api/admin', adminAuth);
  app.use('/api', publicRoutes);
  app.use((_req, _res, next) => next(notFound('Route not found')));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
