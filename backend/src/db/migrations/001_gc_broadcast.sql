CREATE TABLE IF NOT EXISTS gc_broadcast_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT NOT NULL,
  plan_limit INTEGER NOT NULL DEFAULT 1000,
  operational_protection INTEGER NOT NULL DEFAULT 300,
  operational_capacity INTEGER NOT NULL DEFAULT 1300,
  monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 4500,
  extra_block_size INTEGER NOT NULL DEFAULT 50,
  extra_block_price NUMERIC(12, 2) NOT NULL DEFAULT 75,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gc_broadcast_lines (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES gc_broadcast_companies(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_international TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  campaigns INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_configuration',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, phone)
);

CREATE TABLE IF NOT EXISTS gc_broadcast_users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES gc_broadcast_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  assigned_messages INTEGER NOT NULL DEFAULT 0,
  menu_access JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'invitation_pending',
  last_access_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, phone)
);

CREATE TABLE IF NOT EXISTS gc_broadcast_campaigns (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES gc_broadcast_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  line_id TEXT REFERENCES gc_broadcast_lines(id) ON DELETE SET NULL,
  message_template TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  attachment_mode TEXT NOT NULL DEFAULT 'none',
  status TEXT NOT NULL DEFAULT 'draft',
  responsible_user_id TEXT REFERENCES gc_broadcast_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gc_broadcast_campaign_recipients (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES gc_broadcast_campaigns(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachment_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gc_broadcast_webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'whatsapp',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gc_broadcast_companies (
  id,
  name,
  alias,
  plan_limit,
  operational_protection,
  operational_capacity,
  monthly_fee,
  extra_block_size,
  extra_block_price
)
VALUES (
  'cacp',
  'Centro de Actualizacion y Capacitacion Profesional',
  'CACP',
  1000,
  300,
  1300,
  4500,
  50,
  75
)
ON CONFLICT (id) DO NOTHING;
