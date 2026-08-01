ALTER TABLE gc_ai_conversations
  ADD COLUMN IF NOT EXISTS conversation_owner TEXT,
  ADD COLUMN IF NOT EXISTS handoff_finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_handoff_interaction_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS handoff_contact_requested_at TIMESTAMPTZ;

UPDATE gc_ai_conversations
SET conversation_owner = CASE
  WHEN human_takeover IS TRUE THEN 'INGENIERO'
  ELSE 'MALU'
END
WHERE conversation_owner IS NULL;

ALTER TABLE gc_ai_conversations
  ALTER COLUMN conversation_owner SET DEFAULT 'MALU',
  ALTER COLUMN conversation_owner SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_gc_ai_conversations_owner'
  ) THEN
    ALTER TABLE gc_ai_conversations
      ADD CONSTRAINT chk_gc_ai_conversations_owner
      CHECK (conversation_owner IN ('MALU', 'INGENIERO')) NOT VALID;
  END IF;
END $$;

ALTER TABLE gc_ai_conversations
  VALIDATE CONSTRAINT chk_gc_ai_conversations_owner;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_gc_ai_conversations_post_handoff_count'
  ) THEN
    ALTER TABLE gc_ai_conversations
      ADD CONSTRAINT chk_gc_ai_conversations_post_handoff_count
      CHECK (post_handoff_interaction_count >= 0) NOT VALID;
  END IF;
END $$;

ALTER TABLE gc_ai_conversations
  VALIDATE CONSTRAINT chk_gc_ai_conversations_post_handoff_count;

-- Historical duplicate policy:
-- provider_message_id represents the external inbound/outbound message identity.
-- Before enforcing uniqueness, keep the earliest row for each provider/provider_message_id
-- by created_at and id. Duplicate rows are not deleted because their content may still be
-- useful for audit; instead, only the duplicate external id is cleared and a sanitized
-- deduplication marker is recorded so no distinct message text is lost.
WITH ranked_messages AS (
  SELECT
    id,
    provider_message_id,
    ROW_NUMBER() OVER (
      PARTITION BY provider, provider_message_id
      ORDER BY created_at ASC, id ASC
    ) AS row_number
  FROM gc_ai_messages
  WHERE provider_message_id IS NOT NULL
)
UPDATE gc_ai_messages messages
SET
  metadata = jsonb_set(
    COALESCE(messages.metadata, '{}'::jsonb),
    '{deduplication}',
    jsonb_build_object(
      'reason',
      'historical_duplicate_provider_message_id',
      'deduplicatedAt',
      NOW()
    ),
    TRUE
  ),
  provider_message_id = NULL
FROM ranked_messages ranked
WHERE messages.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_ai_messages_provider_message_id_unique
  ON gc_ai_messages(provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
