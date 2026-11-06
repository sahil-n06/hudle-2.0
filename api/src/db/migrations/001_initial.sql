CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS venues (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  sport        TEXT NOT NULL,
  location     TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  price_per_hour INTEGER NOT NULL CHECK (price_per_hour >= 0),
  image_url    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring slots: apply on the given weekdays (0 = Sunday ... 6 = Saturday).
CREATE TABLE IF NOT EXISTS slot_templates (
  id           SERIAL PRIMARY KEY,
  venue_id     INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  days_of_week SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  CHECK (end_time > start_time),
  UNIQUE (venue_id, start_time, end_time)
);

-- One-off slots for a specific date (e.g. extra late-night slot on a holiday).
CREATE TABLE IF NOT EXISTS date_slots (
  id           SERIAL PRIMARY KEY,
  venue_id     INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  slot_date    DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  CHECK (end_time > start_time),
  UNIQUE (venue_id, slot_date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id            SERIAL PRIMARY KEY,
  venue_id      INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  booking_date  DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  customer_name TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  price         INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ,
  CHECK (end_time > start_time),
  -- The database itself guarantees no two confirmed bookings overlap at a venue.
  -- Cancelled bookings are excluded, so cancelling frees the slot again.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    venue_id WITH =,
    tsrange(booking_date + start_time, booking_date + end_time) WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (lower(email));
CREATE INDEX IF NOT EXISTS bookings_venue_date_idx ON bookings (venue_id, booking_date);
