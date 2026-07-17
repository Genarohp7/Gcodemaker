CREATE TABLE IF NOT EXISTS gc_broadcast_whatsapp_test_messages (
  id TEXT PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  meta_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
