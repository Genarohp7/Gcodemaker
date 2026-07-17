CREATE TABLE IF NOT EXISTS gc_broadcast_web_chat_conversations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES gc_broadcast_companies(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, phone_number)
);

CREATE TABLE IF NOT EXISTS gc_broadcast_web_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES gc_broadcast_web_chat_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  attachment_name TEXT,
  attachment_mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  external_message_id TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_broadcast_web_chat_messages_external
  ON gc_broadcast_web_chat_messages (external_message_id)
  WHERE external_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_web_chat_messages_conversation
  ON gc_broadcast_web_chat_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_web_chat_conversations_company_updated
  ON gc_broadcast_web_chat_conversations (company_id, updated_at DESC);
