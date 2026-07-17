const SIMPLE_GREETING_MESSAGE =
  "Hola! Gracias por contactar a GCodemaker. Para orientarte mejor, buscas una pagina web, una automatizacion con IA, un sistema a medida o solo quieres conocer nuestros servicios?";

const OFF_TOPIC_MESSAGE =
  "Puedo ayudarte unicamente con informacion relacionada con los servicios de GCodemaker, como paginas web, sistemas a medida o automatizaciones con IA para negocios. Si necesitas alguno de estos servicios, con gusto te oriento.";

const HUMAN_TAKEOVER_MESSAGE =
  "Perfecto, con eso ya tengo una idea mas clara. Voy a pasar tu caso con Genaro para que pueda orientarte mejor y darte una propuesta adecuada.";

const PROFILING_MESSAGE =
  "Gracias por contarme. Para ubicar mejor tu caso, dime en una frase que negocio tienes y que te gustaria mejorar: atraer clientes, responder dudas, vender mejor o automatizar algun proceso.";

const SIMPLE_GREETING_PATTERNS = [
  /^hola[!. ]*$/i,
  /^buen[oa]s/i,
  /^info/i,
  /^informacion/i,
  /^quiero informacion/i,
  /^vi su anuncio/i,
  /^me interesa/i,
];

const OFF_TOPIC_PATTERNS = [
  /capital de/i,
  /chiste/i,
  /tarea/i,
  /mundial/i,
  /ecuaci[oó]n/i,
  /canci[oó]n/i,
  /receta/i,
  /traduce/i,
  /clima/i,
  /hora es/i,
  /noticias/i,
];

const COMMERCIAL_PATTERNS = [
  /precio/i,
  /cotiz/i,
  /presupuesto/i,
  /cu[aá]nto cuesta/i,
  /llamada/i,
  /agendar/i,
  /cita/i,
  /como empezamos/i,
  /p[aá]gina web/i,
  /landing/i,
  /sistema/i,
  /automatiz/i,
  /chatbot/i,
  /\bia\b/i,
  /whatsapp/i,
  /google/i,
  /seo/i,
  /clientes/i,
  /negocio/i,
  /ventas/i,
];

function normalizeText(text) {
  return String(text || "").trim();
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function detectServiceInterest(text) {
  if (/landing/i.test(text)) {
    return "landing_page";
  }

  if (/automatiz|chatbot|\bia\b|whatsapp/i.test(text)) {
    return "ai_automation";
  }

  if (/sistema|software|app/i.test(text)) {
    return "custom_system";
  }

  if (/google|seo/i.test(text)) {
    return "seo";
  }

  if (/p[aá]gina web|sitio web|web/i.test(text)) {
    return "website";
  }

  return null;
}

function decideNextAction({ message, lead }) {
  const text = normalizeText(message);
  const lowerText = text.toLowerCase();

  if (!text) {
    return {
      action: "ignore",
      shouldReply: false,
      reason: "empty_message",
    };
  }

  if (lead && lead.ai_enabled === false) {
    return {
      action: "human_takeover_active",
      shouldReply: false,
      reason: "ai_disabled_for_lead",
    };
  }

  if (matchesAny(lowerText, SIMPLE_GREETING_PATTERNS)) {
    return {
      action: "fixed_greeting",
      shouldReply: true,
      reply: SIMPLE_GREETING_MESSAGE,
      leadStatus: "greeting_sent",
      reason: "simple_greeting",
    };
  }

  if (matchesAny(lowerText, OFF_TOPIC_PATTERNS)) {
    return {
      action: "off_topic",
      shouldReply: true,
      reply: OFF_TOPIC_MESSAGE,
      leadStatus: "off_topic",
      qualificationReason: "off_topic",
      disableAi: true,
      reason: "off_topic",
    };
  }

  if (matchesAny(lowerText, COMMERCIAL_PATTERNS)) {
    return {
      action: "transfer_to_human",
      shouldReply: true,
      reply: HUMAN_TAKEOVER_MESSAGE,
      leadStatus: "qualified_for_human",
      qualificationReason: "commercial_interest_detected",
      serviceInterest: detectServiceInterest(lowerText),
      humanTakeover: true,
      disableAi: true,
      reason: "commercial_intent",
    };
  }

  return {
    action: "profiling",
    shouldReply: true,
    reply: PROFILING_MESSAGE,
    leadStatus: "ai_profiling",
    reason: "needs_more_context",
  };
}

module.exports = {
  decideNextAction,
};
