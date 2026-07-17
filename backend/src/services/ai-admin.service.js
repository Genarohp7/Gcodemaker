const { pool } = require("../db");
const demoModeService = require("./demo-mode.service");

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function getLeads({ status, source, serviceInterest, limit = 50, offset = 0 }) {
  const filters = [];
  const params = [];

  if (status) {
    params.push(status);
    filters.push(`leads.status = $${params.length}`);
  }

  if (source) {
    params.push(source);
    filters.push(`leads.source = $${params.length}`);
  }

  if (serviceInterest) {
    params.push(serviceInterest);
    filters.push(`leads.service_interest = $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  params.push(toPositiveInteger(limit, 50), Math.max(Number(offset) || 0, 0));

  const result = await pool.query(
    `
      SELECT
        leads.*,
        profiles.summary,
        profiles.next_suggested_action,
        conversations.id AS conversation_id,
        conversations.demo_mode,
        conversations.demo_remaining_questions,
        conversations.demo_expires_at
      FROM gc_ai_leads leads
      LEFT JOIN gc_ai_lead_profiles profiles
        ON profiles.lead_id = leads.id
      LEFT JOIN LATERAL (
        SELECT *
        FROM gc_ai_conversations
        WHERE lead_id = leads.id
        ORDER BY updated_at DESC
        LIMIT 1
      ) conversations ON TRUE
      ${whereClause}
      ORDER BY leads.last_message_at DESC NULLS LAST, leads.created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );

  return result.rows;
}

async function getLeadById(id) {
  const result = await pool.query(
    `
      SELECT
        leads.*,
        profiles.business_type,
        profiles.business_name,
        profiles.project_need,
        profiles.objective,
        profiles.urgency,
        profiles.budget_range,
        profiles.current_solution,
        profiles.summary,
        profiles.next_suggested_action
      FROM gc_ai_leads leads
      LEFT JOIN gc_ai_lead_profiles profiles
        ON profiles.lead_id = leads.id
      WHERE leads.id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function updateLeadStatus({ leadId, status }) {
  const result = await pool.query(
    `
      UPDATE gc_ai_leads
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [leadId, status]
  );

  return result.rows[0] || null;
}

async function getConversationMessages({ conversationId, limit = 100 }) {
  const result = await pool.query(
    `
      SELECT *
      FROM gc_ai_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `,
    [conversationId, toPositiveInteger(limit, 100)]
  );

  return result.rows;
}

async function activateDemo({ phone }) {
  return demoModeService.activateDemo({
    targetPhone: String(phone || "").replace(/\D/g, ""),
    adminPhone: "admin_api",
  });
}

async function deactivateDemo({ phone }) {
  return demoModeService.deactivateDemo({
    targetPhone: String(phone || "").replace(/\D/g, ""),
    adminPhone: "admin_api",
    reason: "admin_api",
  });
}

async function getMetrics() {
  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_leads,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::int AS leads_today,
        COUNT(*) FILTER (WHERE status = 'qualified_for_human')::int AS qualified_for_human,
        COUNT(*) FILTER (WHERE status = 'off_topic')::int AS off_topic,
        COUNT(*) FILTER (WHERE status = 'demo_active')::int AS demo_active,
        COUNT(*) FILTER (WHERE status = 'demo_finished')::int AS demo_finished,
        COALESCE(SUM(ai_response_count), 0)::int AS ai_responses
      FROM gc_ai_leads
    `
  );
  const usage = await pool.query(
    `
      SELECT
        COALESCE(SUM(tokens_input), 0)::int AS tokens_input,
        COALESCE(SUM(tokens_output), 0)::int AS tokens_output,
        COALESCE(SUM(estimated_cost), 0)::numeric AS estimated_cost
      FROM gc_ai_usage_logs
      WHERE created_at::date = CURRENT_DATE
    `
  );

  return {
    ...result.rows[0],
    usageToday: usage.rows[0],
  };
}

async function getSettings() {
  const result = await pool.query(
    `
      SELECT key, value, updated_at
      FROM gc_ai_settings
      ORDER BY key ASC
    `
  );

  return result.rows;
}

async function updateSetting({ key, value }) {
  const result = await pool.query(
    `
      INSERT INTO gc_ai_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET
        value = EXCLUDED.value,
        updated_at = NOW()
      RETURNING *
    `,
    [key, JSON.stringify(value)]
  );

  return result.rows[0];
}

module.exports = {
  getLeads,
  getLeadById,
  updateLeadStatus,
  getConversationMessages,
  activateDemo,
  deactivateDemo,
  getMetrics,
  getSettings,
  updateSetting,
};
