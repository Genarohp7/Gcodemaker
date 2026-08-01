CREATE TABLE IF NOT EXISTS gc_ai_calendar_appointments (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES gc_ai_conversations(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES gc_ai_leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  modality TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  engineer_timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  prospect_timezone TEXT,
  location JSONB,
  google_calendar_event_id TEXT,
  google_meet_link TEXT,
  idempotency_key TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gc_ai_calendar_appointments_status_check CHECK (
    status IN ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED')
  ),
  CONSTRAINT gc_ai_calendar_appointments_modality_check CHECK (
    modality IN ('PRESENCIAL', 'VIDEOLLAMADA', 'LLAMADA')
  ),
  CONSTRAINT gc_ai_calendar_appointments_dates_check CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_ai_calendar_appointments_idempotency
  ON gc_ai_calendar_appointments (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_gc_ai_calendar_appointments_conversation
  ON gc_ai_calendar_appointments (conversation_id, created_at DESC);
