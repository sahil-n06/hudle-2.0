const pino = require('pino');
const config = require('../config');

module.exports = pino({
  level: config.logLevel,
  base: { service: 'playspot-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.email',
      'body.phone',
    ],
    censor: '[Redacted]',
  },
});
