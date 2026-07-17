ALTER TABLE gc_broadcast_whatsapp_connection_templates
  ADD COLUMN IF NOT EXISTS body_text TEXT,
  ADD COLUMN IF NOT EXISTS header_json JSONB,
  ADD COLUMN IF NOT EXISTS footer_text TEXT,
  ADD COLUMN IF NOT EXISTS buttons_json JSONB,
  ADD COLUMN IF NOT EXISTS variable_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variable_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signature_code TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_connection_templates_signature
  ON gc_broadcast_whatsapp_connection_templates (signature_code);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_connection_templates_status_active
  ON gc_broadcast_whatsapp_connection_templates (status, is_active);
