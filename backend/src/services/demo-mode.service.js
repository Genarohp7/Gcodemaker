const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function getAdminPhones() {
  return String(env.adminWhatsAppNumbers || "")
    .split(",")
    .map(normalizePhone)
    .filter(Boolean);
}

function isAdminPhone(phone) {
  const normalizedPhone = normalizePhone(phone);

  return Boolean(normalizedPhone) && getAdminPhones().includes(normalizedPhone);
}

function isDemoCommand(message) {
  return /^\/demo\b/i.test(String(message || "").trim());
}

function parseDemoCommand(message) {
  const parts = String(message || "").trim().split(/\s+/);

  return {
    raw: message,
    action: (parts[1] || "").toLowerCase(),
    targetPhone: normalizePhone(parts[2] || ""),
  };
}

async function logActivity({ action, entityType, entityId, metadata }) {
  await pool.query(
    `
      INSERT INTO gc_ai_activity_logs (
        id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [
      createId("activity"),
      action,
      entityType,
      entityId || null,
      JSON.stringify(metadata || {}),
    ]
  );
}

async function findOrCreateManualLead(phone) {
  const result = await pool.query(
    `
      INSERT INTO gc_ai_leads (
        id,
        phone,
        source,
        channel,
        status,
        last_message_at
      )
      VALUES ($1, $2, 'manual_demo', 'whatsapp', 'demo_active', NOW())
      ON CONFLICT (phone) DO UPDATE
      SET
        status = 'demo_active',
        source = CASE
          WHEN gc_ai_leads.source = 'unknown' THEN 'manual_demo'
          ELSE gc_ai_leads.source
        END,
        ai_enabled = TRUE,
        human_takeover = FALSE,
        updated_at = NOW()
      RETURNING *
    `,
    [createId("lead"), phone]
  );

  return result.rows[0];
}

async function getOrCreateConversationForDemo(leadId) {
  const existing = await pool.query(
    `
      SELECT *
      FROM gc_ai_conversations
      WHERE lead_id = $1
        AND channel = 'whatsapp'
        AND status = 'open'
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [leadId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const result = await pool.query(
    `
      INSERT INTO gc_ai_conversations (
        id,
        lead_id,
        channel,
        status,
        previous_status
      )
      VALUES ($1, $2, 'whatsapp', 'open', 'new')
      RETURNING *
    `,
    [createId("conversation"), leadId]
  );

  return result.rows[0];
}

async function activateDemo({ targetPhone, adminPhone }) {
  const lead = await findOrCreateManualLead(targetPhone);
  const conversation = await getOrCreateConversationForDemo(lead.id);

  const result = await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        demo_mode = TRUE,
        demo_remaining_questions = $2,
        demo_expires_at = NOW() + ($3::text || ' minutes')::interval,
        previous_status = COALESCE(previous_status, $4),
        human_takeover = FALSE,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      conversation.id,
      env.aiMaxDemoQuestions,
      env.aiDemoExpirationMinutes,
      lead.status || "new",
    ]
  );

  await logActivity({
    action: "demo_activated_from_whatsapp",
    entityType: "lead",
    entityId: lead.id,
    metadata: {
      adminPhone,
      targetPhone,
      conversationId: conversation.id,
    },
  });

  return {
    lead,
    conversation: result.rows[0],
    reply: `Demo activada para ${targetPhone}. Tiene ${env.aiMaxDemoQuestions} preguntas y expira en ${env.aiDemoExpirationMinutes} minutos.`,
  };
}

async function finishDemo({ leadId, reason }) {
  await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        demo_mode = FALSE,
        demo_remaining_questions = 0,
        demo_expires_at = NULL,
        updated_at = NOW()
      WHERE lead_id = $1
        AND demo_mode = TRUE
    `,
    [leadId]
  );

  await pool.query(
    `
      UPDATE gc_ai_leads
      SET
        status = 'demo_finished',
        ai_enabled = FALSE,
        updated_at = NOW()
      WHERE id = $1
    `,
    [leadId]
  );

  await logActivity({
    action: "demo_finished",
    entityType: "lead",
    entityId: leadId,
    metadata: {
      reason,
    },
  });
}

async function deactivateDemo({ targetPhone, adminPhone, reason = "manual" }) {
  const leadResult = await pool.query(
    `
      SELECT *
      FROM gc_ai_leads
      WHERE phone = $1
      LIMIT 1
    `,
    [targetPhone]
  );
  const lead = leadResult.rows[0];

  if (!lead) {
    return {
      reply: `No encontre un lead con el numero ${targetPhone}.`,
    };
  }

  await finishDemo({
    leadId: lead.id,
    reason,
  });

  await logActivity({
    action: "demo_deactivated_from_whatsapp",
    entityType: "lead",
    entityId: lead.id,
    metadata: {
      adminPhone,
      targetPhone,
      reason,
    },
  });

  return {
    lead,
    reply: `Demo desactivada para ${targetPhone}.`,
  };
}

async function getDemoStatus(targetPhone) {
  const result = await pool.query(
    `
      SELECT
        leads.phone,
        leads.status,
        conversations.demo_mode,
        conversations.demo_remaining_questions,
        conversations.demo_expires_at
      FROM gc_ai_leads leads
      LEFT JOIN gc_ai_conversations conversations
        ON conversations.lead_id = leads.id
       AND conversations.channel = 'whatsapp'
       AND conversations.status = 'open'
      WHERE leads.phone = $1
      ORDER BY conversations.updated_at DESC NULLS LAST
      LIMIT 1
    `,
    [targetPhone]
  );
  const row = result.rows[0];

  if (!row) {
    return {
      reply: `No encontre un lead con el numero ${targetPhone}.`,
    };
  }

  if (!row.demo_mode) {
    return {
      reply: `El numero ${targetPhone} no tiene demo activa. Estado actual: ${row.status}.`,
    };
  }

  return {
    reply: `Demo activa para ${targetPhone}. Preguntas restantes: ${row.demo_remaining_questions}. Expira: ${row.demo_expires_at}.`,
  };
}

async function handleAdminCommand({ fromPhone, message }) {
  if (!isDemoCommand(message)) {
    return null;
  }

  if (!isAdminPhone(fromPhone)) {
    return {
      handled: true,
      authorized: false,
      reply: "No tienes autorizacion para usar comandos de demo.",
    };
  }

  const command = parseDemoCommand(message);

  if (!["on", "off", "status"].includes(command.action) || !command.targetPhone) {
    return {
      handled: true,
      authorized: true,
      reply: "Comando no valido. Usa /demo on 52155XXXXXXXX, /demo off 52155XXXXXXXX o /demo status 52155XXXXXXXX.",
    };
  }

  if (command.action === "on") {
    const result = await activateDemo({
      targetPhone: command.targetPhone,
      adminPhone: normalizePhone(fromPhone),
    });

    return {
      handled: true,
      authorized: true,
      ...result,
    };
  }

  if (command.action === "off") {
    const result = await deactivateDemo({
      targetPhone: command.targetPhone,
      adminPhone: normalizePhone(fromPhone),
    });

    return {
      handled: true,
      authorized: true,
      ...result,
    };
  }

  const result = await getDemoStatus(command.targetPhone);

  return {
    handled: true,
    authorized: true,
    ...result,
  };
}

function isDemoExpired(conversation) {
  if (!conversation?.demo_expires_at) {
    return false;
  }

  return new Date(conversation.demo_expires_at).getTime() <= Date.now();
}

async function consumeDemoQuestion({ conversationId }) {
  const result = await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        demo_remaining_questions = GREATEST(demo_remaining_questions - 1, 0),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [conversationId]
  );

  const conversation = result.rows[0];

  if (conversation && conversation.demo_remaining_questions <= 0) {
    await finishDemo({
      leadId: conversation.lead_id,
      reason: "question_limit_reached",
    });
  }

  return conversation;
}

module.exports = {
  handleAdminCommand,
  isDemoCommand,
  isDemoExpired,
  consumeDemoQuestion,
  finishDemo,
};
