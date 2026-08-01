const OFF_TOPIC_RECONDUCTION =
  "Esa consulta queda fuera de lo que puedo ayudarte a resolver. Mi funcion es orientarte sobre soluciones digitales que podamos desarrollar para tu negocio, como paginas web, agentes de IA y automatizaciones. Hay algo de eso en lo que pueda ayudarte?";

const TECHNOLOGY_RECONDUCTION =
  "Mas que resolver una consulta tecnologica general, puedo ayudarte a revisar que necesita tu proyecto y que solucion de GCodemaker podria ajustarse. Estas buscando crear una pagina, automatizar mensajes o mejorar un proceso de tu negocio?";

const BLOCKED_STATUS = "NON_COMMERCIAL_BLOCKED";
const ACTIVE_STATUS = "COMMERCIAL_ACTIVE";

function normalizeText(message) {
  return String(message || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasCommercialSignal(message) {
  const text = normalizeText(message);

  return matchesAny(text, [
    /(?:necesito|quiero|busco|me interesa|informacion|cotizar|precio|cuanto cuesta|mensualidad|agendar|llamada).*(?:pagina|web|landing|sitio|agente|\bia\b|chatbot|whatsapp|automatiz|mensajes|negocio|restaurante|clinica|tienda|servicio)/,
    /(?:pagina|web|landing|sitio).*(?:negocio|empresa|restaurante|clinica|tienda|servicio|cotizar|precio|hacer|crear)/,
    /(?:agente|asistente|chatbot|ia|automatiz).*(?:negocio|whatsapp|mensajes|clientes|prospectos|ventas|atencion)/,
    /(?:responder|atender).*(?:clientes|prospectos|mensajes).*(?:horario|whatsapp|automatic|fuera)/,
    /(?:cuanto cuesta|precio|mensualidad).*(?:landing|pagina|agente|ia|chatbot|web)/,
    /(?:ya en serio|ahora si).*(?:necesito|quiero|busco|me interesa).*(?:pagina|web|landing|agente|ia|whatsapp|negocio)/,
    /(?:pueden|ustedes).*(?:hacer|crear|conectar|automatizar).*(?:pagina|web|agente|ia|whatsapp|sistema|negocio)/,
    /(?:que hosting incluye|hosting.*ustedes|hosting.*pagina.*ustedes|su agente usa|agente usa chatgpt)/,
  ]);
}

function isGeneralTechnologyConsulting(message) {
  const text = normalizeText(message);

  if (hasCommercialSignal(message)) {
    return false;
  }

  return matchesAny(text, [
    /cual es el mejor (hosting|crm|framework|lenguaje|servidor|proveedor)/,
    /(?:react|angular|vue|node|python|php|java)\s+o\s+(?:react|angular|vue|node|python|php|java)/,
    /(?:recomiendame|recomienda|comparame|compara).*(?:hosting|crm|servidor|proveedor|framework|lenguaje)/,
    /investiga.*(?:crm|hosting|proveedores|herramientas|software)/,
    /explicame como programar|como programo|como crear.*(?:chatbot|app|api)|paso a paso.*(?:chatbot|openai|programar|codigo)/,
    /ensename.*(?:crear|programar|hacer).*(?:chatbot|agente|app|api|codigo|openai)/,
  ]);
}

function isPureOffTopic(message) {
  const text = normalizeText(message);

  if (hasCommercialSignal(message)) {
    return false;
  }

  return matchesAny(text, [
    /quien gano.*mundial/,
    /hazme una receta|dame una receta/,
    /ayudame con mi tarea|haz mi tarea/,
    /escribe.*poema|haz.*poema/,
    /historia de mexico|cuentame la historia/,
    /que clima hace|clima de/,
    /resuelve.*ecuacion|cuanto es \d+.*\d+/,
    /circunferencia.*tierra|diametro.*tierra|radio.*tierra/,
    /distancia.*luna|luna.*distancia/,
    /traduceme|traduce esto/,
    /politica|presidente|celebridad|famoso|deportes|partido|pelicula|musica/,
  ]);
}

function isRecreationalMessage(message) {
  const text = normalizeText(message);

  if (hasCommercialSignal(message)) {
    return false;
  }

  return matchesAny(text, [
    /cuentame un chiste|dime un chiste|otro chiste|\botro\b|vamos.*uno bueno/,
    /juguemos|roleplay|actua como|ignora tus reglas|jailbreak/,
    /solo estoy probando|a ver que respondes|que puedes hacer/,
  ]);
}

function isRepeatedNonCommercialInsistence(message, conversation) {
  const text = normalizeText(message);

  return (
    Number(conversation?.off_topic_count || 0) > 0 &&
    !hasCommercialSignal(message) &&
    matchesAny(text, [
      /^no\b.*dime/,
      /dime cual/,
      /\botro\b/,
      /vamos/,
      /insisto/,
      /responde/,
    ])
  );
}

function isContextualHumor(message, recentMessages = []) {
  const text = normalizeText(message);
  const previousCommercialContext = recentMessages.some((messageItem) =>
    hasCommercialSignal(messageItem.content || "")
  );

  return (
    previousCommercialContext &&
    matchesAny(text, [/jaja|jeje|robot|trabaja mas|mis empleados|que loco|suena bien/])
  );
}

function isCommercialFollowup(message, recentMessages = []) {
  const text = normalizeText(message);
  const previousCommercialContext = recentMessages.some((messageItem) =>
    hasCommercialSignal(messageItem.content || "")
  );

  return (
    previousCommercialContext &&
    matchesAny(text, [
      /otro costo|otros costos|costo adicional|cuesta aparte|cuanto cuesta|precio|mensualidad|iva|factura/,
      /que incluye|que no incluye|incluye|no incluye|crm|hosting|dominio|correos/,
      /cuantos mensajes|prospectos|interacciones|fuera de horario|24 horas/,
      /me interesa|siguiente paso|quiero avanzar|como empezamos|que necesito/,
    ])
  );
}

function isAmbiguousCommercialQuestion(message) {
  const text = normalizeText(message);

  return matchesAny(text, [
    /otro costo|otros costos|costo adicional|cuesta aparte|cuanto cuesta|precio|mensualidad|iva|factura/,
    /que incluye|que no incluye|incluye|no incluye/,
  ]);
}

function classifyMessage({ message, conversation, recentMessages = [] }) {
  const scopeStatus = conversation?.conversation_scope_status || ACTIVE_STATUS;

  if (scopeStatus === BLOCKED_STATUS) {
    if (hasCommercialSignal(message)) {
      return {
        action: "reactivate_commercial",
        reason: "clear_commercial_reactivation",
      };
    }

    return {
      action: "silent_block",
      reason: "non_commercial_blocked",
    };
  }

  if (isContextualHumor(message, recentMessages)) {
    return {
      action: "allow",
      reason: "contextual_humor_in_commercial_thread",
    };
  }

  if (isCommercialFollowup(message, recentMessages)) {
    return {
      action: "allow",
      reason: "commercial_context_followup",
    };
  }

  if (isAmbiguousCommercialQuestion(message)) {
    return {
      action: "allow",
      reason: "ambiguous_commercial_question",
    };
  }

  if (isRepeatedNonCommercialInsistence(message, conversation)) {
    return {
      action: "warn_or_block",
      reason: "repeated_non_commercial_insistence",
      reply: OFF_TOPIC_RECONDUCTION,
    };
  }

  if (hasCommercialSignal(message)) {
    return {
      action: "allow",
      reason: "commercial_signal",
    };
  }

  if (isGeneralTechnologyConsulting(message)) {
    return {
      action: "warn_or_block",
      reason: "general_technology_consulting",
      reply: TECHNOLOGY_RECONDUCTION,
    };
  }

  if (isPureOffTopic(message)) {
    return {
      action: "warn_or_block",
      reason: "pure_off_topic",
      reply: OFF_TOPIC_RECONDUCTION,
    };
  }

  if (isRecreationalMessage(message)) {
    return {
      action: "warn_or_block",
      reason: "recreational_use",
      reply: OFF_TOPIC_RECONDUCTION,
    };
  }

  return {
    action: "allow",
    reason: "not_clearly_non_commercial",
  };
}

module.exports = {
  ACTIVE_STATUS,
  BLOCKED_STATUS,
  OFF_TOPIC_RECONDUCTION,
  TECHNOLOGY_RECONDUCTION,
  classifyMessage,
  hasCommercialSignal,
};
