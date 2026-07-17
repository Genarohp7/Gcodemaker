ALTER TABLE gc_broadcast_whatsapp_connections
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS line_config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS gc_broadcast_whatsapp_connection_templates (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES gc_broadcast_whatsapp_connections(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  template_id TEXT,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT,
  category TEXT,
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_template JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (connection_id, name, language)
);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_connection_templates_connection
  ON gc_broadcast_whatsapp_connection_templates (connection_id);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_connection_templates_waba
  ON gc_broadcast_whatsapp_connection_templates (waba_id);
