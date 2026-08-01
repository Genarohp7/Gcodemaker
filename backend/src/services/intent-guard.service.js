const SIMPLE_GREETING_MESSAGE =
  "Hola! Gracias por contactar a GCodemaker. Para orientarte mejor, buscas una pagina web, una automatizacion con IA, un sistema a medida o solo quieres conocer nuestros servicios?";

const OFF_TOPIC_MESSAGE =
  "Puedo ayudarte unicamente con informacion relacionada con los servicios de GCodemaker, como paginas web, sistemas a medida o automatizaciones con IA para negocios. Si necesitas alguno de estos servicios, con gusto te oriento.";

const HUMAN_TAKEOVER_MESSAGE =
  "Perfecto, con eso ya tengo una idea mas clara. Voy a pasar tu caso con el ingeniero responsable para que pueda orientarte mejor y darte una propuesta adecuada.";

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
  /costo/i,
  /incluye/i,
  /iva/i,
  /\bcrm\b/i,
  /cotiz/i,
  /presupuesto/i,
  /cu[aá]nto cuesta/i,
  /llamada/i,
  /agendar/i,
  /cita/i,
  /como empezamos/i,
  /empezar/i,
  /iniciar/i,
  /requisitos/i,
  /conviene/i,
  /recomiendas/i,
  /p[aá]gina web/i,
  /landing/i,
  /sistema/i,
  /automatiz/i,
  /asistente/i,
  /chatbot/i,
  /\bia\b/i,
  /whatsapp/i,
  /mensajes/i,
  /atender/i,
  /horario/i,
  /servicios/i,
  /tiempo/i,
  /tarda/i,
  /implementarse/i,
  /quedar.*listo/i,
  /google/i,
  /seo/i,
  /clientes/i,
  /negocio/i,
  /ventas/i,
];

const ENGINEER_DECISION_PATTERNS = [
  /hablar con (genaro|un asesor|una persona|alguien|el ingeniero)/i,
  /quiero (hablar|contactar|contactarme) con (genaro|un asesor|una persona|alguien|el ingeniero)/i,
  /pasame con (genaro|un asesor|una persona|alguien|el ingeniero)/i,
  /p[aÃ¡]same con (genaro|un asesor|una persona|alguien|el ingeniero)/i,
  /que me contacte (genaro|un asesor|una persona|alguien|el ingeniero)/i,
  /descuento/i,
  /rebaja/i,
  /promoci(?:on|\u00f3n) especial/i,
  /excepci(?:on|\u00f3n)/i,
  /autoriza/i,
  /autorizar/i,
  /negociar/i,
  /negociacion/i,
  /negociaci[oÃ³]n/i,
  /negociemos/i,
  /negociable/i,
  /garant(?:ia|\u00eda)/i,
  /garantiza/i,
  /compromiso/i,
  /contrato/i,
  /legal/i,
  /financier/i,
  /cambio de alcance/i,
  /fecha especial/i,
  /pueden asegurar/i,
  /me aseguras/i,
  /no tengo certeza/i,
  /no estoy seguro/i,
];

const USEFUL_CONTEXT_PATTERNS = [
  /tengo/i,
  /tenemos/i,
  /mi negocio/i,
  /clinica/i,
  /consultorio/i,
  /restaurante/i,
  /tienda/i,
  /escuela/i,
  /inmobiliaria/i,
  /servicio/i,
  /pacientes/i,
  /clientes/i,
  /ventas/i,
  /citas/i,
  /reservas/i,
  /horarios/i,
  /catalogo/i,
  /productos/i,
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

  if (matchesAny(lowerText, ENGINEER_DECISION_PATTERNS)) {
    return {
      action: "transfer_to_human",
      shouldReply: true,
      reply: HUMAN_TAKEOVER_MESSAGE,
      leadStatus: "qualified_for_human",
      qualificationReason: "engineer_decision_required",
      serviceInterest: detectServiceInterest(lowerText),
      humanTakeover: true,
      disableAi: true,
      reason: "engineer_decision_required",
    };
  }

  if (matchesAny(lowerText, COMMERCIAL_PATTERNS)) {
    return {
      action: "use_ai_profiling",
      shouldReply: true,
      shouldUseAi: true,
      leadStatus: "ai_profiling",
      serviceInterest: detectServiceInterest(lowerText),
      reason: "commercial_interest_profile_needed",
    };
  }

  if (matchesAny(lowerText, USEFUL_CONTEXT_PATTERNS)) {
    return {
      action: "use_ai_profiling",
      shouldReply: true,
      shouldUseAi: true,
      leadStatus: "ai_profiling",
      serviceInterest: detectServiceInterest(lowerText),
      reason: "useful_business_context",
    };
  }

  return {
    action: "use_ai_profiling",
    shouldReply: true,
    shouldUseAi: true,
    leadStatus: "ai_profiling",
    reason: "needs_more_context",
  };
}

module.exports = {
  decideNextAction,
};
