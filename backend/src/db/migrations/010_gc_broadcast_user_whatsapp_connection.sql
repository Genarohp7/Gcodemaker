ALTER TABLE gc_broadcast_users
  ADD COLUMN IF NOT EXISTS whatsapp_connection_id TEXT
    REFERENCES gc_broadcast_whatsapp_connections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_users_whatsapp_connection_id
  ON gc_broadcast_users (whatsapp_connection_id);
