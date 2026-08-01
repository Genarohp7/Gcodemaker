CREATE TABLE IF NOT EXISTS gc_ai_conversation_reviews (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL UNIQUE REFERENCES gc_ai_conversations(id) ON DELETE CASCADE,
  reviewer_user_id TEXT REFERENCES gc_ai_users(id) ON DELETE SET NULL,
  review_status TEXT NOT NULL DEFAULT 'PENDING',
  discovery_score INTEGER,
  context_quality_score INTEGER,
  question_efficiency_score INTEGER,
  handoff_quality_score INTEGER,
  customer_friction_score INTEGER,
  required_repeat_questions BOOLEAN,
  transferred_too_early BOOLEAN,
  transferred_too_late BOOLEAN,
  asked_irrelevant_questions BOOLEAN,
  invented_information BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT chk_gc_ai_conversation_reviews_status
    CHECK (review_status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
  CONSTRAINT chk_gc_ai_conversation_reviews_discovery_score
    CHECK (discovery_score IS NULL OR discovery_score BETWEEN 1 AND 5),
  CONSTRAINT chk_gc_ai_conversation_reviews_context_quality_score
    CHECK (context_quality_score IS NULL OR context_quality_score BETWEEN 1 AND 5),
  CONSTRAINT chk_gc_ai_conversation_reviews_question_efficiency_score
    CHECK (question_efficiency_score IS NULL OR question_efficiency_score BETWEEN 1 AND 5),
  CONSTRAINT chk_gc_ai_conversation_reviews_handoff_quality_score
    CHECK (handoff_quality_score IS NULL OR handoff_quality_score BETWEEN 1 AND 5),
  CONSTRAINT chk_gc_ai_conversation_reviews_customer_friction_score
    CHECK (customer_friction_score IS NULL OR customer_friction_score BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_conversation_reviews_status
  ON gc_ai_conversation_reviews(review_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS gc_ai_learning_findings (
  id TEXT PRIMARY KEY,
  finding_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  sample_conversation_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_pattern TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  proposed_change TEXT NOT NULL,
  affected_layer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  source_version TEXT,
  target_version TEXT,
  created_by TEXT REFERENCES gc_ai_users(id) ON DELETE SET NULL,
  approved_by TEXT REFERENCES gc_ai_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  CONSTRAINT chk_gc_ai_learning_findings_affected_layer
    CHECK (
      affected_layer IN (
        'BUSINESS_KNOWLEDGE',
        'BEHAVIOR_RULES',
        'COGNITIVE_LAYER',
        'DETERMINISTIC_BACKEND',
        'CONVERSATION_STYLE'
      )
    ),
  CONSTRAINT chk_gc_ai_learning_findings_status
    CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED')),
  CONSTRAINT chk_gc_ai_learning_findings_sample_ids_array
    CHECK (jsonb_typeof(sample_conversation_ids) = 'array'),
  CONSTRAINT chk_gc_ai_learning_findings_implemented_version
    CHECK (status <> 'IMPLEMENTED' OR target_version IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_learning_findings_status
  ON gc_ai_learning_findings(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS gc_ai_framework_versions (
  id TEXT PRIMARY KEY,
  framework_name TEXT NOT NULL,
  version TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  source_finding_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_gc_ai_framework_versions_status
    CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  CONSTRAINT chk_gc_ai_framework_versions_source_ids_array
    CHECK (jsonb_typeof(source_finding_ids) = 'array'),
  CONSTRAINT uq_gc_ai_framework_versions_name_version
    UNIQUE (framework_name, version)
);

CREATE OR REPLACE VIEW gc_ai_conversation_review_metrics AS
WITH message_metrics AS (
  SELECT
    conversation_id,
    COUNT(*) FILTER (WHERE role = 'lead')::int AS inbound_count,
    COUNT(*) FILTER (WHERE role = 'ai')::int AS outbound_count,
    COUNT(*) FILTER (WHERE role = 'ai' AND provider = 'whatsapp_cloud_api')::int AS ai_response_count,
    MIN(created_at) AS first_message_at,
    MAX(created_at) AS last_message_at
  FROM gc_ai_messages
  GROUP BY conversation_id
)
SELECT
  conversations.id AS conversation_id,
  conversations.lead_id,
  COALESCE(message_metrics.inbound_count, 0) AS inbound_count,
  COALESCE(message_metrics.outbound_count, 0) AS outbound_count,
  COALESCE(message_metrics.ai_response_count, 0) AS ai_response_count,
  message_metrics.first_message_at,
  message_metrics.last_message_at,
  CASE
    WHEN message_metrics.first_message_at IS NULL OR message_metrics.last_message_at IS NULL THEN NULL
    ELSE message_metrics.last_message_at - message_metrics.first_message_at
  END AS conversation_duration,
  (conversations.human_takeover IS TRUE OR conversations.conversation_owner = 'INGENIERO') AS had_handoff,
  conversations.post_handoff_interaction_count,
  (
    (conversations.human_takeover IS NOT TRUE AND COALESCE(conversations.conversation_owner, 'MALU') <> 'INGENIERO')
    AND COALESCE(message_metrics.inbound_count, 0) > COALESCE(message_metrics.outbound_count, 0)
  ) AS customer_abandoned_before_handoff,
  reviews.required_repeat_questions
FROM gc_ai_conversations conversations
LEFT JOIN message_metrics
  ON message_metrics.conversation_id = conversations.id
LEFT JOIN gc_ai_conversation_reviews reviews
  ON reviews.conversation_id = conversations.id;
