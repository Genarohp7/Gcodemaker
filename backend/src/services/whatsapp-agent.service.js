const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const whatsappService = require("./whatsapp.service");

const DEFAULT_REPLY =
  "Hola, soy el asistente de GCodemaker. Puedo ayudarte a entender como una pagina web con IA integrada puede atender clientes, captar prospectos y llevarlos a WhatsApp. Cuentame que tipo de negocio tienes y que te gustaria automatizar.";

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function getChanges(payload) {
  return (payload?.entry || []).flatMap((entry) => entry.changes || []);
}

function getContactName(value, fromPhone) {
  const contact = (value?.contacts || []).find((item) => item.wa_id === fromPhone);
  return contact?.profile?.name || null;
}

function getMessageContent(message) {
  if (message.type === "text") {
    return message.text?.body || "";
  }

  if (message.image?.caption) {
    return message.image.caption;
  }

  if (message.document?.caption) {
    return message.document.caption;
  }

  return `[Mensaje ${message.type || "desconocido"} recibido]`;
}

function extractIncomingMessages(payload) {
  return getChanges(payload).flatMap((change) => {
    const value = change.value || {};
    const phoneNumberId = value.metadata?.phone_number_id || env.whatsappPhoneNumberId || null;

    return (value.messages || []).map((message) => ({
      whatsappMessageId: message.id || null,
      fromPhone: normalizePhone(message.from),
      contactName: getContactName(value, message.from),
      phoneNumberId,
      messageType: message.type || "unknown",
      content: getMessageContent(message),
      rawPayload: {
        metadata: value.metadata || {},
        message,
      },
    }));
  });
}

async function findOrCreateLead({ phone, name }) {
  const result = await pool.query(
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
      VALUES ($1, $2, $3, 'whatsapp_direct', 'whatsapp', 'new', NOW())
      ON CONFLICT (phone) DO UPDATE
      SET
        name = COALESCE(gc_ai_leads.name, EXCLUDED.name),
        last_message_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `,
    [createId("lead"), name || null, phone]
  );

  return result.rows[0];
}

async function findOrCreateConversation({ leadId, phoneNumberId }) {
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
        ai_enabled,
        metadata
      )
      VALUES ($1, $2, 'whatsapp', 'open', TRUE, $3::jsonb)
      RETURNING *
    `,
    [
      createId("conversation"),
      leadId,
      JSON.stringify({
        phoneNumberId,
      }),
    ]
  );

  return result.rows[0];
}

async function saveMessage({
  leadId,
  conversationId,
  role,
  direction,
  content,
  messageType = "text",
  externalMessageId = null,
  rawPayload = {},
}) {
  const result = await pool.query(
    `
      INSERT INTO gc_ai_messages (
        id,
        lead_id,
        conversation_id,
        role,
        direction,
        message_type,
        content,
        external_message_id,
        raw_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING *
    `,
    [
      createId("message"),
      leadId,
      conversationId,
      role,
      direction,
      messageType,
      content,
      externalMessageId,
      JSON.stringify(rawPayload || {}),
    ]
  );

  return result.rows[0];
}

async function sendAutoReply({ toPhone, phoneNumberId, content }) {
  if (!env.whatsappAgentAutoReplyEnabled) {
    return {
      sent: false,
      reason: "auto_reply_disabled",
    };
  }

  if (!env.whatsappAccessToken || !(phoneNumberId || env.whatsappPhoneNumberId)) {
    return {
      sent: false,
      reason: "missing_whatsapp_config",
    };
  }

  try {
    const result = await whatsappService.sendTextMessage({
      recipientPhone: toPhone,
      messageBody: content,
      phoneNumberId: phoneNumberId || env.whatsappPhoneNumberId,
    });

    return {
      ...result,
      sent: Boolean(result.ok),
    };
  } catch (error) {
    return {
      sent: false,
      status: "failed",
      reason: error.message || "whatsapp_send_failed",
    };
  }
}

async function processIncomingMessage(incoming) {
  if (!incoming.fromPhone) {
    return {
      processed: false,
      reason: "missing_sender_phone",
    };
  }

  const lead = await findOrCreateLead({
    phone: incoming.fromPhone,
    name: incoming.contactName,
  });
  const conversation = await findOrCreateConversation({
    leadId: lead.id,
    phoneNumberId: incoming.phoneNumberId,
  });

  await saveMessage({
    leadId: lead.id,
    conversationId: conversation.id,
    role: "lead",
    direction: "incoming",
    content: incoming.content,
    messageType: incoming.messageType,
    externalMessageId: incoming.whatsappMessageId,
    rawPayload: incoming.rawPayload,
  });

  const replyContent = DEFAULT_REPLY;
  const sendResult = await sendAutoReply({
    toPhone: incoming.fromPhone,
    phoneNumberId: incoming.phoneNumberId,
    content: replyContent,
  });

  const outgoingMessage = await saveMessage({
    leadId: lead.id,
    conversationId: conversation.id,
    role: "ai",
    direction: "outgoing",
    content: replyContent,
    messageType: "text",
    externalMessageId: sendResult.whatsappMessageId || null,
    rawPayload: {
      autoReply: sendResult,
    },
  });

  return {
    processed: true,
    leadId: lead.id,
    conversationId: conversation.id,
    outgoingMessageId: outgoingMessage.id,
    autoReply: {
      sent: Boolean(sendResult.sent),
      status: sendResult.status || null,
      reason: sendResult.reason || null,
    },
  };
}

async function processWebhookPayload(payload) {
  const messages = extractIncomingMessages(payload);
  const results = [];

  for (const message of messages) {
    results.push(await processIncomingMessage(message));
  }

  return {
    messagesReceived: messages.length,
    messagesProcessed: results.filter((result) => result.processed).length,
    results,
  };
}

module.exports = {
  extractIncomingMessages,
  processWebhookPayload,
};
