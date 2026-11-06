CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE venues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reference TEXT;
UPDATE bookings SET reference = 'PS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) WHERE reference IS NULL;
ALTER TABLE bookings ALTER COLUMN reference SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN reference SET DEFAULT ('PS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_idx ON bookings (reference);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_venue_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS venues_active_sport_idx ON venues (is_active, lower(sport)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS bookings_status_date_idx ON bookings (status, booking_date DESC);
CREATE INDEX IF NOT EXISTS bookings_created_id_idx ON bookings (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS slot_templates_venue_idx ON slot_templates (venue_id);
CREATE INDEX IF NOT EXISTS date_slots_venue_date_idx ON date_slots (venue_id, slot_date);
