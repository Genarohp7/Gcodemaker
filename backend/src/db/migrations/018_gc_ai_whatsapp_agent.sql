CREATE TABLE IF NOT EXISTS gc_ai_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gc_ai_leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'unknown',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'new',
  interest_level TEXT NOT NULL DEFAULT 'unknown',
  service_interest TEXT,
  qualification_reason TEXT,
  ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  human_takeover BOOLEAN NOT NULL DEFAULT FALSE,
  off_topic_count INTEGER NOT NULL DEFAULT 0,
  ai_response_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_leads_status
  ON gc_ai_leads(status);

CREATE INDEX IF NOT EXISTS idx_gc_ai_leads_source
  ON gc_ai_leads(source);

CREATE INDEX IF NOT EXISTS idx_gc_ai_leads_last_message_at
  ON gc_ai_leads(last_message_at DESC);

CREATE TABLE IF NOT EXISTS gc_ai_lead_profiles (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL UNIQUE REFERENCES gc_ai_leads(id) ON DELETE CASCADE,
  business_type TEXT,
  business_name TEXT,
  project_need TEXT,
  objective TEXT,
  urgency TEXT,
  budget_range TEXT,
  current_solution TEXT,
  summary TEXT,
  next_suggested_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gc_ai_conversations (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES gc_ai_leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'open',
  human_takeover BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode BOOLEAN NOT NULL DEFAULT FALSE,
  demo_remaining_questions INTEGER NOT NULL DEFAULT 0,
  demo_activated_by TEXT REFERENCES gc_ai_users(id) ON DELETE SET NULL,
  demo_expires_at TIMESTAMPTZ,
  previous_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_conversations_lead_id
  ON gc_ai_conversations(lead_id);

CREATE INDEX IF NOT EXISTS idx_gc_ai_conversations_demo_mode
  ON gc_ai_conversations(demo_mode, demo_expires_at);

CREATE TABLE IF NOT EXISTS gc_ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES gc_ai_conversations(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES gc_ai_leads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(12, 6) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_messages_conversation_created
  ON gc_ai_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_gc_ai_messages_lead_created
  ON gc_ai_messages(lead_id, created_at);

CREATE TABLE IF NOT EXISTS gc_ai_usage_logs (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES gc_ai_leads(id) ON DELETE SET NULL,
  conversation_id TEXT REFERENCES gc_ai_conversations(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(12, 6) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_usage_logs_created_at
  ON gc_ai_usage_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS gc_ai_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES gc_ai_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_ai_activity_logs_entity
  ON gc_ai_activity_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS gc_ai_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gc_ai_settings (key, value)
VALUES
  ('ai_global_enabled', 'true'::jsonb),
  ('max_ai_responses_per_lead', '3'::jsonb),
  ('max_demo_questions', '3'::jsonb),
  ('demo_expiration_minutes', '15'::jsonb),
  ('daily_ai_response_limit', '50'::jsonb),
  (
    'welcome_message',
    '"Hola! Gracias por contactar a GCodemaker. Para orientarte mejor, buscas una pagina web, una automatizacion con IA, un sistema a medida o solo quieres conocer nuestros servicios?"'::jsonb
  ),
  (
    'off_topic_message',
    '"Puedo ayudarte unicamente con informacion relacionada con los servicios de GCodemaker, como paginas web, sistemas a medida o automatizaciones con IA para negocios. Si necesitas alguno de estos servicios, con gusto te oriento."'::jsonb
  )
ON CONFLICT (key) DO NOTHING;
