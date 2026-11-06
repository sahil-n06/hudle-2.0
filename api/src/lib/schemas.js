const { z } = require('zod');

const isRealDate = (s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine(isRealDate, 'Invalid date');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24h)');
const id = z.coerce
  .number({ invalid_type_error: 'Must be a number' })
  .int()
  .positive('Must be a positive id');
const trimmed = (max) => z.string().trim().min(1, 'Required').max(max);

const timeRange = (shape) =>
  z.object({ ...shape, startTime: time, endTime: time }).refine((v) => v.endTime > v.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

const venueInput = z.object({
  name: trimmed(120),
  sport: trimmed(40),
  location: trimmed(160),
  description: z.string().trim().max(2000).default(''),
  pricePerHour: z.coerce.number().int('Price must be a whole number').min(0).max(1_000_000),
  imageUrl: z
    .union([z.string().trim().url('Image URL must be a valid URL'), z.literal('')])
    .optional()
    .transform((v) => v || null),
  isActive: z.boolean().default(true),
});

const bookingInput = z.object({
  venueId: id,
  date,
  startTime: time,
  name: trimmed(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,18}[0-9]$/, 'Enter a valid phone number'),
});

const templateInput = timeRange({
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Pick at least one day')
    .default([0, 1, 2, 3, 4, 5, 6])
    .transform((d) => [...new Set(d)].sort()),
});

const dateSlotInput = timeRange({ date });

module.exports = {
  date,
  id,
  venueInput,
  bookingInput,
  templateInput,
  dateSlotInput,
  venueQuery: z.object({
    sport: z.string().trim().optional(),
    location: z.string().trim().optional(),
    city: z.string().trim().optional(),
    q: z.string().trim().optional(),
  }),
  reference: z.object({
    reference: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^PS-[A-Z0-9]{8}$/, 'Reference looks like PS-12AB34CD'),
  }),
  accessRequest: z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') }),
  accessVerify: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code'),
  }),
  adminBookingsQuery: z.object({
    venueId: id.optional(),
    date: date.optional(),
    status: z.enum(['confirmed', 'cancelled']).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
