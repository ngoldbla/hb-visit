-- Add phone+PIN identity columns to members table
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(15),
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- Unique index on phone_normalized (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_phone_normalized
  ON members(phone_normalized)
  WHERE phone_normalized IS NOT NULL;

-- Fast lookup index for active members by phone
CREATE INDEX IF NOT EXISTS idx_members_phone_lookup
  ON members(phone_normalized)
  WHERE is_active = true;
