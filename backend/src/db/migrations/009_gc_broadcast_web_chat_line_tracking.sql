ALTER TABLE gc_broadcast_web_chat_conversations
  ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_web_chat_conversations_phone_number_id
  ON gc_broadcast_web_chat_conversations (phone_number_id);
