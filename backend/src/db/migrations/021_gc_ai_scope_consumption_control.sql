ALTER TABLE gc_ai_conversations
  ADD COLUMN IF NOT EXISTS conversation_scope_status TEXT NOT NULL DEFAULT 'COMMERCIAL_ACTIVE',
  ADD COLUMN IF NOT EXISTS off_topic_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS non_commercial_blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commercial_reactivated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_gc_ai_conversations_scope_status'
  ) THEN
    ALTER TABLE gc_ai_conversations
      ADD CONSTRAINT chk_gc_ai_conversations_scope_status
      CHECK (conversation_scope_status IN ('COMMERCIAL_ACTIVE', 'NON_COMMERCIAL_BLOCKED'));
  END IF;
END $$;

ALTER TABLE gc_ai_conversations
  VALIDATE CONSTRAINT chk_gc_ai_conversations_scope_status;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_gc_ai_conversations_off_topic_count'
  ) THEN
    ALTER TABLE gc_ai_conversations
      ADD CONSTRAINT chk_gc_ai_conversations_off_topic_count
      CHECK (off_topic_count >= 0);
  END IF;
END $$;

ALTER TABLE gc_ai_conversations
  VALIDATE CONSTRAINT chk_gc_ai_conversations_off_topic_count;

CREATE INDEX IF NOT EXISTS idx_gc_ai_conversations_scope_status
  ON gc_ai_conversations(conversation_scope_status, updated_at DESC);
