const { pool } = require("../db");
const demoModeService = require("./demo-mode.service");
const crypto = require("crypto");

const REVIEW_STATUSES = new Set(["PENDING", "REVIEWED", "DISMISSED"]);
const FINDING_STATUSES = new Set(["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED", "IMPLEMENTED"]);
const AFFECTED_LAYERS = new Set([
  "BUSINESS_KNOWLEDGE",
  "BEHAVIOR_RULES",
  "COGNITIVE_LAYER",
  "DETERMINISTIC_BACKEND",
  "CONVERSATION_STYLE",
]);
const FRAMEWORK_STATUSES = new Set(["DRAFT", "ACTIVE", "ARCHIVED"]);

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length <= 4) {
    return digits ? `****${digits}` : null;
  }

  return `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

function assertScore(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    const error = new Error(`${fieldName} debe estar entre 1 y 5`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function assertEnum(value, validValues, fieldName) {
  if (!validValues.has(value)) {
    const error = new Error(`${fieldName} no es valido`);
    error.statusCode = 400;
    throw error;
  }

  return value;
}

function normalizeBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return Boolean(value);
}

function normalizeString(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeJsonArray(value, fieldName) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} debe ser un arreglo`);
    error.statusCode = 400;
    throw error;
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function requireText(value, fieldName) {
  const text = normalizeString(value);

  if (!text) {
    const error = new Error(`${fieldName} es obligatorio`);
    error.statusCode = 400;
    throw error;
  }

  return text;
}

function sanitizeMessageRow(message) {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    lead_id: message.lead_id,
    role: message.role,
    content: message.content,
    provider: message.provider,
    provider_message_id: message.provider_message_id,
    message_type: message.message_type,
    created_at: message.created_at,
  };
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
        conversations.conversation_owner,
        conversations.handoff_finalized_at,
        conversations.post_handoff_interaction_count,
        conversations.handoff_contact_requested_at,
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
        profiles.next_suggested_action,
        conversations.id AS conversation_id,
        conversations.conversation_owner,
        conversations.handoff_finalized_at,
        conversations.post_handoff_interaction_count,
        conversations.handoff_contact_requested_at
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

async function listPendingLearningReviews({ limit = 50, offset = 0, status = "PENDING" } = {}) {
  const reviewStatus = REVIEW_STATUSES.has(status) ? status : "PENDING";
  const result = await pool.query(
    `
      SELECT
        conversations.id AS conversation_id,
        conversations.lead_id,
        conversations.channel,
        conversations.status AS conversation_status,
        conversations.conversation_owner,
        conversations.human_takeover,
        conversations.created_at,
        conversations.updated_at,
        leads.name AS lead_name,
        leads.phone AS lead_phone,
        metrics.inbound_count,
        metrics.outbound_count,
        metrics.ai_response_count,
        metrics.conversation_duration,
        metrics.had_handoff,
        metrics.post_handoff_interaction_count,
        metrics.customer_abandoned_before_handoff,
        metrics.required_repeat_questions,
        reviews.review_status,
        reviews.reviewed_at
      FROM gc_ai_conversations conversations
      JOIN gc_ai_leads leads
        ON leads.id = conversations.lead_id
      LEFT JOIN gc_ai_conversation_reviews reviews
        ON reviews.conversation_id = conversations.id
      LEFT JOIN gc_ai_conversation_review_metrics metrics
        ON metrics.conversation_id = conversations.id
      WHERE COALESCE(reviews.review_status, 'PENDING') = $1
      ORDER BY conversations.updated_at DESC
      LIMIT $2
      OFFSET $3
    `,
    [reviewStatus, toPositiveInteger(limit, 50), Math.max(Number(offset) || 0, 0)]
  );

  return result.rows.map((row) => ({
    ...row,
    lead_phone: maskPhone(row.lead_phone),
  }));
}

async function getLearningConversationDetail({ conversationId }) {
  const conversationResult = await pool.query(
    `
      SELECT
        conversations.*,
        leads.name AS lead_name,
        leads.phone AS lead_phone,
        metrics.inbound_count,
        metrics.outbound_count,
        metrics.ai_response_count,
        metrics.conversation_duration,
        metrics.had_handoff,
        metrics.post_handoff_interaction_count AS metric_post_handoff_interaction_count,
        metrics.customer_abandoned_before_handoff,
        metrics.required_repeat_questions,
        reviews.id AS review_id,
        reviews.review_status,
        reviews.discovery_score,
        reviews.context_quality_score,
        reviews.question_efficiency_score,
        reviews.handoff_quality_score,
        reviews.customer_friction_score,
        reviews.transferred_too_early,
        reviews.transferred_too_late,
        reviews.asked_irrelevant_questions,
        reviews.invented_information,
        reviews.notes,
        reviews.reviewed_at
      FROM gc_ai_conversations conversations
      JOIN gc_ai_leads leads
        ON leads.id = conversations.lead_id
      LEFT JOIN gc_ai_conversation_review_metrics metrics
        ON metrics.conversation_id = conversations.id
      LEFT JOIN gc_ai_conversation_reviews reviews
        ON reviews.conversation_id = conversations.id
      WHERE conversations.id = $1
      LIMIT 1
    `,
    [conversationId]
  );
  const conversation = conversationResult.rows[0];

  if (!conversation) {
    return null;
  }

  const messages = await getConversationMessages({
    conversationId,
    limit: 500,
  });

  return {
    ...conversation,
    lead_phone: maskPhone(conversation.lead_phone),
    messages: messages.map(sanitizeMessageRow),
  };
}

async function saveConversationReview({ conversationId, reviewerUserId = null, review }) {
  const reviewStatus = assertEnum(review.reviewStatus || "REVIEWED", REVIEW_STATUSES, "reviewStatus");
  const result = await pool.query(
    `
      INSERT INTO gc_ai_conversation_reviews (
        id,
        conversation_id,
        reviewer_user_id,
        review_status,
        discovery_score,
        context_quality_score,
        question_efficiency_score,
        handoff_quality_score,
        customer_friction_score,
        required_repeat_questions,
        transferred_too_early,
        transferred_too_late,
        asked_irrelevant_questions,
        invented_information,
        notes,
        reviewed_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        CASE WHEN $4 = 'REVIEWED' THEN NOW() ELSE NULL END
      )
      ON CONFLICT (conversation_id) DO UPDATE
      SET
        reviewer_user_id = EXCLUDED.reviewer_user_id,
        review_status = EXCLUDED.review_status,
        discovery_score = EXCLUDED.discovery_score,
        context_quality_score = EXCLUDED.context_quality_score,
        question_efficiency_score = EXCLUDED.question_efficiency_score,
        handoff_quality_score = EXCLUDED.handoff_quality_score,
        customer_friction_score = EXCLUDED.customer_friction_score,
        required_repeat_questions = EXCLUDED.required_repeat_questions,
        transferred_too_early = EXCLUDED.transferred_too_early,
        transferred_too_late = EXCLUDED.transferred_too_late,
        asked_irrelevant_questions = EXCLUDED.asked_irrelevant_questions,
        invented_information = EXCLUDED.invented_information,
        notes = EXCLUDED.notes,
        updated_at = NOW(),
        reviewed_at = CASE WHEN EXCLUDED.review_status = 'REVIEWED' THEN NOW() ELSE gc_ai_conversation_reviews.reviewed_at END
      RETURNING *
    `,
    [
      createId("review"),
      conversationId,
      reviewerUserId || null,
      reviewStatus,
      assertScore(review.discoveryScore, "discoveryScore"),
      assertScore(review.contextQualityScore, "contextQualityScore"),
      assertScore(review.questionEfficiencyScore, "questionEfficiencyScore"),
      assertScore(review.handoffQualityScore, "handoffQualityScore"),
      assertScore(review.customerFrictionScore, "customerFrictionScore"),
      normalizeBoolean(review.requiredRepeatQuestions),
      normalizeBoolean(review.transferredTooEarly),
      normalizeBoolean(review.transferredTooLate),
      normalizeBoolean(review.askedIrrelevantQuestions),
      normalizeBoolean(review.inventedInformation),
      normalizeString(review.notes),
    ]
  );

  return result.rows[0];
}

async function createLearningFinding({ finding, createdBy = null }) {
  const result = await pool.query(
    `
      INSERT INTO gc_ai_learning_findings (
        id,
        finding_code,
        title,
        description,
        evidence_summary,
        sample_conversation_ids,
        detected_pattern,
        expected_impact,
        proposed_change,
        affected_layer,
        status,
        source_version,
        target_version,
        created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
    `,
    [
      createId("finding"),
      requireText(finding.findingCode, "findingCode"),
      requireText(finding.title, "title"),
      requireText(finding.description, "description"),
      requireText(finding.evidenceSummary, "evidenceSummary"),
      JSON.stringify(normalizeJsonArray(finding.sampleConversationIds, "sampleConversationIds")),
      requireText(finding.detectedPattern, "detectedPattern"),
      requireText(finding.expectedImpact, "expectedImpact"),
      requireText(finding.proposedChange, "proposedChange"),
      assertEnum(finding.affectedLayer, AFFECTED_LAYERS, "affectedLayer"),
      assertEnum(finding.status || "DRAFT", FINDING_STATUSES, "status"),
      normalizeString(finding.sourceVersion),
      normalizeString(finding.targetVersion),
      createdBy || null,
    ]
  );

  return result.rows[0];
}

async function listLearningFindings({ status, limit = 50, offset = 0 } = {}) {
  const params = [];
  const filters = [];

  if (status) {
    params.push(assertEnum(status, FINDING_STATUSES, "status"));
    filters.push(`status = $${params.length}`);
  }

  params.push(toPositiveInteger(limit, 50), Math.max(Number(offset) || 0, 0));

  const result = await pool.query(
    `
      SELECT *
      FROM gc_ai_learning_findings
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY updated_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );

  return result.rows;
}

async function updateLearningFindingStatus({ findingId, status, targetVersion = null, approvedBy = null }) {
  const nextStatus = assertEnum(status, FINDING_STATUSES, "status");
  const normalizedTargetVersion = normalizeString(targetVersion);

  if (nextStatus === "IMPLEMENTED" && !normalizedTargetVersion) {
    const error = new Error("targetVersion es obligatorio para IMPLEMENTED");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
      UPDATE gc_ai_learning_findings
      SET
        status = $2,
        target_version = COALESCE($3, target_version),
        approved_by = CASE WHEN $2 = 'APPROVED' THEN $4 ELSE approved_by END,
        approved_at = CASE WHEN $2 = 'APPROVED' THEN NOW() ELSE approved_at END,
        implemented_at = CASE WHEN $2 = 'IMPLEMENTED' THEN NOW() ELSE implemented_at END,
        updated_at = NOW()
      WHERE id = $1 OR finding_code = $1
      RETURNING *
    `,
    [findingId, nextStatus, normalizedTargetVersion, approvedBy || null]
  );

  return result.rows[0] || null;
}

async function createFrameworkVersion({ version, createdBy = null }) {
  const result = await pool.query(
    `
      INSERT INTO gc_ai_framework_versions (
        id,
        framework_name,
        version,
        change_summary,
        source_finding_ids,
        status,
        activated_at
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb, $6,
        CASE WHEN $6 = 'ACTIVE' THEN NOW() ELSE NULL END
      )
      RETURNING *, $7::text AS created_by
    `,
    [
      createId("framework"),
      requireText(version.frameworkName, "frameworkName"),
      requireText(version.version, "version"),
      requireText(version.changeSummary, "changeSummary"),
      JSON.stringify(normalizeJsonArray(version.sourceFindingIds, "sourceFindingIds")),
      assertEnum(version.status || "DRAFT", FRAMEWORK_STATUSES, "status"),
      createdBy || null,
    ]
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
  listPendingLearningReviews,
  getLearningConversationDetail,
  saveConversationReview,
  createLearningFinding,
  listLearningFindings,
  updateLearningFindingStatus,
  createFrameworkVersion,
};
