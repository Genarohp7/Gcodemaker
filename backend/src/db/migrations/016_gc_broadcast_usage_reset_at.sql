ALTER TABLE gc_broadcast_companies
  ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ;
