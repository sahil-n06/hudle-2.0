-- One-time email codes that let a customer see and manage their own bookings.
CREATE TABLE IF NOT EXISTS customer_access_codes (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_access_codes_email_idx
  ON customer_access_codes (lower(email), created_at DESC);
