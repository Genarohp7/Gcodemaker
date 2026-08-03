CREATE TABLE IF NOT EXISTS gc_platform_tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (type IN ('NORMAL', 'DEMO', 'INTERNAL')),
  CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE TABLE IF NOT EXISTS gc_platform_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES gc_platform_tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  agent_type TEXT NOT NULL DEFAULT 'COMMERCIAL_ASSISTANT',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, slug),
  CHECK (status IN ('ACTIVE', 'DISABLED'))
);

INSERT INTO gc_platform_tenants (id, slug, name, type, status, settings)
VALUES
  (
    'tenant-gcodemaker-malu',
    'gcodemaker-malu',
    'GCodemaker / Malu',
    'NORMAL',
    'ACTIVE',
    '{"timezone":"America/Mexico_City","locale":"es-MX","modules":["overview","conversations","leads","agenda","analytics","usage","status","qa","settings","users"]}'::jsonb
  ),
  (
    'tenant-gcodemaker-demo',
    'gcodemaker-demo',
    'GCodemaker Demo',
    'DEMO',
    'ACTIVE',
    '{"timezone":"America/Mexico_City","locale":"es-MX","modules":["overview"]}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  settings = gc_platform_tenants.settings || EXCLUDED.settings,
  updated_at = NOW();

INSERT INTO gc_platform_agents (id, tenant_id, slug, name, status, agent_type, settings)
VALUES (
  'agent-malu',
  'tenant-gcodemaker-malu',
  'malu',
  'Malu',
  'ACTIVE',
  'COMMERCIAL_ASSISTANT',
  '{"calendarProvider":"GOOGLE","primaryChannel":"whatsapp"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  agent_type = EXCLUDED.agent_type,
  settings = gc_platform_agents.settings || EXCLUDED.settings,
  updated_at = NOW();

ALTER TABLE gc_broadcast_users
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS platform_role TEXT,
  ADD COLUMN IF NOT EXISTS dashboard_permissions JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE gc_broadcast_users
SET
  tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
  platform_role = COALESCE(
    platform_role,
    CASE
      WHEN role = 'admin_cliente' THEN 'ADMIN'
      WHEN role = 'operador_cliente' THEN 'SALES'
      ELSE 'VIEWER'
    END
  ),
  dashboard_permissions = CASE
    WHEN dashboard_permissions IS NULL THEN '[]'::jsonb
    ELSE dashboard_permissions
  END,
  updated_at = NOW()
WHERE tenant_id IS NULL
   OR platform_role IS NULL
   OR dashboard_permissions IS NULL;

ALTER TABLE gc_broadcast_users
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN platform_role SET DEFAULT 'VIEWER',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN platform_role SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_users_tenant_id
  ON gc_broadcast_users(tenant_id);

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_users_platform_role
  ON gc_broadcast_users(tenant_id, platform_role);

CREATE TABLE IF NOT EXISTS gc_platform_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES gc_platform_tenants(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES gc_broadcast_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_platform_audit_logs_tenant_created
  ON gc_platform_audit_logs(tenant_id, created_at DESC);

ALTER TABLE gc_ai_leads
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_lead_profiles
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_conversations
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_messages
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_usage_logs
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_activity_logs
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_calendar_appointments
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

ALTER TABLE gc_ai_calendar_connections
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES gc_platform_tenants(id),
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES gc_platform_agents(id);

UPDATE gc_ai_leads
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_lead_profiles profiles
SET tenant_id = COALESCE(profiles.tenant_id, leads.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(profiles.agent_id, leads.agent_id, 'agent-malu')
FROM gc_ai_leads leads
WHERE profiles.lead_id = leads.id
  AND (profiles.tenant_id IS NULL OR profiles.agent_id IS NULL);

UPDATE gc_ai_lead_profiles
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_conversations conversations
SET tenant_id = COALESCE(conversations.tenant_id, leads.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(conversations.agent_id, leads.agent_id, 'agent-malu')
FROM gc_ai_leads leads
WHERE conversations.lead_id = leads.id
  AND (conversations.tenant_id IS NULL OR conversations.agent_id IS NULL);

UPDATE gc_ai_conversations
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_messages messages
SET tenant_id = COALESCE(messages.tenant_id, conversations.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(messages.agent_id, conversations.agent_id, 'agent-malu')
FROM gc_ai_conversations conversations
WHERE messages.conversation_id = conversations.id
  AND (messages.tenant_id IS NULL OR messages.agent_id IS NULL);

UPDATE gc_ai_messages
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_usage_logs usage
SET tenant_id = COALESCE(usage.tenant_id, conversations.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(usage.agent_id, conversations.agent_id, 'agent-malu')
FROM gc_ai_conversations conversations
WHERE usage.conversation_id = conversations.id
  AND (usage.tenant_id IS NULL OR usage.agent_id IS NULL);

UPDATE gc_ai_usage_logs usage
SET tenant_id = COALESCE(usage.tenant_id, leads.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(usage.agent_id, leads.agent_id, 'agent-malu')
FROM gc_ai_leads leads
WHERE usage.lead_id = leads.id
  AND (usage.tenant_id IS NULL OR usage.agent_id IS NULL);

UPDATE gc_ai_usage_logs
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_activity_logs
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_calendar_appointments appointments
SET tenant_id = COALESCE(appointments.tenant_id, conversations.tenant_id, leads.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(appointments.agent_id, conversations.agent_id, leads.agent_id, 'agent-malu')
FROM gc_ai_conversations conversations
LEFT JOIN gc_ai_leads leads ON leads.id = conversations.lead_id
WHERE appointments.conversation_id = conversations.id
  AND (appointments.tenant_id IS NULL OR appointments.agent_id IS NULL);

UPDATE gc_ai_calendar_appointments appointments
SET tenant_id = COALESCE(appointments.tenant_id, leads.tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(appointments.agent_id, leads.agent_id, 'agent-malu')
FROM gc_ai_leads leads
WHERE appointments.lead_id = leads.id
  AND (appointments.tenant_id IS NULL OR appointments.agent_id IS NULL);

UPDATE gc_ai_calendar_appointments
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

UPDATE gc_ai_calendar_connections
SET tenant_id = COALESCE(tenant_id, 'tenant-gcodemaker-malu'),
    agent_id = COALESCE(agent_id, 'agent-malu')
WHERE tenant_id IS NULL OR agent_id IS NULL;

ALTER TABLE gc_ai_leads
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_lead_profiles
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_conversations
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_messages
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_usage_logs
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_activity_logs
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_calendar_appointments
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

ALTER TABLE gc_ai_calendar_connections
  ALTER COLUMN tenant_id SET DEFAULT 'tenant-gcodemaker-malu',
  ALTER COLUMN agent_id SET DEFAULT 'agent-malu',
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN agent_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gc_ai_leads_tenant_agent
  ON gc_ai_leads(tenant_id, agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gc_ai_conversations_tenant_agent
  ON gc_ai_conversations(tenant_id, agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gc_ai_messages_tenant_agent
  ON gc_ai_messages(tenant_id, agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gc_ai_usage_logs_tenant_agent
  ON gc_ai_usage_logs(tenant_id, agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gc_ai_calendar_appointments_tenant_agent
  ON gc_ai_calendar_appointments(tenant_id, agent_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_gc_ai_calendar_connections_tenant_agent
  ON gc_ai_calendar_connections(tenant_id, agent_id, provider, status);

DROP INDEX IF EXISTS idx_gc_ai_calendar_connections_one_active_google;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_ai_calendar_connections_one_active_google_per_agent
  ON gc_ai_calendar_connections (tenant_id, agent_id, provider)
  WHERE provider = 'google_calendar' AND status = 'ACTIVE';
