CREATE TABLE IF NOT EXISTS gc_broadcast_whatsapp_message_statuses (
  id TEXT PRIMARY KEY,
  whatsapp_message_id TEXT NOT NULL,
  status TEXT NOT NULL,
  recipient_id TEXT,
  conversation_id TEXT,
  pricing JSONB,
  error_code TEXT,
  error_title TEXT,
  error_message TEXT,
  raw_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_statuses_message_id
  ON gc_broadcast_whatsapp_message_statuses (whatsapp_message_id);

CREATE TABLE IF NOT EXISTS gc_broadcast_whatsapp_inbound_messages (
  id TEXT PRIMARY KEY,
  whatsapp_message_id TEXT NOT NULL,
  from_phone TEXT NOT NULL,
  phone_number_id TEXT,
  message_type TEXT NOT NULL,
  text_body TEXT,
  raw_message JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_inbound_from_phone
  ON gc_broadcast_whatsapp_inbound_messages (from_phone);
