CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_broadcast_whatsapp_connections_phone_number_id_unique
  ON gc_broadcast_whatsapp_connections (phone_number_id)
  WHERE phone_number_id IS NOT NULL;
