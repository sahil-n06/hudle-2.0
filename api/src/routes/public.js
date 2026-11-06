const { Router } = require('express');
const validate = require('../middleware/validate');
const s = require('../lib/schemas');
const venueService = require('../services/venueService');
const slotService = require('../services/slotService');
const bookingService = require('../services/bookingService');
const { z } = require('zod');
const limits = require('../middleware/rateLimit');
const config = require('../config');
const accessService = require('../services/accessService');
const { unauthorized } = require('../lib/errors');

const router = Router();
const idParam = validate(z.object({ id: s.id }), 'params');

const CUSTOMER_COOKIE = 'playspot_customer';
const customerCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
  path: '/api/bookings',
  maxAge: accessService.SESSION_HOURS * 60 * 60 * 1000,
};

/** Requires a verified customer email (see POST /bookings/access/verify). */
function customerAuth(req, _res, next) {
  const email = accessService.readSession(req.cookies?.[CUSTOMER_COOKIE]);
  if (!email) return next(unauthorized('Verify your email to see your bookings'));
  req.customerEmail = email;
  return next();
}

router.get('/venues', validate(s.venueQuery, 'query'), async (req, res) => {
  res.json({ data: await venueService.list(req.valid.query) });
});

router.get('/venues/filters', async (_req, res) => {
  res.json({ data: await venueService.filters() });
});

router.get('/venues/:id', idParam, async (req, res) => {
  res.json({ data: await venueService.get(req.valid.params.id) });
});

router.get(
  '/venues/:id/slots',
  idParam,
  validate(z.object({ date: s.date }), 'query'),
  async (req, res) => {
    res.json({ data: await slotService.availability(req.valid.params.id, req.valid.query.date) });
  },
);

router.post('/bookings', limits.bookings, validate(s.bookingInput), async (req, res) => {
  res.status(201).json({ data: await bookingService.create(req.valid.body) });
});

const referenceParam = validate(s.reference, 'params');

// Anyone holding the reference (shown once after booking) can view or cancel it.
router.get(
  '/bookings/confirmation/:reference',
  limits.reference,
  referenceParam,
  async (req, res) => {
    res.json({ data: await bookingService.findByReference(req.valid.params.reference) });
  },
);

router.post(
  '/bookings/confirmation/:reference/cancel',
  limits.reference,
  referenceParam,
  async (req, res) => {
    res.json({ data: await bookingService.cancelByReference(req.valid.params.reference) });
  },
);

// "My bookings": the customer proves they own an email with a one-time code.
router.post(
  '/bookings/access',
  limits.accessRequest,
  validate(s.accessRequest),
  async (req, res) => {
    const result = await accessService.requestCode(req.valid.body.email);
    res.status(202).json({ data: { sent: true, ...result } });
  },
);

router.post(
  '/bookings/access/verify',
  limits.accessVerify,
  validate(s.accessVerify),
  async (req, res) => {
    const { email, code } = req.valid.body;
    const token = await accessService.verifyCode(email, code);
    res.cookie(CUSTOMER_COOKIE, token, customerCookie);
    res.json({ data: { email } });
  },
);

router.post('/bookings/access/logout', (_req, res) => {
  res.clearCookie(CUSTOMER_COOKIE, { ...customerCookie, maxAge: undefined });
  res.status(204).end();
});

router.get('/bookings', customerAuth, async (req, res) => {
  res.json({
    data: await bookingService.listByEmail(req.customerEmail),
    meta: { email: req.customerEmail },
  });
});

router.post('/bookings/:id/cancel', customerAuth, idParam, async (req, res) => {
  res.json({
    data: await bookingService.cancel(req.valid.params.id, { email: req.customerEmail }),
  });
});

module.exports = router;
