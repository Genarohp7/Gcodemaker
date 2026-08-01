CREATE TABLE IF NOT EXISTS gc_ai_calendar_connections (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'google_calendar',
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  encrypted_refresh_token TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_version TEXT NOT NULL DEFAULT 'v1',
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gc_ai_calendar_connections_provider_check CHECK (provider IN ('google_calendar')),
  CONSTRAINT gc_ai_calendar_connections_status_check CHECK (
    status IN ('ACTIVE', 'DISCONNECTED', 'REVOKED', 'ERROR')
  ),
  CONSTRAINT gc_ai_calendar_connections_active_token_check CHECK (
    status <> 'ACTIVE' OR encrypted_refresh_token IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_ai_calendar_connections_one_active_google
  ON gc_ai_calendar_connections (provider)
  WHERE provider = 'google_calendar' AND status = 'ACTIVE';
