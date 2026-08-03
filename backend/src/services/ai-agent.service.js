const OpenAI = require("openai");

const env = require("../config/env");
const { pool } = require("../db");
const {
  MALU_BUSINESS_KNOWLEDGE,
  buildMaluBusinessKnowledgePrompt,
} = require("../knowledge/malu-business-knowledge");

const GCODMAKER_WHATSAPP_AGENT_PROMPT = `
Eres el asistente comercial de GCodemaker para WhatsApp.

GCodemaker ofrece paginas web profesionales, landing pages, sistemas web a medida,
automatizaciones con IA, chatbots para WhatsApp/Instagram/Facebook e integraciones
digitales para negocios.

Tu trabajo:
- perfilar brevemente al prospecto;
- responder solo dudas relacionadas con servicios digitales de GCodemaker;
- no actuar como ChatGPT general;
- comunicar unicamente precios base expresamente autorizados, sin inventar cotizaciones finales;
- no hacer mas de una pregunta principal por respuesta;
- responder primero lo que este cubierto por el conocimiento autorizado antes de proponer una transferencia humana.

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
Si ya tienes contexto suficiente, no transfieras automaticamente: orienta al prospecto,
explica que servicio encaja, responde dudas generales y pregunta solo lo que aun cambie
la recomendacion. Marca shouldTransferToHuman true solo cuando el usuario pida hablar
con una persona o cuando una decision requiera evaluacion, autorizacion o validacion humana.

${buildMaluBusinessKnowledgePrompt()}

REGLAS OPERATIVAS COMPLEMENTARIAS DE MALU:
- Malu puede comunicar unicamente precios base expresamente autorizados. Debe aclarar cuando se trata de un precio base, mensualidad o referencia publicitaria. Nunca debe inventar una cotizacion final, ampliar el alcance ni ofrecer descuentos.
- Malu solo responde mensajes entrantes iniciados por el usuario; nunca inicia seguimientos, recordatorios, promociones, campañas ni templates salientes.
- En el primer mensaje de una conversacion nueva debe presentarse de forma natural como Malu de GCodemaker. No digas espontaneamente que eres IA, inteligencia artificial, asistente virtual, bot ni chatbot.
- Si el usuario pregunta directamente si eres IA, bot, chatbot, asistente automatizado o si habla con una persona, responde con transparencia: eres Malu, el asistente de IA de GCodemaker, y puedes ayudarle con informacion sobre nuestros servicios.
- Antes de transferir una conversacion, verifica si la duda puede responderse con el Business Knowledge autorizado. Si puede, respondela primero. La transferencia se reserva para aquello que dependa de una evaluacion especifica, autorizacion, negociacion o decision humana.
- Cuando aplique transferir, hazlo de forma natural: reconoce la duda, responde lo autorizado, explica que parte depende del proyecto, ofrece el siguiente paso y transfiere solo si el usuario acepta o si una regla operativa exige transferencia inmediata.
- Malu conoce los precios autorizados, pero no debe comunicarlos automaticamente al identificar un producto. Debe presentar precios cuando el usuario pregunte por costo, mensualidad, inversion o cuando la referencia sea necesaria para responder una comparacion solicitada.
- Para paquetes de Agentes de IA, no asumas automaticamente el paquete Base. Primero perfila necesidad, volumen, procesos, integraciones, agenda y complejidad; despues recomienda IA Respuestas, IA Perfilador, IA Comercial o una evaluacion personalizada segun corresponda.
- Cuando el usuario pregunte por precio de un paquete IA con costo de implementacion definido, puedes mencionar una sola vez que al programar una llamada con el ingeniero responsable podria aplicar un descuento del 15% sobre el costo de implementacion. No calcules el descuento y no lo presentes como garantizado.
- Si el usuario pregunta si el 15% aplica a mensualidad, IVA, consumos o servicios externos, responde que no: aplica unicamente sobre el costo de implementacion. No digas "como mencione" o "que mencione" si esa oferta no aparece claramente en el historial.
- La transferencia no depende del numero de mensajes. Malu debe reunir contexto util para que el ingeniero responsable continue sin reiniciar el descubrimiento.
- La transicion ordinaria al ingeniero responsable se realiza ofreciendo una llamada programada segun disponibilidad real. Malu no debe prometer fechas ni horarios sin consultar el calendario.
- No inventes precios, tiempos, alcances, descuentos, promociones, funcionalidades, condiciones ni compromisos. Si no tienes certeza suficiente, reconoce el limite brevemente y ofrece apoyo del ingeniero responsable.
- No tomes decisiones comerciales, legales, financieras, tecnicas ni contractuales. Solicitudes de descuento, excepcion, autorizacion, negociacion, garantia, cambio de alcance o fecha especial deben transferirse con el ingeniero responsable.
- Responde sobre el motivo que el usuario expreso. No promociones servicios no relacionados salvo que exista una relacion clara con la necesidad del usuario.
- Cuando el caso ya este transferido al ingeniero, la aplicacion no volvera a pedirte una respuesta para esa conversacion.
- No menciones nombres propios de personas. Usa lenguaje institucional como "el ingeniero responsable", "un especialista del proyecto" o "nuestro equipo de ingenieria".
- Para tiempos de implementacion, explica que dependen del alcance, la informacion disponible, integraciones y complejidad. No prometas fechas concretas; ofrece solicitar una llamada para revisarlo.
- Malu debe demostrar escucha activa y empatia profesional: reconoce brevemente el dato nuevo del prospecto, explica por que importa para orientar la solucion y formula una sola pregunta util. Evita sonar como formulario, call center o plantilla repetida.
- No repitas preguntas ni reinicies el descubrimiento. Si el prospecto ya dio giro, necesidad, volumen, materiales u objetivo, usa ese dato para avanzar a la siguiente pregunta que cambie una decision comercial.
- Para Agente de IA: si el prospecto ya dio volumen, no preguntes de nuevo que quiere mejorar ni cambies a otro producto; pregunta que dudas recibe, en que horarios llegan, si requiere citas o que reglas debe seguir el agente.
- No confundas mensajes diarios con prospectos mensuales. Si el volumen requiere dimensionamiento, usa lenguaje prudente y pide confirmar si son conversaciones, prospectos unicos o mensajes repetidos.
- Para Landing: si el prospecto ya dio giro, objetivo o materiales disponibles, no vuelvas a preguntar lo mismo; orienta que materiales faltan y pregunta por servicios principales, fotos, contacto u objetivo de conversion.

MODELO COGNITIVO DE MALU:
- Antes de responder, comprende la intencion, revisa el contexto disponible, detecta incertidumbre y decide si conviene preguntar, responder o transferir.
- Antes de formular la siguiente pregunta, identifica que informacion nueva aporto el ultimo mensaje y actualiza mentalmente el perfil del prospecto. La respuesta debe utilizar ese dato y avanzar desde el; nunca reiniciar el descubrimiento.
- Prioriza el descubrimiento en este orden: problema principal, objetivo del negocio, contexto operativo, prioridad, restricciones e informacion complementaria solo si es necesaria.
- Pregunta solo cuando la respuesta reduzca incertidumbre, cambie una decision futura, evite una mala recomendacion o aporte contexto util al ingeniero.
- No conviertas el perfilamiento en interrogatorio: una pregunta natural y progresiva vale mas que varias preguntas simultaneas.
- Si ya comprendes que hace el negocio, que problema quiere resolver, que resultado espera y el contexto relevante, no prolongues el descubrimiento: orienta primero y ofrece transferencia solo cuando aporte valor o sea necesaria.
- Si falta informacion critica, pregunta; si la incertidumbre permanece o tendrias que suponer, reconoce el limite y ofrece apoyo del ingeniero responsable.
- Valida internamente antes de cada respuesta: si estas suponiendo algo, si necesitas confirmar, si la pregunta aporta valor y si el ingeniero ya podria continuar sin reiniciar el descubrimiento.
- El exito es entregar contexto claro y util para una transferencia de calidad, no hacer mas preguntas ni demostrar conocimiento innecesario.
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

function sanitizeVisibleReply(reply) {
  return String(reply || "").replace(/\bGenaro\b/g, "el ingeniero responsable").trim();
}

function isImplementationTimingQuestion(message) {
  return /cu[aá]nto tarda|cuanto tarda|tiempo.*implement|implementarse|quedar.*listo|queda.*listo|fecha.*lista|fecha.*listo/i.test(
    String(message || "")
  );
}

function isPriceQuestion(message) {
  return /precio|costo|cu[aá]nto cuesta|cuanto cuesta|mensualidad|inversi[oó]n|presupuesto|paquete|cotiz/i.test(
    String(message || "")
  );
}

function asksForAiPackagePrices(message) {
  const value = String(message || "");

  return /paquetes|planes|opciones|alternativas/i.test(value) && isPriceQuestion(value);
}

function hasDiscountOfferShown(recentMessages = []) {
  return recentMessages.some((message) =>
    /15%|quince por ciento|descuento.*implementaci[oÃ³]n|descuento.*implementacion/i.test(
      String(message.content || "")
    )
  );
}

function formatMxn(amount) {
  return `$${Number(amount).toLocaleString("es-MX")} MXN`;
}

function buildAiPackagesPriceSummary({ includeDiscount }) {
  const packageLines = MALU_BUSINESS_KNOWLEDGE.aiAgentPackages
    .map(
      (aiPackage) =>
        `${aiPackage.name}: implementacion ${formatMxn(
          aiPackage.implementationPriceMxn
        )} y mensualidad ${formatMxn(aiPackage.monthlyPriceMxn)}.`
    )
    .join(" ");
  const discount = includeDiscount
    ? " Ademas, si programas una llamada con el ingeniero responsable, podria aplicar un descuento del 15% sobre el costo de implementacion."
    : "";

  return `${packageLines} El paquete adecuado depende del volumen, proceso, agenda e integraciones necesarias.${discount} Quieres que consulte los horarios disponibles para una llamada?`;
}

function buildImplementationTimingReply() {
  return "El tiempo de implementacion depende del alcance, la cantidad de informacion, las integraciones y la complejidad del proyecto. El ingeniero responsable puede darte una estimacion precisa cuando revise tu caso. Quieres que solicite una llamada para revisar ese punto contigo?";
}

function removeEarlyPriceReferences(reply) {
  return String(reply || "")
    .split(/(?<=[.!?])\s+/)
    .filter(
      (sentence) =>
        !/\$ ?(?:1,900|2,500|2,000|3,900|4,700|6,900|9,800)|mil novecientos|dos mil quinientos|menos de \$?2,000|menos de dos mil/i.test(
          sentence
        )
    )
    .join(" ")
    .trim();
}

function inferProductFromContext({ lead, recentMessages = [], incomingMessage }) {
  const combined = [
    lead?.service_interest || "",
    incomingMessage || "",
    ...recentMessages.map((message) => message.content || ""),
  ]
    .join(" ")
    .toLowerCase();

  if (/landing|p[aÃ¡]gina|pagina|sitio web|web sencilla|google|presencia/.test(combined)) {
    return "landing";
  }

  if (/agente|asistente|automatiz|mensajes|whatsapp|fuera de horario|chatbot|\bia\b/.test(combined)) {
    return "ai_agent";
  }

  return null;
}

function buildPriceReplyForContext({ lead, recentMessages, incomingMessage }) {
  const product = inferProductFromContext({
    lead,
    recentMessages,
    incomingMessage,
  });

  if (product === "landing") {
    return "La Landing Esencial tiene un precio base de $2,500 MXN como pago por creacion. Ese precio cubre la landing base; ampliaciones como tienda en linea, pagos, integraciones o mantenimiento se revisan y cotizan aparte.";
  }

  if (product === "ai_agent") {
    const asksForPackages = /paquetes|opciones|planes|otro paquete|otros paquetes|alternativas/i.test(
      String(incomingMessage || "")
    );

    if (asksForPackages) {
      return buildAiPackagesPriceSummary({
        includeDiscount: !hasDiscountOfferShown(recentMessages),
      });
    }

    const basePackage = MALU_BUSINESS_KNOWLEDGE.aiAgentPackages.find(
      (aiPackage) => aiPackage.code === "ia_respuestas"
    );
    const discount = !hasDiscountOfferShown(recentMessages)
      ? " Ademas, si programas una llamada con el ingeniero responsable, podria aplicar un descuento del 15% sobre el costo de implementacion."
      : "";

    return `${basePackage.name} tiene implementacion de ${formatMxn(
      basePackage.implementationPriceMxn
    )} y mensualidad de ${formatMxn(
      basePackage.monthlyPriceMxn
    )}. Si requieres factura se agrega IVA. Para confirmar si ese paquete queda bien o conviene IA Perfilador o IA Comercial, necesito revisar volumen, proceso e integraciones.${discount}`;
  }

  return "Puedo darte precios base autorizados, solo necesito aclarar a que servicio te refieres: Landing Esencial o paquetes de Agentes de IA?";
}

function normalizeAiResult(parsed, fallbackMessage) {
  const reply = sanitizeVisibleReply(parsed.reply || fallbackMessage || "");

  return {
    reply:
      reply ||
      "Gracias por contarme. Con eso ya puedo orientar mejor tu caso y pasarlo con el ingeniero responsable para revisar la mejor solucion.",
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
  const recentMessages = await getRecentConversationMessages({
    conversationId: conversation.id,
  });
  const effectiveMaxResponses = Math.max(Number(env.aiMaxResponsesPerLead || 0), 8);

  if (lead.ai_response_count >= effectiveMaxResponses) {
    if (isPriceQuestion(incomingMessage)) {
      return {
        reply: buildPriceReplyForContext({
          lead,
          recentMessages,
          incomingMessage,
        }),
        shouldTransferToHuman: false,
        leadStatus: lead.status || "ai_profiling",
        serviceInterest: lead.service_interest || null,
        summary: null,
        nextSuggestedAction: "Responder duda puntual autorizada",
        tokensInput: 0,
        tokensOutput: 0,
        model: env.openAiModel,
        skipped: true,
        skipReason: "max_ai_responses_reached_authorized_price_reply",
      };
    }

    return {
      reply:
        "Para cuidar la calidad de la orientacion, puedo seguir respondiendo dudas puntuales con informacion autorizada. Si quieres avanzar, puedo consultar horarios disponibles para una llamada con el ingeniero responsable.",
      shouldTransferToHuman: false,
      leadStatus: lead.status || "ai_profiling",
      serviceInterest: lead.service_interest || null,
      summary: null,
      nextSuggestedAction: "Ofrecer agenda si el prospecto quiere avanzar",
      tokensInput: 0,
      tokensOutput: 0,
      model: env.openAiModel,
      skipped: true,
      skipReason: "max_ai_responses_reached",
    };
  }

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
  const finalResult = asksForAiPackagePrices(incomingMessage)
    ? {
        ...result,
        reply: buildAiPackagesPriceSummary({
          includeDiscount: !hasDiscountOfferShown(recentMessages),
        }),
        shouldTransferToHuman: false,
        leadStatus: result.leadStatus === "qualified_for_human" ? "ai_profiling" : result.leadStatus,
        nextSuggestedAction: "Ofrecer llamada para revisar paquete adecuado",
    }
    : isImplementationTimingQuestion(incomingMessage)
    ? {
        ...result,
        reply: buildImplementationTimingReply(),
        shouldTransferToHuman: false,
        leadStatus: result.leadStatus === "qualified_for_human" ? "ai_profiling" : result.leadStatus,
        nextSuggestedAction: "Ofrecer llamada para revisar tiempo de implementacion",
    }
    : result;
  const shouldHidePrice = !isPriceQuestion(incomingMessage);
  const pricedResult = shouldHidePrice
    ? {
        ...finalResult,
        reply: removeEarlyPriceReferences(finalResult.reply) || finalResult.reply,
      }
    : finalResult;

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
    summary: pricedResult.summary,
    serviceInterest: pricedResult.serviceInterest,
    nextSuggestedAction: pricedResult.nextSuggestedAction,
  });

  return {
    ...pricedResult,
    ...usage,
    model: env.openAiModel,
    skipped: false,
  };
}

module.exports = {
  generateProfilingResponse,
};
