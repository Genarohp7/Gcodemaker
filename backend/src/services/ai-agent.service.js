const OpenAI = require("openai");

const env = require("../config/env");
const { pool } = require("../db");

const GCODMAKER_WHATSAPP_AGENT_PROMPT = `
Eres el asistente comercial de GCodemaker para WhatsApp.

GCodemaker ofrece paginas web profesionales, landing pages, sistemas web a medida,
automatizaciones con IA, chatbots para WhatsApp/Instagram/Facebook e integraciones
digitales para negocios.

Tu trabajo:
- perfilar brevemente al prospecto;
- responder solo dudas relacionadas con servicios digitales de GCodemaker;
- no actuar como ChatGPT general;
- no dar precios cerrados ni prometer tiempos exactos;
- no hacer mas de una pregunta principal por respuesta;
- transferir a Genaro cuando ya hay interes comercial suficiente.

Responde siempre en JSON valido con esta forma:
{
  "reply": "respuesta breve para WhatsApp",
  "shouldTransferToHuman": false,
  "leadStatus": "ai_profiling",
  "serviceInterest": null,
  "summary": "resumen corto del lead",
  "nextSuggestedAction": "siguiente accion breve"
}

Estados validos: ai_profiling, partially_profiled, qualified_for_human, off_topic.
Si el usuario sale de tema, responde que solo puedes ayudar con soluciones digitales
para negocios, marca leadStatus off_topic y shouldTransferToHuman false.
Si detectas interes suficiente, marca shouldTransferToHuman true y leadStatus
qualified_for_human.
`;

let openaiClient = null;

function getOpenAiClient() {
  if (!env.openAiApiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.openAiApiKey,
    });
  }

  return openaiClient;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const jsonMatch = String(text || "").match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw error;
    }

    return JSON.parse(jsonMatch[0]);
  }
}

function normalizeAiResult(parsed, fallbackMessage) {
  const reply = String(parsed.reply || fallbackMessage || "").trim();

  return {
    reply:
      reply ||
      "Gracias por contarme. Con eso ya puedo orientar mejor tu caso y pasarlo con Genaro para revisar la mejor solucion.",
    shouldTransferToHuman: Boolean(parsed.shouldTransferToHuman),
    leadStatus: parsed.leadStatus || "ai_profiling",
    serviceInterest: parsed.serviceInterest || null,
    summary: parsed.summary || null,
    nextSuggestedAction: parsed.nextSuggestedAction || null,
  };
}

function getUsage(response) {
  const usage = response.usage || {};

  return {
    tokensInput: usage.input_tokens || usage.prompt_tokens || 0,
    tokensOutput: usage.output_tokens || usage.completion_tokens || 0,
  };
}

async function getRecentConversationMessages({ conversationId, limit = 6 }) {
  const result = await pool.query(
    `
      SELECT role, content, created_at
      FROM gc_ai_messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [conversationId, limit]
  );

  return result.rows.reverse();
}

async function upsertLeadProfile({ leadId, summary, serviceInterest, nextSuggestedAction }) {
  if (!summary && !serviceInterest && !nextSuggestedAction) {
    return null;
  }

  const result = await pool.query(
    `
      INSERT INTO gc_ai_lead_profiles (
        id,
        lead_id,
        project_need,
        summary,
        next_suggested_action
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (lead_id) DO UPDATE
      SET
        project_need = COALESCE(EXCLUDED.project_need, gc_ai_lead_profiles.project_need),
        summary = COALESCE(EXCLUDED.summary, gc_ai_lead_profiles.summary),
        next_suggested_action = COALESCE(EXCLUDED.next_suggested_action, gc_ai_lead_profiles.next_suggested_action),
        updated_at = NOW()
      RETURNING *
    `,
    [
      `profile-${cryptoRandomId()}`,
      leadId,
      serviceInterest || null,
      summary || null,
      nextSuggestedAction || null,
    ]
  );

  return result.rows[0];
}

function cryptoRandomId() {
  return require("crypto").randomUUID();
}

async function logAiUsage({
  leadId,
  conversationId,
  mode,
  model,
  tokensInput,
  tokensOutput,
  reason,
}) {
  await pool.query(
    `
      INSERT INTO gc_ai_usage_logs (
        id,
        lead_id,
        conversation_id,
        mode,
        model,
        tokens_input,
        tokens_output,
        reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      `usage-${cryptoRandomId()}`,
      leadId,
      conversationId,
      mode,
      model,
      tokensInput,
      tokensOutput,
      reason || null,
    ]
  );
}

async function generateProfilingResponse({ lead, conversation, incomingMessage, reason }) {
  if (lead.ai_response_count >= env.aiMaxResponsesPerLead) {
    return {
      reply:
        "Ya tengo suficiente contexto para que Genaro pueda orientarte mejor. Voy a pasarle tu caso para que revise la mejor solucion contigo.",
      shouldTransferToHuman: true,
      leadStatus: "qualified_for_human",
      serviceInterest: lead.service_interest || null,
      summary: null,
      nextSuggestedAction: "Seguimiento humano",
      tokensInput: 0,
      tokensOutput: 0,
      model: env.openAiModel,
      skipped: true,
      skipReason: "max_ai_responses_reached",
    };
  }

  const recentMessages = await getRecentConversationMessages({
    conversationId: conversation.id,
  });

  const response = await getOpenAiClient().responses.create({
    model: env.openAiModel,
    max_output_tokens: 300,
    input: [
      {
        role: "system",
        content: GCODMAKER_WHATSAPP_AGENT_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify({
          lead: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            status: lead.status,
            serviceInterest: lead.service_interest,
            aiResponseCount: lead.ai_response_count,
          },
          recentMessages,
          incomingMessage,
        }),
      },
    ],
  });

  const usage = getUsage(response);
  const parsed = safeJsonParse(response.output_text);
  const result = normalizeAiResult(parsed, response.output_text);

  await logAiUsage({
    leadId: lead.id,
    conversationId: conversation.id,
    mode: "profiling",
    model: env.openAiModel,
    tokensInput: usage.tokensInput,
    tokensOutput: usage.tokensOutput,
    reason,
  });

  await upsertLeadProfile({
    leadId: lead.id,
    summary: result.summary,
    serviceInterest: result.serviceInterest,
    nextSuggestedAction: result.nextSuggestedAction,
  });

  return {
    ...result,
    ...usage,
    model: env.openAiModel,
    skipped: false,
  };
}

module.exports = {
  generateProfilingResponse,
};
