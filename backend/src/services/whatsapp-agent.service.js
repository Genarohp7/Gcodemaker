const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const aiAgentService = require("./ai-agent.service");
const demoModeService = require("./demo-mode.service");
const intentGuardService = require("./intent-guard.service");
const whatsappService = require("./whatsapp.service");

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
        message_type,
        content,
        provider,
        provider_message_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING *
    `,
    [
      createId("message"),
      leadId,
      conversationId,
      role,
      messageType,
      content,
      direction === "outgoing" ? "whatsapp_cloud_api" : "whatsapp_webhook",
      externalMessageId,
      JSON.stringify({
        direction,
        rawPayload: rawPayload || {},
      }),
    ]
  );

  return result.rows[0];
}

async function applyDecisionToLead({ leadId, conversationId, decision }) {
  if (!decision.leadStatus && !decision.disableAi && !decision.humanTakeover) {
    return;
  }

  await pool.query(
    `
      UPDATE gc_ai_leads
      SET
        status = COALESCE($2, status),
        service_interest = COALESCE($3, service_interest),
        qualification_reason = COALESCE($4, qualification_reason),
        ai_enabled = CASE WHEN $5 THEN FALSE ELSE ai_enabled END,
        human_takeover = CASE WHEN $6 THEN TRUE ELSE human_takeover END,
        off_topic_count = CASE WHEN $7 = 'off_topic' THEN off_topic_count + 1 ELSE off_topic_count END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      leadId,
      decision.leadStatus || null,
      decision.serviceInterest || null,
      decision.qualificationReason || null,
      Boolean(decision.disableAi),
      Boolean(decision.humanTakeover),
      decision.action,
    ]
  );

  if (decision.humanTakeover) {
    await pool.query(
      `
        UPDATE gc_ai_conversations
        SET
          human_takeover = TRUE,
          status = 'open',
          updated_at = NOW()
        WHERE id = $1
      `,
      [conversationId]
    );
  }
}

async function applyAiResultToLead({ leadId, conversationId, aiResult }) {
  await pool.query(
    `
      UPDATE gc_ai_leads
      SET
        status = COALESCE($2, status),
        service_interest = COALESCE($3, service_interest),
        ai_response_count = ai_response_count + CASE WHEN $4 THEN 0 ELSE 1 END,
        ai_enabled = CASE WHEN $5 THEN FALSE ELSE ai_enabled END,
        human_takeover = CASE WHEN $5 THEN TRUE ELSE human_takeover END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      leadId,
      aiResult.leadStatus || null,
      aiResult.serviceInterest || null,
      Boolean(aiResult.skipped),
      Boolean(aiResult.shouldTransferToHuman),
    ]
  );

  if (aiResult.shouldTransferToHuman) {
    await pool.query(
      `
        UPDATE gc_ai_conversations
        SET
          human_takeover = TRUE,
          status = 'open',
          updated_at = NOW()
        WHERE id = $1
      `,
      [conversationId]
    );
  }
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

  if (demoModeService.isDemoCommand(incoming.content)) {
    const commandResult = await demoModeService.handleAdminCommand({
      fromPhone: incoming.fromPhone,
      message: incoming.content,
    });
    const sendResult = await sendAutoReply({
      toPhone: incoming.fromPhone,
      phoneNumberId: incoming.phoneNumberId,
      content: commandResult.reply,
    });

    return {
      processed: true,
      command: true,
      authorized: Boolean(commandResult.authorized),
      autoReply: {
        sent: Boolean(sendResult.sent),
        status: sendResult.status || null,
        reason: sendResult.reason || null,
      },
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

  if (conversation.demo_mode) {
    if (demoModeService.isDemoExpired(conversation)) {
      await demoModeService.finishDemo({
        leadId: lead.id,
        reason: "expired",
      });

      const replyContent =
        "La demo ya expiro. Si quieres continuar, Genaro puede volver a activarla o darle seguimiento a tu caso.";
      const sendResult = await sendAutoReply({
        toPhone: incoming.fromPhone,
        phoneNumberId: incoming.phoneNumberId,
        content: replyContent,
      });

      await saveMessage({
        leadId: lead.id,
        conversationId: conversation.id,
        role: "ai",
        direction: "outgoing",
        content: replyContent,
        messageType: "text",
        externalMessageId: sendResult.whatsappMessageId || null,
        rawPayload: {
          autoReply: sendResult,
          demo: {
            finished: true,
            reason: "expired",
          },
        },
      });

      return {
        processed: true,
        leadId: lead.id,
        conversationId: conversation.id,
        demo: {
          active: false,
          reason: "expired",
        },
      };
    }

    if (conversation.demo_remaining_questions <= 0) {
      await demoModeService.finishDemo({
        leadId: lead.id,
        reason: "question_limit_reached",
      });

      const replyContent =
        "La demo llego al limite de preguntas. Voy a dejar tu caso listo para seguimiento con Genaro.";
      const sendResult = await sendAutoReply({
        toPhone: incoming.fromPhone,
        phoneNumberId: incoming.phoneNumberId,
        content: replyContent,
      });

      await saveMessage({
        leadId: lead.id,
        conversationId: conversation.id,
        role: "ai",
        direction: "outgoing",
        content: replyContent,
        messageType: "text",
        externalMessageId: sendResult.whatsappMessageId || null,
        rawPayload: {
          autoReply: sendResult,
          demo: {
            finished: true,
            reason: "question_limit_reached",
          },
        },
      });

      return {
        processed: true,
        leadId: lead.id,
        conversationId: conversation.id,
        demo: {
          active: false,
          reason: "question_limit_reached",
        },
      };
    }
  }

  let decision = intentGuardService.decideNextAction({
    message: incoming.content,
    lead,
  });

  if (conversation.demo_mode && decision.action === "transfer_to_human") {
    decision = {
      action: "use_ai_profiling",
      shouldReply: true,
      shouldUseAi: true,
      leadStatus: "demo_active",
      serviceInterest: decision.serviceInterest || null,
      reason: "demo_commercial_question",
    };
  }

  await applyDecisionToLead({
    leadId: lead.id,
    conversationId: conversation.id,
    decision,
  });

  if (!decision.shouldReply) {
    return {
      processed: true,
      leadId: lead.id,
      conversationId: conversation.id,
      decision: {
        action: decision.action,
        reason: decision.reason,
      },
      autoReply: {
        sent: false,
        reason: decision.reason,
      },
    };
  }

  let replyContent = decision.reply;
  let aiResult = null;

  if (decision.shouldUseAi) {
    try {
      aiResult = await aiAgentService.generateProfilingResponse({
        lead,
        conversation,
        incomingMessage: incoming.content,
        reason: decision.reason,
      });
      replyContent = aiResult.reply;

      await applyAiResultToLead({
        leadId: lead.id,
        conversationId: conversation.id,
        aiResult,
      });
    } catch (error) {
      replyContent =
        "Gracias por contarme. En este momento voy a pasar tu caso con Genaro para que pueda orientarte mejor sin perder el contexto.";
      aiResult = {
        skipped: true,
        skipReason: error.message || "ai_generation_failed",
        shouldTransferToHuman: true,
        leadStatus: "qualified_for_human",
      };

      await applyAiResultToLead({
        leadId: lead.id,
        conversationId: conversation.id,
        aiResult,
      });
    }
  }

  if (conversation.demo_mode && decision.shouldReply) {
    await demoModeService.consumeDemoQuestion({
      conversationId: conversation.id,
    });
  }

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
      decision,
      aiResult,
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
    decision: {
      action: decision.action,
      reason: decision.reason,
      leadStatus: aiResult?.leadStatus || decision.leadStatus || null,
      humanTakeover: Boolean(aiResult?.shouldTransferToHuman || decision.humanTakeover),
      usedAi: Boolean(aiResult && !aiResult.skipped),
    },
    demo: conversation.demo_mode
      ? {
          active: true,
        }
      : null,
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
