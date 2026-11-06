import { describe, it, expect } from 'vitest';
import { validateBooking } from '@/lib/validation';
import { addDays, formatRange, formatTime } from '@/lib/format';

describe('validateBooking', () => {
  it('accepts valid details', () => {
    expect(
      validateBooking({
        name: 'Sahil',
        email: 'a@b.co',
        phone: '+91 98765 43210',
      }),
    ).toEqual({});
  });
  it('flags every bad field', () => {
    expect(
      Object.keys(validateBooking({ name: ' ', email: 'bad', phone: 'x' })),
    ).toEqual(['name', 'email', 'phone']);
  });
});

describe('format', () => {
  it('formats times in 12h', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('13:30')).toBe('1:30 PM');
    expect(formatRange('06:00', '07:00')).toBe('6:00 AM – 7:00 AM');
  });
  it('adds days across month end', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });
});
