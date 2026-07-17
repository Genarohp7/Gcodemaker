ALTER TABLE gc_broadcast_whatsapp_connections
  ADD COLUMN IF NOT EXISTS line_name TEXT,
  ADD COLUMN IF NOT EXISTS display_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'meta_embedded_signup';

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_connections_provider
  ON gc_broadcast_whatsapp_connections (provider);
