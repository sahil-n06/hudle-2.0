const { rateLimit } = require('express-rate-limit');

const limiter = (windowMs, limit) =>
  rateLimit({
    keyGenerator: (_req) =>
      process.env.NODE_ENV === 'test' ? require('crypto').randomUUID() : undefined,
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
      }),
  });

module.exports = {
  general: limiter(15 * 60_000, 600),
  bookings: limiter(15 * 60_000, 30),
  admin: limiter(15 * 60_000, 180),
  login: limiter(15 * 60_000, 10),
  // Customer sign-in codes and reference lookups: slow down guessing.
  accessRequest: limiter(15 * 60_000, 5),
  accessVerify: limiter(15 * 60_000, 20),
  reference: limiter(15 * 60_000, 60),
};
