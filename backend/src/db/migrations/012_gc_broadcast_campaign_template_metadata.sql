ALTER TABLE gc_broadcast_campaigns
  ADD COLUMN IF NOT EXISTS whatsapp_connection_id TEXT REFERENCES gc_broadcast_whatsapp_connections(id) ON DELETE SET NULL;

ALTER TABLE gc_broadcast_campaigns
  ADD COLUMN IF NOT EXISTS template_name TEXT;

ALTER TABLE gc_broadcast_campaigns
  ADD COLUMN IF NOT EXISTS language_code TEXT;

ALTER TABLE gc_broadcast_campaigns
  ADD COLUMN IF NOT EXISTS variable_mapping JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_campaigns_whatsapp_connection
  ON gc_broadcast_campaigns (whatsapp_connection_id);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_campaigns_template_name
  ON gc_broadcast_campaigns (template_name);
