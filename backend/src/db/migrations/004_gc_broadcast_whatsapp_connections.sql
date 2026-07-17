CREATE TABLE IF NOT EXISTS gc_broadcast_whatsapp_connections (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES gc_broadcast_companies(id) ON DELETE SET NULL,
  line_id TEXT REFERENCES gc_broadcast_lines(id) ON DELETE SET NULL,
  business_id TEXT,
  waba_id TEXT,
  phone_number_id TEXT,
  connected_phone TEXT,
  access_token TEXT,
  token_expiration TIMESTAMPTZ,
  connection_status TEXT NOT NULL DEFAULT 'pending_assets',
  raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_connections_company_id
  ON gc_broadcast_whatsapp_connections (company_id);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_connections_line_id
  ON gc_broadcast_whatsapp_connections (line_id);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_connections_phone_number_id
  ON gc_broadcast_whatsapp_connections (phone_number_id);
