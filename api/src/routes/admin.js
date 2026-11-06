const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../config');
const adminAuth = require('../middleware/adminAuth');
const limits = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const s = require('../lib/schemas');
const adminService = require('../admin/service');
const venueService = require('../services/venueService');
const slotService = require('../services/slotService');
const bookingService = require('../services/bookingService');

const router = Router();
const venueParam = validate(z.object({ id: s.id }), 'params');
const childParam = validate(z.object({ id: s.id, slotId: s.id }), 'params');
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
  path: '/api/admin',
  maxAge: 8 * 60 * 60 * 1000,
};

router.post(
  '/login',
  limits.login,
  validate(
    z.object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(1).max(200),
    }),
  ),
  async (req, res) => {
    const user = await adminService.verifyCredentials(
      req.valid.body.email,
      req.valid.body.password,
    );
    if (!user)
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Incorrect email or password' } });
    const token = jwt.sign({ email: user.email, role: 'admin' }, config.jwtSecret, {
      algorithm: 'HS256',
      subject: String(user.id),
      expiresIn: '8h',
    });
    res.cookie('playspot_admin', token, cookieOptions);
    res.json({ data: { user } });
  },
);
router.post('/logout', (_req, res) => {
  res.clearCookie('playspot_admin', { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

router.use(adminAuth);
router.get('/me', (req, res) => res.json({ data: { user: req.admin } }));
router.get('/venues', async (_req, res) =>
  res.json({ data: await venueService.list({}, { includeInactive: true }) }),
);
router.get('/venues/:id', venueParam, async (req, res) =>
  res.json({ data: await venueService.get(req.valid.params.id, { includeInactive: true }) }),
);
router.post('/venues', validate(s.venueInput), async (req, res) =>
  res.status(201).json({ data: await venueService.create(req.valid.body) }),
);
router.put('/venues/:id', venueParam, validate(s.venueInput), async (req, res) =>
  res.json({ data: await venueService.update(req.valid.params.id, req.valid.body) }),
);
router.patch(
  '/venues/:id/status',
  venueParam,
  validate(z.object({ isActive: z.boolean() })),
  async (req, res) =>
    res.json({ data: await venueService.setActive(req.valid.params.id, req.valid.body.isActive) }),
);
router.delete('/venues/:id', venueParam, async (req, res) => {
  await venueService.softDelete(req.valid.params.id);
  res.status(204).end();
});

router.get('/venues/:id/templates', venueParam, async (req, res) =>
  res.json({ data: await slotService.listTemplates(req.valid.params.id) }),
);
router.post('/venues/:id/templates', venueParam, validate(s.templateInput), async (req, res) =>
  res
    .status(201)
    .json({ data: await slotService.createTemplate(req.valid.params.id, req.valid.body) }),
);
router.delete('/venues/:id/templates/:slotId', childParam, async (req, res) => {
  await slotService.deleteTemplate(req.valid.params.id, req.valid.params.slotId);
  res.status(204).end();
});
router.get('/venues/:id/date-slots', venueParam, async (req, res) =>
  res.json({ data: await slotService.listDateSlots(req.valid.params.id) }),
);
router.post('/venues/:id/date-slots', venueParam, validate(s.dateSlotInput), async (req, res) =>
  res
    .status(201)
    .json({ data: await slotService.createDateSlot(req.valid.params.id, req.valid.body) }),
);
router.delete('/venues/:id/date-slots/:slotId', childParam, async (req, res) => {
  await slotService.deleteDateSlot(req.valid.params.id, req.valid.params.slotId);
  res.status(204).end();
});

router.get('/bookings', validate(s.adminBookingsQuery, 'query'), async (req, res) =>
  res.json(await bookingService.listAll(req.valid.query)),
);
router.post('/bookings/:id/cancel', venueParam, async (req, res) =>
  res.json({ data: await bookingService.cancel(req.valid.params.id) }),
);

module.exports = router;
