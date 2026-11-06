// Client-side checks mirror the API rules for instant feedback; the API stays the source of truth.
export function validateBooking({ name, email, phone }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Please enter your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Enter a valid email';
  if (!/^\+?[0-9][0-9\s-]{6,18}[0-9]$/.test(phone.trim()))
    errors.phone = 'Enter a valid phone number';
  return errors;
}
