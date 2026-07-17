CREATE TABLE IF NOT EXISTS gc_broadcast_user_template_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES gc_broadcast_users(id) ON DELETE CASCADE,
  whatsapp_connection_id TEXT NOT NULL REFERENCES gc_broadcast_whatsapp_connections(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_language TEXT NOT NULL DEFAULT 'es_MX',
  template_category TEXT,
  template_status TEXT,
  signature_code TEXT NOT NULL,
  signature_name TEXT NOT NULL,
  signature_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, whatsapp_connection_id, template_name, template_language)
);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_user_template_assignments_user
  ON gc_broadcast_user_template_assignments (user_id);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_user_template_assignments_template
  ON gc_broadcast_user_template_assignments (whatsapp_connection_id, template_name, template_language);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_user_template_assignments_signature
  ON gc_broadcast_user_template_assignments (signature_code);
