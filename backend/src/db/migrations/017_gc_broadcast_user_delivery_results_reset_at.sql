ALTER TABLE gc_broadcast_users
  ADD COLUMN IF NOT EXISTS delivery_results_reset_at TIMESTAMPTZ;
