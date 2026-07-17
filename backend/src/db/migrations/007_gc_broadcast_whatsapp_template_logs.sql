CREATE TABLE IF NOT EXISTS gc_broadcast_whatsapp_template_logs (
  id TEXT PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  phone_number_id TEXT,
  meta_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_template_logs_phone
  ON gc_broadcast_whatsapp_template_logs (recipient_phone);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_template_logs_template
  ON gc_broadcast_whatsapp_template_logs (template_name);
