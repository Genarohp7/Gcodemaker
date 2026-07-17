ALTER TABLE gc_broadcast_whatsapp_template_logs
  ADD COLUMN IF NOT EXISTS campaign_id TEXT REFERENCES gc_broadcast_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gc_broadcast_template_logs_campaign
  ON gc_broadcast_whatsapp_template_logs (campaign_id);
