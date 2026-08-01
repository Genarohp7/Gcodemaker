const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const whatsappAgentService = require("./whatsapp-agent.service");

const SIMULATOR_PHONE_NUMBER_ID = "simulator-phone-number-id";
const SIMULATOR_PROFILE_NAME = "Usuario de prueba";

function ensureQaPanelEnabled() {
  if (!env.gcMaluQaPanelEnabled) {
    const error = new Error("Panel QA de Malu no habilitado");
    error.statusCode = 403;
    throw error;
  }
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeSessionId(sessionId) {
  const value = String(sessionId || "").trim();

  if (!value) {
    return crypto.randomUUID();
  }

  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(value)) {
    const error = new Error("sessionId invalido");
    error.statusCode = 400;
    throw error;
  }

  return value;
}

function getSimulatorPhone(sessionId) {
  const digest = crypto.createHash("sha256").update(`malu-simulator:${sessionId}`).digest("hex");
  const digits = BigInt(`0x${digest}`).toString().replace(/\D/g, "").slice(0, 12).padEnd(12, "0");

  return `999${digits}`;
}

function assertText(text) {
  const value = String(text || "");

  if (!value.trim()) {
    const error = new Error("El mensaje es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  if (value.length > 2000) {
    const error = new Error("El mensaje excede el maximo permitido");
    error.statusCode = 400;
    throw error;
  }

  return value;
}

function normalizeMode(mode) {
  return mode === "LIVE_AI" ? "LIVE_AI" : "MOCK";
}

function hasLiveAiKey() {
  const key = String(env.openAiApiKey || "").trim();

  return Boolean(key && key !== "local-disabled-placeholder");
}

function getSchedulingState(activities) {
  const schedulingEvents = activities.filter(
    (activity) => activity.action === "malu_scheduling_state_changed"
  );
  const latest = schedulingEvents.at(-1)?.metadata || {
    status: "PROFILING",
  };
  const latestSlotEvent = [...schedulingEvents]
    .reverse()
    .find((activity) => activity.metadata?.slots?.length)?.metadata;
  const latestAppointmentEvent = [...schedulingEvents]
    .reverse()
    .find((activity) => activity.metadata?.appointment)?.metadata;

  return {
    status: latest.status || "PROFILING",
    slots: latest.slots || latestSlotEvent?.slots || [],
    selectedSlot:
      latest.selectedSlot ||
      latest.appointment?.slot ||
      latestAppointmentEvent?.appointment?.slot ||
      null,
    appointment: latest.appointment || latestAppointmentEvent?.appointment || null,
    summary: latest.summary || latestAppointmentEvent?.summary || null,
    modality:
      latest.modality ||
      latestAppointmentEvent?.modality ||
      latest.appointment?.modality ||
      latestAppointmentEvent?.appointment?.modality ||
      null,
    location:
      latest.location ||
      latestAppointmentEvent?.location ||
      latest.appointment?.location ||
      latestAppointmentEvent?.appointment?.location ||
      null,
    timeZone:
      latest.timeZone ||
      latestAppointmentEvent?.timeZone ||
      latest.appointment?.timeZone ||
      latestAppointmentEvent?.appointment?.timeZone ||
      null,
    googleCalendarEventId:
      latest.googleCalendarEventId ||
      latestAppointmentEvent?.googleCalendarEventId ||
      latest.appointment?.googleCalendarEventId ||
      latestAppointmentEvent?.appointment?.googleCalendarEventId ||
      null,
    simulated: Boolean(latest.slots || latestSlotEvent?.slots || latestAppointmentEvent?.appointment?.simulated),
  };
}

function getScopeMetrics({ messages, activities, lead, conversation }) {
  const inboundTotal = messages.filter((message) => message.role === "lead").length;
  const scopeEvents = activities.filter(
    (activity) => activity.action === "malu_scope_consumption_metric"
  );
  const openAiCalls = scopeEvents.filter(
    (activity) => activity.metadata?.event === "openai_call"
  ).length;
  const deterministicResponses = scopeEvents.filter(
    (activity) => activity.metadata?.event === "deterministic_response"
  ).length;
  const nonCommercialBlocked = scopeEvents.filter(
    (activity) => activity.metadata?.event === "non_commercial_blocked"
  ).length;
  const commercialReactivations = scopeEvents.filter(
    (activity) => activity.metadata?.event === "commercial_reactivation"
  ).length;
  const openAiCallsAvoided = scopeEvents.filter(
    (activity) => activity.metadata?.openAiAvoided === true
  ).length;
  const eligible = openAiCalls + openAiCallsAvoided;

  return {
    status: conversation.conversation_scope_status || "COMMERCIAL_ACTIVE",
    offTopicCount: conversation.scope_off_topic_count || lead.off_topic_count || 0,
    nonCommercialBlockedAt: conversation.non_commercial_blocked_at || null,
    commercialReactivatedAt: conversation.commercial_reactivated_at || null,
    inboundTotal,
    openAiCalls,
    deterministicResponses,
    offTopicBlocked: openAiCallsAvoided,
    nonCommercialBlocked,
    commercialReactivations,
    openAiCallsAvoided,
    openAiAvoidanceRate: eligible ? Number((openAiCallsAvoided / eligible).toFixed(2)) : 0,
  };
}

async function ensureSimulatorSession({ sessionId }) {
  ensureQaPanelEnabled();

  const safeSessionId = normalizeSessionId(sessionId);
  const phone = getSimulatorPhone(safeSessionId);
  const leadResult = await pool.query(
    `
      INSERT INTO gc_ai_leads (
        id,
        name,
        phone,
        source,
        channel,
        status,
        last_message_at
      )
      VALUES ($1, $2, $3, 'simulator', 'whatsapp', 'new', NOW())
      ON CONFLICT (phone) DO UPDATE
      SET
        name = COALESCE(gc_ai_leads.name, EXCLUDED.name),
        source = CASE WHEN gc_ai_leads.source = 'unknown' THEN 'simulator' ELSE gc_ai_leads.source END,
        last_message_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `,
    [createId("sim-lead"), SIMULATOR_PROFILE_NAME, phone]
  );
  const lead = leadResult.rows[0];
  const conversationResult = await pool.query(
    `
      INSERT INTO gc_ai_conversations (
        id,
        lead_id,
        channel,
        status,
        conversation_owner
      )
      SELECT $1, $2, 'whatsapp', 'open', 'MALU'
      WHERE NOT EXISTS (
        SELECT 1
        FROM gc_ai_conversations
        WHERE lead_id = $2
          AND channel = 'whatsapp'
          AND status = 'open'
      )
      RETURNING *
    `,
    [
      createId("sim-conversation"),
      lead.id,
    ]
  );

  if (conversationResult.rows[0]) {
    return {
      sessionId: safeSessionId,
      lead,
      conversation: {
        ...conversationResult.rows[0],
        isNew: true,
      },
    };
  }

  const existingConversation = await pool.query(
    `
      SELECT *
      FROM gc_ai_conversations
      WHERE lead_id = $1
        AND channel = 'whatsapp'
        AND status = 'open'
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [lead.id]
  );

  return {
    sessionId: safeSessionId,
    lead,
    conversation: {
      ...existingConversation.rows[0],
      isNew: false,
    },
  };
}

async function getSimulatorConversation({ sessionId }) {
  ensureQaPanelEnabled();

  const safeSessionId = normalizeSessionId(sessionId);
  const phone = getSimulatorPhone(safeSessionId);
  const result = await pool.query(
    `
      SELECT
        leads.id AS lead_id,
        leads.name,
        leads.phone,
        leads.status AS lead_status,
        leads.ai_enabled,
        leads.human_takeover AS lead_human_takeover,
        leads.ai_response_count,
        leads.off_topic_count,
        conversations.id AS conversation_id,
        conversations.status AS conversation_status,
        conversations.conversation_owner,
        conversations.human_takeover,
        conversations.post_handoff_interaction_count,
        conversations.handoff_finalized_at,
        conversations.handoff_contact_requested_at,
        conversations.conversation_scope_status,
        conversations.off_topic_count AS scope_off_topic_count,
        conversations.non_commercial_blocked_at,
        conversations.commercial_reactivated_at,
        NULL::jsonb AS metadata
      FROM gc_ai_leads leads
      JOIN gc_ai_conversations conversations
        ON conversations.lead_id = leads.id
      WHERE leads.phone = $1
        AND leads.source = 'simulator'
      ORDER BY conversations.updated_at DESC
      LIMIT 1
    `,
    [phone]
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const messages = await pool.query(
    `
      SELECT
        id,
        role,
        content,
        provider,
        provider_message_id,
        message_type,
        created_at,
        metadata
      FROM gc_ai_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [row.conversation_id]
  );
  const activities = await pool.query(
    `
      SELECT id, action, entity_type, created_at, metadata
      FROM gc_ai_activity_logs
      WHERE entity_id = $1
      ORDER BY created_at ASC
    `,
    [row.conversation_id]
  );
  const scheduling = getSchedulingState(activities.rows);
  const scope = getScopeMetrics({
    messages: messages.rows,
    activities: activities.rows,
    lead: row,
    conversation: row,
  });

  return {
    sessionId: safeSessionId,
    lead: {
      id: row.lead_id,
      name: row.name,
      phone: "SIMULATOR",
      status: row.lead_status,
      aiEnabled: row.ai_enabled,
      humanTakeover: row.lead_human_takeover,
      aiResponseCount: row.ai_response_count,
      offTopicCount: row.off_topic_count,
    },
    conversation: {
      id: row.conversation_id,
      status: row.conversation_status,
      owner: row.conversation_owner,
      humanTakeover: row.human_takeover,
      postHandoffInteractionCount: row.post_handoff_interaction_count,
      handoffFinalizedAt: row.handoff_finalized_at,
      handoffContactRequestedAt: row.handoff_contact_requested_at,
      metadata: row.metadata,
      scheduling,
      scope,
    },
    messages: messages.rows.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      provider: message.provider,
      providerMessageId: message.provider_message_id,
      messageType: message.message_type,
      createdAt: message.created_at,
      metadata: message.metadata,
    })),
    activities: activities.rows,
  };
}

async function sendSimulatorMessage({ sessionId, text, mode = "MOCK", messageId = null }) {
  ensureQaPanelEnabled();

  const normalizedText = assertText(text);
  const normalizedMode = normalizeMode(mode);

  if (normalizedMode === "LIVE_AI" && !hasLiveAiKey()) {
    const error = new Error("LIVE_AI requiere OPENAI_API_KEY valida");
    error.statusCode = 400;
    throw error;
  }

  const session = await ensureSimulatorSession({ sessionId });
  const result = await whatsappAgentService.processSimulatorInbound({
    sessionId: session.sessionId,
    text: normalizedText,
    messageId: messageId || createId("sim-in"),
    phone: session.lead.phone,
    profileName: SIMULATOR_PROFILE_NAME,
    mode: normalizedMode,
  });
  const conversation = await getSimulatorConversation({
    sessionId: session.sessionId,
  });

  return {
    result,
    conversation,
    mode: normalizedMode,
  };
}

async function resetSimulatorSession({ sessionId }) {
  ensureQaPanelEnabled();

  const safeSessionId = normalizeSessionId(sessionId);
  const phone = getSimulatorPhone(safeSessionId);
  const result = await pool.query(
    `
      DELETE FROM gc_ai_leads
      WHERE phone = $1
        AND source = 'simulator'
      RETURNING id
    `,
    [phone]
  );

  return {
    sessionId: safeSessionId,
    deletedLeads: result.rowCount,
  };
}

module.exports = {
  ensureSimulatorSession,
  getSimulatorConversation,
  sendSimulatorMessage,
  resetSimulatorSession,
  hasLiveAiKey,
};
