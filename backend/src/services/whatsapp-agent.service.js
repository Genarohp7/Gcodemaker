const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const { MALU_BUSINESS_KNOWLEDGE } = require("../knowledge/malu-business-knowledge");
const aiAgentService = require("./ai-agent.service");
const { getCalendarProvider, getCalendarProviderName } = require("./calendar-provider.service");
const demoModeService = require("./demo-mode.service");
const intentGuardService = require("./intent-guard.service");
const scopeGuardService = require("./malu-scope-guard.service");
const whatsappService = require("./whatsapp.service");

const MALU_INTRODUCTION =
  "Hola, soy Malu, asistente virtual de GCodemaker.";
const POST_HANDOFF_CONTACT_QUESTION =
  "El ingeniero ya esta atendiendo tu caso y los detalles de tu servicio podras revisarlos directamente con el. Gustas que le pida que se ponga en contacto contigo?";
const POST_HANDOFF_CONTACT_CONFIRMATION =
  "Listo, ya deje registrada tu solicitud para que el ingeniero se ponga en contacto contigo.";
const POST_HANDOFF_BOUNDARY_MESSAGE =
  "El seguimiento de tu caso corresponde al ingeniero asignado. Para evitar darte informacion incorrecta, no voy a retomar la atencion comercial desde aqui.";
const POST_HANDOFF_FINAL_MESSAGE =
  "Para evitar darte informacion incorrecta, el seguimiento de tu caso debe realizarlo el ingeniero asignado. Tu solicitud ya quedo registrada.";
const POST_HANDOFF_MAX_AUTO_REPLIES = 4;
const SIMULATOR_PROVIDER = "simulator";
const SCHEDULING_ACTION = "malu_scheduling_state_changed";
const SCOPE_METRIC_ACTION = "malu_scope_consumption_metric";
const OWNER_INBOUND_ACTION = "malu_owner_inbound_message";
const OWNER_RESPONSE_SOURCE = "DETERMINISTIC_OWNER";
const OWNER_ACKNOWLEDGEMENT_MESSAGE =
  "Hola. Te reconozco como propietario de GCodemaker. En esta fase todavia no tengo comandos administrativos activos, pero no voy a tratar esta conversacion como prospecto comercial.";
const SCHEDULING_STATUSES = Object.freeze({
  READY_TO_OFFER: "READY_TO_OFFER_SCHEDULING",
  OFFERED: "SCHEDULING_OFFERED",
  WAITING_ACCEPTANCE: "WAITING_FOR_SCHEDULING_ACCEPTANCE",
  MODALITY_REQUIRED: "SCHEDULING_MODALITY_REQUIRED",
  AVAILABILITY_REQUIRED: "CALENDAR_AVAILABILITY_REQUIRED",
  SLOT_OPTIONS_PRESENTED: "SLOT_OPTIONS_PRESENTED",
  SLOT_SELECTED: "SLOT_SELECTED",
  APPOINTMENT_CONFIRMED: "APPOINTMENT_CONFIRMED",
  HANDOFF_FINALIZED: "HANDOFF_FINALIZED",
  DECLINED: "SCHEDULING_DECLINED",
});

const APPOINTMENT_MODALITIES = Object.freeze({
  IN_PERSON: "PRESENCIAL",
  VIDEO_CALL: "VIDEOLLAMADA",
  PHONE_CALL: "LLAMADA",
});

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function normalizePhoneE164(phone) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (raw.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith("00") && digits.length > 2) {
    return `+${digits.slice(2)}`;
  }

  return `+${digits}`;
}

function createOwnerActorId(normalizedPhone) {
  const digest = crypto.createHash("sha256").update(normalizedPhone).digest("hex");
  return `owner-${digest.slice(0, 16)}`;
}

function getOwnerIdentity(fromPhone) {
  const configuredOwnerPhone = normalizePhoneE164(env.gcMaluOwnerPhoneE164);
  const senderPhone = normalizePhoneE164(fromPhone);
  const isOwner = Boolean(configuredOwnerPhone && senderPhone && configuredOwnerPhone === senderPhone);

  return {
    isOwner,
    actorType: isOwner ? "OWNER" : "PROSPECT",
    actorId: isOwner ? createOwnerActorId(senderPhone) : null,
  };
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

function isAffirmativeContactRequest(message) {
  const text = String(message || "").trim().toLowerCase();

  return [
    /^s(?:i|\u00ed)\b/,
    /por favor/,
    /que me contacte/,
    /dile que me escriba/,
    /de acuerdo/,
    /claro/,
    /ok/,
  ].some((pattern) => pattern.test(text));
}

function isNegativeSchedulingResponse(message) {
  const text = String(message || "").trim().toLowerCase();

  return [
    /^no\b/,
    /no gracias/,
    /despues/,
    /luego/,
    /por ahora no/,
  ].some((pattern) => pattern.test(text));
}

function isSchedulingAcceptance(message) {
  const text = String(message || "").trim().toLowerCase();

  return [
    /^s(?:i|\u00ed)\b/,
    /por favor/,
    /me gustaria/,
    /me gustar[ií]a/,
    /consultar horarios/,
    /agenda/,
    /agendar/,
    /llamada/,
    /de acuerdo/,
    /\bok\b/,
  ].some((pattern) => pattern.test(text));
}

function detectAppointmentModality(message) {
  const text = String(message || "").trim().toLowerCase();

  if (/videollamada|video llamada|meet|zoom|teams|llamada por video|virtual|en linea|en línea/.test(text)) {
    return APPOINTMENT_MODALITIES.VIDEO_CALL;
  }

  if (/llamada telefonica|llamada telef[oó]nica|por telefono|por tel[eé]fono|telefono|tel[eé]fono/.test(text)) {
    return APPOINTMENT_MODALITIES.PHONE_CALL;
  }

  if (/presencial|en persona|reunion presencial|reuni[oó]n presencial|nos vemos|vernos/.test(text)) {
    return APPOINTMENT_MODALITIES.IN_PERSON;
  }

  return null;
}

function detectProspectLocation(message) {
  const text = String(message || "").trim().toLowerCase();

  if (/cdmx|ciudad de mexico|ciudad de m[eé]xico|mexico city|df|distrito federal/.test(text)) {
    return {
      city: "Ciudad de Mexico",
      state: "Ciudad de Mexico",
      inMexicoCity: true,
    };
  }

  const statePatterns = [
    [/baja california|tijuana|mexicali|ensenada/, "Baja California"],
    [/jalisco|guadalajara|zapopan/, "Jalisco"],
    [/nuevo leon|nuevo le[oó]n|monterrey/, "Nuevo Leon"],
    [/queretaro|quer[eé]taro/, "Queretaro"],
    [/puebla/, "Puebla"],
    [/estado de mexico|edomex|toluca/, "Estado de Mexico"],
    [/yucatan|yucat[aá]n|merida|m[eé]rida/, "Yucatan"],
    [/quintana roo|cancun|canc[uú]n|playa del carmen/, "Quintana Roo"],
  ];
  const match = statePatterns.find(([pattern]) => pattern.test(text));

  if (!match) {
    return null;
  }

  return {
    city: null,
    state: match[1],
    inMexicoCity: false,
  };
}

function mergeSchedulingContext(state = {}, message) {
  const location = detectProspectLocation(message) || state.location || null;
  const requestedModality =
    detectAppointmentModality(message) || state.modality || state.requestedModality || null;
  const modality =
    requestedModality === APPOINTMENT_MODALITIES.IN_PERSON && location?.inMexicoCity !== true
      ? null
      : requestedModality;

  return {
    location,
    modality,
    requestedModality,
  };
}

function isGenericMeetingRequest(message) {
  return /reunir|reunion|reuni[oó]n|cita|ver disponibilidad|horarios|agenda|agendar|llamada/i.test(
    String(message || "")
  );
}

function getZonedDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    dayOfWeek: dayMap[values.weekday],
  };
}

function zonedTimeToUtc({ year, month, day, hour, minute = 0 }, timeZone) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utcGuess);
  const values = Object.fromEntries(formatted.map((part) => [part.type, part.value]));
  const actualUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  const wantedUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  return new Date(utcGuess.getTime() + (wantedUtc - actualUtc));
}

function getNextWeekdayDateParts(dayOfWeek, { now = new Date(), timeZone = "America/Mexico_City" } = {}) {
  const current = getZonedDateParts(now, timeZone);
  const daysUntil = (dayOfWeek - current.dayOfWeek + 7) % 7 || 7;
  const cursor = new Date(now);
  cursor.setUTCDate(cursor.getUTCDate() + daysUntil);

  return getZonedDateParts(cursor, timeZone);
}

function detectRequestedAppointmentSlot(
  message,
  {
    now = new Date(),
    timeZone = "America/Mexico_City",
    durationMinutes = env.googleCalendarDefaultDurationMinutes || 30,
    modality = null,
    location = null,
  } = {}
) {
  const text = String(message || "").trim().toLowerCase();
  const weekdayMatch = text.match(
    /\b(?:proximo|pr[oÃ³]ximo|este|el)?\s*(lunes|martes|miercoles|mi[eÃ©]rcoles|jueves|viernes|sabado|s[aÃ¡]bado|domingo)\b/
  );
  const timeMatch = text.match(/\b(?:a\s+las\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  const dayPeriodMatch = text.match(/\b(?:de\s+la\s+)?(manana|maÃƒÂ±ana|tarde|noche)\b/);

  if (!weekdayMatch || !timeMatch) {
    return null;
  }

  const dayMap = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    "miÃ©rcoles": 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    "sÃ¡bado": 6,
  };
  const normalizedWeekday = weekdayMatch[1].replace("Ã©", "e").replace("Ã¡", "a");
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] || 0);
  const meridiem = timeMatch[3];
  const dayPeriod = dayPeriodMatch?.[1] || null;

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  } else if (meridiem === "am" && hour === 12) {
    hour = 0;
  } else if ((dayPeriod === "tarde" || dayPeriod === "noche") && hour < 12) {
    hour += 12;
  }

  if (hour > 23 || minute > 59) {
    return null;
  }

  const parts = getNextWeekdayDateParts(dayMap[normalizedWeekday], { now, timeZone });
  const startsAt = zonedTimeToUtc({ ...parts, hour, minute }, timeZone);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  return {
    id: `requested-slot-${startsAt.toISOString()}`,
    label: "Horario solicitado",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    durationMinutes,
    timeZone,
    modality,
    location,
    simulated: false,
  };
}

function inferSchedulingModalityFromMessages(messages = []) {
  const joined = messages
    .map((message) => message.content || "")
    .join("\n")
    .toLowerCase();

  if (/videollamada|video llamada|meet|zoom|teams|virtual|en linea|en lÃ­nea/.test(joined)) {
    return APPOINTMENT_MODALITIES.VIDEO_CALL;
  }

  if (/llamada|llamar|telefono|tel[eÃ©]fono/.test(joined)) {
    return APPOINTMENT_MODALITIES.PHONE_CALL;
  }

  if (/presencial|en persona|reunion presencial|reuni[oÃ³]n presencial/.test(joined)) {
    return APPOINTMENT_MODALITIES.IN_PERSON;
  }

  return null;
}

function inferSchedulingModalityFromLeadMessages(messages = []) {
  const leadMessages = messages
    .filter((message) => message.role === "lead")
    .map((message) => message.content || "")
    .reverse();

  for (const content of leadMessages) {
    const normalized = content.toLowerCase();

    if (/videollamada|video llamada|meet|zoom|teams|virtual|en linea|en lÃƒÂ­nea/.test(normalized)) {
      return APPOINTMENT_MODALITIES.VIDEO_CALL;
    }

    if (/llamada|llamar|telefono|tel[eÃƒÂ©]fono/.test(normalized)) {
      return APPOINTMENT_MODALITIES.PHONE_CALL;
    }

    if (/presencial|en persona|reunion presencial|reuni[oÃƒÂ³]n presencial/.test(normalized)) {
      return APPOINTMENT_MODALITIES.IN_PERSON;
    }
  }

  return null;
}

function isCalendarBackedAppointmentConfirmed(appointment, providerName) {
  const isConfirmed = String(appointment?.status || "").toLowerCase() === "confirmed";

  if (!isConfirmed || !appointment?.confirmedAt) {
    return false;
  }

  if (providerName === "GOOGLE" && !appointment.googleCalendarEventId) {
    return false;
  }

  return true;
}

function shouldPreventAiSchedulingHandoff({ incoming, aiResult, recentMessages = [] }) {
  if (!aiResult?.shouldTransferToHuman) {
    return false;
  }

  const combined = [
    incoming?.content || "",
    aiResult.reply || "",
    aiResult.nextSuggestedAction || "",
    ...recentMessages.slice(-6).map((message) => message.content || ""),
  ]
    .join("\n")
    .toLowerCase();

  return /llamada|cita|agenda|agendar|horario|disponibilidad|lunes|martes|miercoles|mi[eÃ©]rcoles|jueves|viernes|sabado|s[aÃ¡]bado|domingo/.test(
    combined
  );
}

function needsSchedulingModalityClarification({ state, message }) {
  const context = mergeSchedulingContext(state, message);

  if (
    context.requestedModality === APPOINTMENT_MODALITIES.IN_PERSON &&
    context.location?.inMexicoCity === false
  ) {
    return {
      needed: true,
      context,
      reply:
        "La reunion presencial solo esta disponible en Ciudad de Mexico. Podemos continuar con videollamada o llamada telefonica. Cual modalidad prefieres?",
    };
  }

  if (
    context.requestedModality === APPOINTMENT_MODALITIES.IN_PERSON &&
    !context.location
  ) {
    return {
      needed: true,
      context,
      reply:
        "Claro, revisamos la reunion presencial. En que ciudad te encuentras? La modalidad presencial esta disponible para Ciudad de Mexico.",
    };
  }

  if (context.modality) {
    return {
      needed: false,
      context,
    };
  }

  if (context.location?.inMexicoCity === true) {
    return {
      needed: true,
      context,
      reply:
        "Como estas en Ciudad de Mexico, podemos revisar la reunion en modalidad presencial, videollamada o llamada telefonica. Cual prefieres?",
    };
  }

  if (context.location?.inMexicoCity === false) {
    return {
      needed: true,
      context,
      reply:
        "Podemos continuar por videollamada o llamada telefonica. Cual modalidad prefieres para la reunion con el ingeniero responsable?",
    };
  }

  if (isGenericMeetingRequest(message)) {
    return {
      needed: true,
      context,
      reply:
        "Claro. Podemos revisar tu proyecto con el ingeniero responsable. En que ciudad te encuentras o prefieres videollamada o llamada telefonica? Asi puedo indicarte que modalidades de reunion tenemos disponibles.",
    };
  }

  return {
    needed: true,
    context,
    reply:
      "Antes de consultar horarios, necesito confirmar la modalidad de la reunion: videollamada, llamada telefonica o, si estas en Ciudad de Mexico, reunion presencial. Cual prefieres?",
  };
}

function parseSlotSelection(message, slots = []) {
  const text = String(message || "").trim().toLowerCase();
  const explicitNumber = text.match(/\b(?:opci[oó]n\s*)?([1-3])\b/);

  if (explicitNumber) {
    return slots[Number(explicitNumber[1]) - 1] || null;
  }

  return (
    slots.find((slot) => text.includes(String(slot.label || "").toLowerCase())) ||
    null
  );
}

function isTransferredConversation(conversation, lead) {
  return (
    conversation?.conversation_owner === "INGENIERO" ||
    conversation?.human_takeover === true ||
    lead?.ai_enabled === false ||
    lead?.human_takeover === true
  );
}

function withMaluIntroduction(reply, conversation) {
  const text = String(reply || "").trim();

  if (!conversation?.isNew) {
    return text
      .replace(/^Hola,\s*soy Malu,\s*asistente virtual de GCodemaker\.\s*/i, "")
      .trim();
  }

  if (!text || text.startsWith(MALU_INTRODUCTION)) {
    return text || MALU_INTRODUCTION;
  }

  if (text.startsWith("Hola! ")) {
    return `${MALU_INTRODUCTION} ${text.slice("Hola! ".length)}`;
  }

  return `${MALU_INTRODUCTION} ${text}`;
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

function getIncomingProvider(incoming) {
  return incoming?.provider || "whatsapp_webhook";
}

function getOutgoingProvider(incoming) {
  return incoming?.transport === "simulator" ? SIMULATOR_PROVIDER : "whatsapp_cloud_api";
}

function isSimulatorMockMode(incoming) {
  return incoming?.transport === "simulator" && incoming?.simulationMode === "MOCK";
}

function getMaluProduct(code) {
  return MALU_BUSINESS_KNOWLEDGE.products.find((product) => product.code === code);
}

function getMaluAiPackage(code) {
  return MALU_BUSINESS_KNOWLEDGE.aiAgentPackages.find((aiPackage) => aiPackage.code === code);
}

function formatMxn(amount) {
  return `$${Number(amount).toLocaleString("es-MX")} MXN`;
}

function hasImplementationDiscountOfferShown(recentMessages = []) {
  return recentMessages.some((message) =>
    /15%|quince por ciento|descuento.*implementaci[oÃ³]n|descuento.*implementacion/i.test(
      String(message.content || "")
    )
  );
}

function buildImplementationDiscountSentence(recentMessages = []) {
  if (hasImplementationDiscountOfferShown(recentMessages)) {
    return "";
  }

  return " Ademas, si programas una llamada con el ingeniero responsable, podria aplicar un descuento del 15% sobre el costo de implementacion.";
}

function textIncludesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function isPriceQuestion(message) {
  return /precio|costo|cu[aÃ¡]nto cuesta|cuanto cuesta|mensualidad|inversi[oÃ³]n|presupuesto|paquete|cotiz/i.test(
    String(message || "")
  );
}

function stripUnrequestedPriceReferences(reply) {
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

function productFromText(text) {
  if (/landing|p[aÃ¡]gina|pagina|sitio web|web sencilla/.test(text)) {
    return "landing_esencial";
  }

  if (/agente|asistente|automatiz|whatsapp|mensajes|fuera de horario|horarios no laborales|chatbot|\bia\b/.test(text)) {
    return "agente_ia_base";
  }

  return null;
}

function deriveSimulatorMockContext({ incoming, decision, lead, recentMessages }) {
  const combined = recentMessages.map((message) => message.content || "").join("\n").toLowerCase();
  const currentText = String(incoming?.content || "").toLowerCase();
  const serviceInterest = decision.serviceInterest || lead?.service_interest || null;
  const productByService =
    serviceInterest === "landing_page"
      ? "landing_esencial"
      : serviceInterest === "ai_automation"
        ? "agente_ia_base"
        : null;
  const currentProduct =
    productFromText(currentText) || productByService || productFromText(combined);
  const lastAssistantMessage = [...recentMessages].reverse().find((message) => message.role === "ai");
  const previousLeadMessages = recentMessages.filter((message) => message.role === "lead");

  return {
    currentProduct,
    lastAssistantTopic: lastAssistantMessage ? productFromText(lastAssistantMessage.content || "") : null,
    knownBusinessType: textIncludesAny(combined, [/clinica|clÃ­nica/, /restaurante/, /tienda/, /consultorio/]),
    knownNeed: Boolean(productFromText(combined) || /clientes|ventas|atencion|atenci[oÃ³]n|fuera de horario|mensajes/.test(combined)),
    knownVolume: /\b\d+\s*(mensajes|prospectos)|muchos mensajes|pocos mensajes|alto volumen/i.test(combined),
    previousQuestion: lastAssistantMessage?.content || null,
    profilingStage: previousLeadMessages.length <= 1 ? "opening" : "contextual_followup",
  };
}

async function getRecentConversationMessages({ conversationId, limit = 12 }) {
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

async function logScopeMetric({ leadId, conversationId, event, metadata = {} }) {
  await pool.query(
    `
      INSERT INTO gc_ai_activity_logs (
        id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, 'gc_ai_conversation', $3, $4::jsonb)
    `,
    [
      createId("activity"),
      SCOPE_METRIC_ACTION,
      conversationId,
      JSON.stringify({
        leadId,
        event,
        ...metadata,
      }),
    ]
  );
}

async function findOwnerInboundActivity({ provider, providerMessageId }) {
  if (!providerMessageId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT id
      FROM gc_ai_activity_logs
      WHERE action = $1
        AND metadata->>'provider' = $2
        AND metadata->>'providerMessageId' = $3
      LIMIT 1
    `,
    [OWNER_INBOUND_ACTION, provider, providerMessageId]
  );

  return result.rows[0] || null;
}

async function logOwnerInboundActivity({ actorId, incoming, incomingProvider, outgoingProvider, sendResult }) {
  await pool.query(
    `
      INSERT INTO gc_ai_activity_logs (
        id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, 'gc_ai_owner_conversation', $3, $4::jsonb)
    `,
    [
      createId("activity"),
      OWNER_INBOUND_ACTION,
      actorId,
      JSON.stringify({
        actorType: "OWNER",
        ownerDetected: true,
        provider: incomingProvider,
        outgoingProvider,
        providerMessageId: incoming.whatsappMessageId || null,
        transport: incoming.transport || "whatsapp",
        autoReply: {
          sent: Boolean(sendResult.sent),
          status: sendResult.status || null,
          reason: sendResult.reason || null,
          simulator: Boolean(sendResult.simulator),
        },
      }),
    ]
  );
}

async function handleOwnerInbound({ incoming, incomingProvider, outgoingProvider, ownerIdentity }) {
  const duplicateOwnerInbound = await findOwnerInboundActivity({
    provider: incomingProvider,
    providerMessageId: incoming.whatsappMessageId,
  });

  if (duplicateOwnerInbound) {
    console.info("whatsapp_agent_owner_inbound", {
      provider: incomingProvider,
      ownerDetected: true,
      duplicate: true,
    });

    return {
      processed: true,
      duplicate: true,
      actorType: "OWNER",
      reason: "duplicate_owner_provider_message_id",
      autoReply: {
        sent: false,
        reason: "duplicate_owner_provider_message_id",
      },
    };
  }

  console.info("whatsapp_agent_owner_inbound", {
    provider: incomingProvider,
    ownerDetected: true,
  });

  const sendResult = await sendAutoReply({
    toPhone: incoming.fromPhone,
    phoneNumberId: incoming.phoneNumberId,
    content: OWNER_ACKNOWLEDGEMENT_MESSAGE,
    transport: incoming.transport,
  });

  await logOwnerInboundActivity({
    actorId: ownerIdentity.actorId,
    incoming,
    incomingProvider,
    outgoingProvider,
    sendResult,
  });

  return {
    processed: true,
    actorType: "OWNER",
    responseSource: OWNER_RESPONSE_SOURCE,
    ownerDetected: true,
    commercialLeadCreated: false,
    autoReply: {
      sent: Boolean(sendResult.sent),
      status: sendResult.status || null,
      reason: sendResult.reason || null,
    },
    decision: {
      action: "owner_internal_acknowledgement",
      usedAi: false,
      humanTakeover: false,
    },
  };
}

async function updateScopeState({
  leadId,
  conversationId,
  status = null,
  incrementOffTopic = false,
  markBlocked = false,
  markReactivated = false,
}) {
  await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        conversation_scope_status = COALESCE($2, conversation_scope_status),
        off_topic_count = off_topic_count + CASE WHEN $3 THEN 1 ELSE 0 END,
        non_commercial_blocked_at = CASE
          WHEN $4 THEN COALESCE(non_commercial_blocked_at, NOW())
          ELSE non_commercial_blocked_at
        END,
        commercial_reactivated_at = CASE
          WHEN $5 THEN NOW()
          ELSE commercial_reactivated_at
        END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [conversationId, status, Boolean(incrementOffTopic), Boolean(markBlocked), Boolean(markReactivated)]
  );

  if (incrementOffTopic) {
    await pool.query(
      `
        UPDATE gc_ai_leads
        SET
          off_topic_count = off_topic_count + 1,
          updated_at = NOW()
        WHERE id = $1
      `,
      [leadId]
    );
  }
}

async function handleScopeGuard({ lead, conversation, incoming, outgoingProvider }) {
  const recentMessages = await getRecentConversationMessages({
    conversationId: conversation.id,
    limit: 12,
  });
  const scopeDecision = scopeGuardService.classifyMessage({
    message: incoming.content,
    conversation,
    recentMessages,
  });

  if (scopeDecision.action === "allow") {
    return null;
  }

  if (scopeDecision.action === "reactivate_commercial") {
    await updateScopeState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: scopeGuardService.ACTIVE_STATUS,
      markReactivated: true,
    });
    await logScopeMetric({
      leadId: lead.id,
      conversationId: conversation.id,
      event: "commercial_reactivation",
      metadata: {
        reason: scopeDecision.reason,
      },
    });

    return null;
  }

  if (scopeDecision.action === "silent_block") {
    await logScopeMetric({
      leadId: lead.id,
      conversationId: conversation.id,
      event: "non_commercial_blocked",
      metadata: {
        reason: scopeDecision.reason,
        openAiAvoided: true,
        responded: false,
      },
    });

    return {
      processed: true,
      leadId: lead.id,
      conversationId: conversation.id,
      scope: {
        status: scopeGuardService.BLOCKED_STATUS,
        reason: scopeDecision.reason,
        openAiAvoided: true,
      },
      autoReply: {
        sent: false,
        reason: scopeDecision.reason,
      },
      decision: {
        action: "scope_silent_block",
        reason: scopeDecision.reason,
        usedAi: false,
      },
    };
  }

  if (scopeDecision.action === "warn_or_block") {
    const currentOffTopicCount = Number(conversation.off_topic_count || 0);
    const hasPriorScopeReconduct = recentMessages.some((message) =>
      /fuera de lo que puedo ayudarte|consulta tecnologica general/i.test(message.content || "")
    );
    const hasPriorNonCommercialInbound = recentMessages.some((message) => {
      if (message.role !== "lead" || message.content === incoming.content) {
        return false;
      }

      return (
        scopeGuardService.classifyMessage({
          message: message.content,
          conversation: {
            conversation_scope_status: scopeGuardService.ACTIVE_STATUS,
            off_topic_count: 0,
          },
          recentMessages: [],
        }).action === "warn_or_block"
      );
    });

    if (currentOffTopicCount >= 1 || hasPriorScopeReconduct || hasPriorNonCommercialInbound) {
      await updateScopeState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: scopeGuardService.BLOCKED_STATUS,
        incrementOffTopic: true,
        markBlocked: true,
      });
      await logScopeMetric({
        leadId: lead.id,
        conversationId: conversation.id,
        event: "non_commercial_blocked",
        metadata: {
          reason: scopeDecision.reason,
          openAiAvoided: true,
          responded: false,
        },
      });

      return {
        processed: true,
        leadId: lead.id,
        conversationId: conversation.id,
        scope: {
          status: scopeGuardService.BLOCKED_STATUS,
          reason: scopeDecision.reason,
          openAiAvoided: true,
        },
        autoReply: {
          sent: false,
          reason: scopeDecision.reason,
        },
        decision: {
          action: "scope_block",
          reason: scopeDecision.reason,
          usedAi: false,
        },
      };
    }

    await updateScopeState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: scopeGuardService.BLOCKED_STATUS,
      incrementOffTopic: true,
      markBlocked: true,
    });
    const replyContent = withMaluIntroduction(scopeDecision.reply, conversation);
    const sendResult = await sendAutoReply({
      toPhone: incoming.fromPhone,
      phoneNumberId: incoming.phoneNumberId,
      content: replyContent,
      transport: incoming.transport,
    });
    const outgoingMessage = await saveMessage({
      leadId: lead.id,
      conversationId: conversation.id,
      role: "ai",
      direction: "outgoing",
      content: replyContent,
      messageType: "text",
      externalMessageId: sendResult.whatsappMessageId || null,
      provider: outgoingProvider,
      rawPayload: {
        autoReply: sendResult,
        responseSource: "DETERMINISTIC_SCOPE",
        scope: {
          reason: scopeDecision.reason,
          openAiAvoided: true,
        },
      },
    });

    await logScopeMetric({
      leadId: lead.id,
      conversationId: conversation.id,
      event: "deterministic_response",
      metadata: {
        reason: scopeDecision.reason,
        openAiAvoided: true,
        responded: true,
      },
    });

    return {
      processed: true,
      leadId: lead.id,
      conversationId: conversation.id,
      outgoingMessageId: outgoingMessage.id,
      scope: {
        status: scopeGuardService.ACTIVE_STATUS,
        reason: scopeDecision.reason,
        openAiAvoided: true,
      },
      autoReply: {
        sent: Boolean(sendResult.sent),
        status: sendResult.status || null,
        reason: sendResult.reason || null,
      },
      decision: {
        action: "scope_reconduct",
        reason: scopeDecision.reason,
        usedAi: false,
      },
    };
  }

  return null;
}

function needsProductClarification(content, context) {
  return (
    !context.currentProduct &&
    textIncludesAny(content, [
      /otro costo|otros costos|alg[uÃº]n otro costo|algun otro costo|costo adicional|cuesta aparte/,
      /incluye iva|iva/,
      /qu[eÃ©] incluye|que incluye/,
      /qu[eÃ©] no incluye|que no incluye|no incluye/,
      /cu[aÃ¡]ntos mensajes|cuantos mensajes/,
      /\bcrm\b/,
    ])
  );
}

function createContextualMockReply({ content, context, landing, aiAgent, recentMessages = [] }) {
  if (needsProductClarification(content, context)) {
    return "Para responderte bien necesito aclarar a que servicio te refieres: Landing Esencial o paquetes de Agentes de IA?";
  }

  const product = context.currentProduct === "landing_esencial" ? landing : aiAgent;
  const isLanding = product.code === "landing_esencial";
  const iaRespuestas = getMaluAiPackage("ia_respuestas");
  const discountSentence = buildImplementationDiscountSentence(recentMessages);

  if (textIncludesAny(content, [/15%.*mensualidad|mensualidad.*15%|descuento.*mensualidad/])) {
    return "No. El posible 15% aplica unicamente sobre el costo de implementacion cuando se programa una llamada con el ingeniero responsable; no aplica sobre mensualidad, IVA, consumos ni servicios externos.";
  }

  if (textIncludesAny(content, [/precio|cu[aÃƒÂ¡]nto cuesta|cuanto cuesta|mensualidad|inversion|inversi[oÃƒÂ³]n|presupuesto/])) {
    return isLanding
      ? "La Landing Esencial tiene un precio base de $2,500 MXN como pago por creacion. Cualquier ampliacion, como tienda en linea, pagos o integraciones, se revisa y cotiza aparte."
      : `IA Respuestas tiene implementacion de ${formatMxn(
          iaRespuestas.implementationPriceMxn
        )} y mensualidad de ${formatMxn(
          iaRespuestas.monthlyPriceMxn
        )}. Si requieres factura se agrega IVA. Para saber si conviene ese paquete, IA Perfilador o IA Comercial, primero hay que revisar volumen, proceso e integraciones.${discountSentence}`;
  }

  if (textIncludesAny(content, [/otros paquetes|otro paquete|que paquetes|qu[eÃ©] paquetes|planes|opciones|alternativas/])) {
    const lines = MALU_BUSINESS_KNOWLEDGE.aiAgentPackages.map(
      (aiPackage) =>
        `${aiPackage.name}: implementacion ${formatMxn(
          aiPackage.implementationPriceMxn
        )} y mensualidad ${formatMxn(aiPackage.monthlyPriceMxn)}`
    );

    return `Los paquetes IA autorizados son: ${lines.join("; ")}. La recomendacion depende del volumen, agenda, proceso e integraciones. Que proceso quieres automatizar primero?${discountSentence}`;
  }

  if (textIncludesAny(content, [/otro costo|otros costos|alg[uÃº]n otro costo|algun otro costo|costo adicional|cuesta aparte/])) {
    if (isLanding) {
      return "El precio de $2,500 MXN es la base de creacion de la Landing Esencial. Tienda en linea, pagos, reservaciones complejas, catalogo amplio, integraciones, SEO continuo o mantenimiento se evaluan y cotizan aparte.";
    }

    return `En IA Respuestas, la mensualidad base es ${formatMxn(
      iaRespuestas.monthlyPriceMxn
    )} y la implementacion es ${formatMxn(
      iaRespuestas.implementationPriceMxn
    )}. Si requieres factura se agrega IVA. Integraciones, consumos extraordinarios, servicios externos o necesidades fuera del alcance del paquete se revisan por separado.${discountSentence}`;
  }

  if (textIncludesAny(content, [/incluye iva|iva|factura/])) {
    return isLanding
      ? "El precio base de la Landing Esencial es $2,500 MXN. Si necesitas factura, la condicion fiscal debe validarse antes de cerrar la propuesta con el ingeniero."
      : "En los paquetes de Agentes de IA, el IVA se agrega cuando el cliente requiere factura. El incentivo del 15% aplica solo sobre el costo de implementacion, no sobre mensualidad ni IVA.";
  }

  if (
    textIncludesAny(content, [/qu[eÃ©] incluye|que incluye|incluye/]) &&
    !textIncludesAny(content, [/qu[eÃ©] no incluye|que no incluye|no incluye|excluye/])
  ) {
    return isLanding
      ? "Landing Esencial incluye landing profesional, dominio, hosting, dos correos, hasta cuatro secciones, boton de WhatsApp, redes sociales, SEO inicial y diseno adaptable. Que tipo de negocio quieres presentar?"
      : "Los paquetes IA cubren desde respuestas a prospectos hasta perfilamiento y apoyo comercial, segun el paquete. IA Respuestas atiende dudas frecuentes; IA Perfilador profundiza calificacion y citas; IA Comercial ofrece mayor capacidad y ajustes.";
  }

  if (textIncludesAny(content, [/qu[eÃ©] no incluye|que no incluye|no incluye|excluye/])) {
    return isLanding
      ? "Landing Esencial no incluye tienda en linea, pagos, reservaciones complejas, panel administrativo, catalogo amplio, software personalizado, integraciones avanzadas, SEO continuo ni campanas."
      : "Los paquetes IA no incluyen CRM completo, campanas masivas, ERP, pagos, infraestructura dedicada, API personalizada, Meta Ads, numeros ni costos de terceros salvo que se autoricen y coticen aparte.";
  }

  if (textIncludesAny(content, [/cu[aÃ¡]ntos mensajes|cuantos mensajes|prospectos|interacciones/])) {
    return "IA Respuestas contempla 150 leads y 1050 respuestas de IA por ciclo, con maximo siete respuestas por lead. IA Perfilador sube a 300 leads y 3000 respuestas; IA Comercial a 500 leads y 6000 respuestas. Esos limites comerciales no reemplazan limites tecnicos internos.";
  }

  if (textIncludesAny(content, [/\bcrm\b/])) {
    return "Los paquetes IA no incluyen un CRM completo. Pueden perfilar prospectos y preparar seguimiento, pero un CRM o integracion personalizada se evalua y cotiza aparte.";
  }

  if (textIncludesAny(content, [/fuera de horario|horarios no laborales|24 horas|siempre|noche|madrugada/])) {
    return "Un paquete IA puede ayudar a no perder prospectos fuera del horario humano y operar dentro de la ventana de atencion de 24 horas de WhatsApp. En que horarios recibes mas mensajes?";
  }

  if (textIncludesAny(content, [/y la landing|y una landing|y la p[aÃ¡]gina|y la pagina/])) {
    return "La Landing Esencial sirve para presentar tu negocio de forma profesional y facilitar contacto por WhatsApp. Su precio base es $2,500 MXN como pago por creacion.";
  }

  if (textIncludesAny(content, [/cu[aÃ¡]l me conviene|cual me conviene|que me conviene|cu[aÃ¡]l recomiendas|cual recomiendas/])) {
    return "Si necesitas captar confianza y contacto, conviene Landing Esencial. Si ya recibes mensajes y pierdes oportunidades por tiempo de respuesta, conviene evaluar un paquete IA. Que problema pesa mas hoy?";
  }

  if (textIncludesAny(content, [/empezar|iniciar|requisitos|necesito para empezar/])) {
    return isLanding
      ? "Para iniciar una Landing Esencial se necesita nombre del negocio, colores, contacto, servicios o productos, redes y fotos si existen. El logo ayuda, pero puede revisarse segun tu caso."
      : "Para iniciar un paquete IA se necesitan reglas, preguntas frecuentes, servicios, criterios de transferencia y el canal de atencion. Primero conviene definir que dudas debe responder y que proceso debe cubrir.";
  }

  return null;
}

function isSimulatorContextualFollowup(content) {
  return textIncludesAny(String(content || "").toLowerCase(), [
      /otro costo|otros costos|alg[uÃƒÂº]n otro costo|algun otro costo|costo adicional|cuesta aparte/,
      /precio|cu[aÃƒÂ¡]nto cuesta|cuanto cuesta|mensualidad|inversion|inversi[oÃƒÂ³]n|presupuesto/,
    /incluye iva|iva|factura/,
    /qu[eÃƒÂ©] incluye|que incluye|incluye/,
    /qu[eÃƒÂ©] no incluye|que no incluye|no incluye|excluye/,
    /cu[aÃƒÂ¡]ntos mensajes|cuantos mensajes|prospectos|interacciones/,
    /\bcrm\b/,
    /fuera de horario|horarios no laborales|24 horas|siempre|noche|madrugada/,
    /y la landing|y una landing|y la p[aÃƒÂ¡]gina|y la pagina/,
    /cu[aÃƒÂ¡]l me conviene|cual me conviene|que me conviene|cu[aÃƒÂ¡]l recomiendas|cual recomiendas/,
    /empezar|iniciar|requisitos|necesito para empezar/,
  ]);
}

function createSimulatorMockAiResult({ incoming, decision, lead, recentMessages = [] }) {
  const content = String(incoming?.content || "").toLowerCase();
  const landing = getMaluProduct("landing_esencial");
  const aiAgent = getMaluProduct("agente_ia_base");
  const context = deriveSimulatorMockContext({ incoming, decision, lead, recentMessages });
  const shouldTransferToHuman =
    /descuento|garantia|garant[ií]a|excepcion|excepci[oó]n|negociar|autoriza|contrato/.test(
      content
    );

  if (shouldTransferToHuman) {
    return {
      reply:
        "Gracias por explicarlo. Esa decision necesita revisarla el ingeniero responsable para darte una respuesta correcta.",
      shouldTransferToHuman: true,
      leadStatus: "qualified_for_human",
      serviceInterest: decision.serviceInterest || null,
      summary: "Solicitud que requiere validacion humana.",
      nextSuggestedAction: "Seguimiento humano",
      tokensInput: 0,
      tokensOutput: 0,
      model: "simulator-mock",
      skipped: false,
    };
  }

  const contextualReply = createContextualMockReply({
    content,
    context,
    landing,
    aiAgent,
    recentMessages,
  });
  if (contextualReply) {
    return {
      reply: contextualReply,
      shouldTransferToHuman: false,
      leadStatus: decision.leadStatus || "ai_profiling",
      serviceInterest:
        context.currentProduct === "landing_esencial"
          ? "landing_page"
          : context.currentProduct === "agente_ia_base"
            ? "ai_automation"
            : decision.serviceInterest || null,
      summary: "Respuesta contextual en simulador MOCK.",
      nextSuggestedAction: "Continuar perfilamiento",
      tokensInput: 0,
      tokensOutput: 0,
      model: "simulator-mock",
      skipped: false,
    };
  }

  if (/fuera de horario|horarios no laborales|responder.*clientes|automatiz|whatsapp|mensajes/.test(content)) {
    return {
      reply:
        "Un paquete de Agentes de IA puede ayudarte a responder prospectos fuera del horario humano y calificar oportunidades. Para perfilarlo bien, cuantos mensajes recibes en un dia normal?",
      shouldTransferToHuman: false,
      leadStatus: decision.leadStatus || "ai_profiling",
      serviceInterest: "ai_automation",
      summary: "Interes en automatizar atencion fuera de horario.",
      nextSuggestedAction: "Continuar perfilamiento",
      tokensInput: 0,
      tokensOutput: 0,
      model: "simulator-mock",
      skipped: false,
    };
  }

  if (/landing|p[aÃ¡]gina|pagina|sitio web|web sencilla/.test(content)) {
    return {
      reply:
        `${landing.name} puede servir si necesitas una pagina sencilla y profesional para recibir contactos. Para orientarte mejor, a que se dedica tu negocio y que te gustaria que los visitantes pudieran conocer o hacer en la pagina?`,
      shouldTransferToHuman: false,
      leadStatus: decision.leadStatus || "ai_profiling",
      serviceInterest: "landing_page",
      summary: "Interes en landing page sencilla.",
      nextSuggestedAction: "Continuar perfilamiento",
      tokensInput: 0,
      tokensOutput: 0,
      model: "simulator-mock",
      skipped: false,
    };
  }

  return {
    reply:
      "Gracias por contarme. Para perfilar mejor tu caso, cuentame que proceso de tu negocio quieres mejorar primero.",
    shouldTransferToHuman: false,
    leadStatus: decision.leadStatus || "ai_profiling",
    serviceInterest: decision.serviceInterest || null,
    summary: "Conversacion simulada en modo tecnico.",
    nextSuggestedAction: "Continuar perfilamiento",
    tokensInput: 0,
    tokensOutput: 0,
    model: "simulator-mock",
    skipped: false,
  };
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
      SELECT
        conversations.*,
        NOT EXISTS (
          SELECT 1
          FROM gc_ai_messages messages
          WHERE messages.conversation_id = conversations.id
        ) AS is_new
      FROM gc_ai_conversations conversations
      WHERE conversations.lead_id = $1
        AND channel = 'whatsapp'
        AND status = 'open'
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [leadId]
  );

  if (existing.rows[0]) {
    return {
      ...existing.rows[0],
      isNew: Boolean(existing.rows[0].is_new),
    };
  }

  const result = await pool.query(
    `
      INSERT INTO gc_ai_conversations (
        id,
        lead_id,
        channel,
        status,
        conversation_owner
      )
      VALUES ($1, $2, 'whatsapp', 'open', 'MALU')
      RETURNING *
    `,
    [createId("conversation"), leadId]
  );

  return {
    ...result.rows[0],
    isNew: true,
  };
}

async function findMessageByProviderMessageId({ provider, providerMessageId }) {
  if (!providerMessageId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT *
      FROM gc_ai_messages
      WHERE provider = $1
        AND provider_message_id = $2
      LIMIT 1
    `,
    [provider, providerMessageId]
  );

  return result.rows[0] || null;
}

function isProviderMessageDuplicate(error) {
  return (
    error?.code === "23505" &&
    (error?.constraint === "idx_gc_ai_messages_provider_message_id_unique" ||
      String(error?.message || "").includes("provider_message_id"))
  );
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
  provider = null,
}) {
  const messageProvider = provider || (direction === "outgoing" ? "whatsapp_cloud_api" : "whatsapp_webhook");

  try {
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
        messageProvider,
        externalMessageId,
        JSON.stringify({
          direction,
          rawPayload: rawPayload || {},
        }),
      ]
    );

    return result.rows[0];
  } catch (error) {
    if (!isProviderMessageDuplicate(error)) {
      throw error;
    }

    const existing = await findMessageByProviderMessageId({
      provider: messageProvider,
      providerMessageId: externalMessageId,
    });

    if (!existing) {
      throw error;
    }

    return {
      ...existing,
      duplicate: true,
    };
  }
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
          conversation_owner = 'INGENIERO',
          handoff_finalized_at = COALESCE(handoff_finalized_at, NOW()),
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
          conversation_owner = 'INGENIERO',
          handoff_finalized_at = COALESCE(handoff_finalized_at, NOW()),
          status = 'open',
          updated_at = NOW()
        WHERE id = $1
      `,
      [conversationId]
    );
  }
}

async function logSchedulingState({ leadId, conversationId, status, metadata = {} }) {
  await pool.query(
    `
      INSERT INTO gc_ai_activity_logs (
        id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, 'gc_ai_conversation', $3, $4::jsonb)
    `,
    [
      createId("activity"),
      SCHEDULING_ACTION,
      conversationId,
      JSON.stringify({
        leadId,
        status,
        ...metadata,
      }),
    ]
  );
}

async function getLatestSchedulingState({ conversationId }) {
  const result = await pool.query(
    `
      SELECT metadata
      FROM gc_ai_activity_logs
      WHERE entity_id = $1
        AND action = $2
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [conversationId, SCHEDULING_ACTION]
  );

  return result.rows[0]?.metadata || {
    status: "PROFILING",
  };
}

async function getLatestPresentedSchedulingSlots({ conversationId }) {
  const result = await pool.query(
    `
      SELECT metadata
      FROM gc_ai_activity_logs
      WHERE entity_id = $1
        AND action = $2
        AND metadata->>'status' = $3
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [conversationId, SCHEDULING_ACTION, SCHEDULING_STATUSES.SLOT_OPTIONS_PRESENTED]
  );

  return result.rows[0]?.metadata?.slots || [];
}

async function getConversationSummaryForScheduling({ conversationId, lead }) {
  const recentMessages = await getRecentConversationMessages({
    conversationId,
    limit: 12,
  });
  const combined = recentMessages.map((message) => message.content || "").join(" ").toLowerCase();
  const product =
    productFromText(combined) === "landing_esencial"
      ? "Landing Esencial"
      : productFromText(combined) === "agente_ia_base"
        ? "Agente de IA Base"
        : lead.service_interest || null;

  return {
    prospect: lead.name || null,
    business: /dentista|clinica|clÃƒÂ­nica/.test(combined) ? "servicio dental o clinica" : null,
    businessType: /dentista|clinica|clÃƒÂ­nica/.test(combined) ? "salud dental" : null,
    need: /google|presencia|p[aÃƒÂ¡]gina|pagina|landing/.test(combined)
      ? "presencia digital y contacto"
      : /mensajes|horario|asistente|agente/.test(combined)
        ? "atencion automatizada de mensajes"
        : null,
    product,
    relevantContext: recentMessages
      .filter((message) => message.role === "lead")
      .map((message) => String(message.content || "").slice(0, 180)),
    pendingQuestions: [],
    availableMaterials: /logo|logotipo/.test(combined) ? ["logotipo"] : [],
    conversationId,
    leadId: lead.id,
  };
}

function hasUsefulSchedulingContext({ lead, recentMessages }) {
  const combined = recentMessages.map((message) => message.content || "").join(" ").toLowerCase();

  return Boolean(
    (lead.service_interest || productFromText(combined)) &&
      (/dentista|clinica|clÃƒÂ­nica|restaurante|tienda|consultorio|negocio|logo|logotipo|mensajes|google|presencia/.test(
        combined
      ) ||
        recentMessages.filter((message) => message.role === "lead").length >= 3)
  );
}

function buildSchedulingOfferReply() {
  return "Con la informacion que me compartiste ya puedo preparar tu caso para una consultoria comercial final con el ingeniero responsable. La reunion se agenda segun disponibilidad real y puede ser por videollamada, llamada telefonica o presencial si estas en Ciudad de Mexico. Que modalidad prefieres?";
}

function getModalityLabel(modality) {
  if (modality === APPOINTMENT_MODALITIES.IN_PERSON) {
    return "reunion presencial";
  }

  if (modality === APPOINTMENT_MODALITIES.VIDEO_CALL) {
    return "videollamada";
  }

  return "llamada telefonica";
}

function formatSlotDateTime(slot) {
  const date = new Date(slot.startsAt);
  const datePart = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: slot.timeZone || "America/Mexico_City",
  })
    .format(date)
    .replace(",", "");
  const timePart = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: slot.timeZone || "America/Mexico_City",
  })
    .format(date)
    .replace(/\s+/g, " ")
    .replace(/a\.?\s?m\.?/i, "a. m.")
    .replace(/p\.?\s?m\.?/i, "p. m.");

  return {
    date: datePart,
    time: timePart,
    label: `${datePart} a las ${timePart}`,
  };
}

function buildSlotOptionsReply(slots, modality) {
  const options = slots
    .map((slot, index) => {
      const formatted = formatSlotDateTime(slot);

      return `${index + 1}. ${formatted.label}`;
    })
    .join("\n");

  return `Tengo estas opciones disponibles para ${getModalityLabel(
    modality
  )}:\n${options}\nCual opcion prefieres?`;
}

function buildAppointmentConfirmedReply(slot, modality) {
  const formatted = formatSlotDateTime(slot);
  const label = getModalityLabel(modality);
  const coordination =
    modality === APPOINTMENT_MODALITIES.PHONE_CALL
      ? "El ingeniero responsable se pondra en contacto contigo para confirmar la cita."
      : "El ingeniero responsable se pondra en contacto contigo posteriormente por llamada o mensaje para confirmar la cita y coordinar los detalles de la reunion.";

  return `Perfecto, tu ${label} quedo programada para ${formatted.label}. ${coordination}`;
}

async function finalizeHandoffAfterAppointment({ leadId, conversationId }) {
  await pool.query(
    `
      UPDATE gc_ai_leads
      SET
        status = 'qualified_for_human',
        ai_enabled = FALSE,
        human_takeover = TRUE,
        updated_at = NOW()
      WHERE id = $1
    `,
    [leadId]
  );

  await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        human_takeover = TRUE,
        conversation_owner = 'INGENIERO',
        handoff_finalized_at = COALESCE(handoff_finalized_at, NOW()),
        status = 'open',
        updated_at = NOW()
      WHERE id = $1
    `,
    [conversationId]
  );
}

async function sendAndPersistSchedulingReply({
  lead,
  conversation,
  incoming,
  outgoingProvider,
  replyContent,
  scheduling,
}) {
  const sendResult = await sendAutoReply({
    toPhone: incoming.fromPhone,
    phoneNumberId: incoming.phoneNumberId,
    content: replyContent,
    transport: incoming.transport,
  });
  const outgoingMessage = await saveMessage({
    leadId: lead.id,
    conversationId: conversation.id,
    role: "ai",
    direction: "outgoing",
    content: replyContent,
    messageType: "text",
    externalMessageId: sendResult.whatsappMessageId || null,
    provider: outgoingProvider,
    rawPayload: {
      autoReply: sendResult,
      responseSource: "DETERMINISTIC_SCHEDULING",
      scheduling,
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
    scheduling,
    decision: {
      action: "scheduling",
      reason: scheduling.status,
      leadStatus: lead.status,
      humanTakeover: [
        SCHEDULING_STATUSES.APPOINTMENT_CONFIRMED,
        SCHEDULING_STATUSES.HANDOFF_FINALIZED,
      ].includes(scheduling.status),
      usedAi: false,
    },
    demo: null,
  };
}

async function handleSchedulingFlow({ lead, conversation, incoming, outgoingProvider }) {
  const calendarProvider = getCalendarProvider();
  const state = await getLatestSchedulingState({
    conversationId: conversation.id,
  });
  const status = state.status || "PROFILING";
  let schedulingRecentMessages = null;
  async function getSchedulingRecentMessages() {
    if (!schedulingRecentMessages) {
      schedulingRecentMessages = await getRecentConversationMessages({
        conversationId: conversation.id,
        limit: 12,
      });
    }

    return schedulingRecentMessages;
  }

  if (status !== SCHEDULING_STATUSES.DECLINED) {
    const recentMessages = await getSchedulingRecentMessages();
    const inferredModality = state.modality || inferSchedulingModalityFromLeadMessages(recentMessages);
    const schedulingContext = mergeSchedulingContext(
      inferredModality ? { ...state, modality: inferredModality } : state,
      incoming.content
    );
    const requestedSlot = detectRequestedAppointmentSlot(incoming.content, {
      timeZone: env.googleCalendarTimeZone || "America/Mexico_City",
      modality: schedulingContext.modality,
      location: schedulingContext.location,
    });

    if (requestedSlot && hasUsefulSchedulingContext({ lead, recentMessages })) {
      if (
        schedulingContext.requestedModality === APPOINTMENT_MODALITIES.IN_PERSON &&
        !schedulingContext.location
      ) {
        await logSchedulingState({
          leadId: lead.id,
          conversationId: conversation.id,
          status: SCHEDULING_STATUSES.MODALITY_REQUIRED,
          metadata: {
            requestedSlot,
            modality: null,
            requestedModality: schedulingContext.requestedModality,
            location: null,
          },
        });

        return sendAndPersistSchedulingReply({
          lead,
          conversation,
          incoming,
          outgoingProvider,
          replyContent:
            "Claro, revisamos la reunion presencial. En que ciudad te encuentras? La modalidad presencial esta disponible para Ciudad de Mexico.",
          scheduling: {
            status: SCHEDULING_STATUSES.MODALITY_REQUIRED,
            selectedSlot: requestedSlot,
            modality: null,
            requestedModality: schedulingContext.requestedModality,
            location: null,
          },
        });
      }

      if (!schedulingContext.modality) {
        await logSchedulingState({
          leadId: lead.id,
          conversationId: conversation.id,
          status: SCHEDULING_STATUSES.MODALITY_REQUIRED,
          metadata: {
            requestedSlot,
            modality: null,
            requestedModality: schedulingContext.requestedModality,
            location: schedulingContext.location,
          },
        });

        return sendAndPersistSchedulingReply({
          lead,
          conversation,
          incoming,
          outgoingProvider,
          replyContent:
            "Antes de consultar ese horario, necesito confirmar la modalidad de la reunion: videollamada, llamada telefonica o, si estas en Ciudad de Mexico, reunion presencial. Cual prefieres?",
          scheduling: {
            status: SCHEDULING_STATUSES.MODALITY_REQUIRED,
            selectedSlot: requestedSlot,
            modality: null,
            requestedModality: schedulingContext.requestedModality,
            location: schedulingContext.location,
          },
        });
      }

      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
        metadata: {
          requestedSlot,
          modality: schedulingContext.modality,
          location: schedulingContext.location,
        },
      });

      const slots = await calendarProvider.getAvailableSlots({
        preferredSlot: requestedSlot,
        modality: schedulingContext.modality,
        location: schedulingContext.location,
        conversationId: conversation.id,
        leadId: lead.id,
      });
      const selectedSlot = slots.find((slot) => slot.startsAt === requestedSlot.startsAt);

      if (!selectedSlot) {
        await logSchedulingState({
          leadId: lead.id,
          conversationId: conversation.id,
          status: SCHEDULING_STATUSES.SLOT_OPTIONS_PRESENTED,
          metadata: {
            requestedSlot,
            slots,
            modality: schedulingContext.modality,
            location: schedulingContext.location,
          },
        });

        return sendAndPersistSchedulingReply({
          lead,
          conversation,
          incoming,
          outgoingProvider,
          replyContent: `Ese horario no aparece disponible en calendario. ${buildSlotOptionsReply(
            slots,
            schedulingContext.modality
          )}`,
          scheduling: {
            status: SCHEDULING_STATUSES.SLOT_OPTIONS_PRESENTED,
            requestedSlot,
            slots,
            modality: schedulingContext.modality,
            location: schedulingContext.location,
          },
        });
      }

      const summary = await getConversationSummaryForScheduling({
        conversationId: conversation.id,
        lead,
      });
      let appointment;

      try {
        appointment = await calendarProvider.createAppointment({
          slot: selectedSlot,
          summary,
          modality: schedulingContext.modality,
          location: schedulingContext.location || null,
          idempotencyKey: `${conversation.id}:${lead.id}:${selectedSlot.id}`,
        });
      } catch (error) {
        await logSchedulingState({
          leadId: lead.id,
          conversationId: conversation.id,
          status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
          metadata: {
            requestedSlot,
            errorCode: error.code || "calendar_appointment_failed",
            calendarError: error.details || null,
          },
        });

        return sendAndPersistSchedulingReply({
          lead,
          conversation,
          incoming,
          outgoingProvider,
          replyContent:
            "No pude confirmar ese horario en este momento. La cita no quedo programada. Podemos intentar con otra opcion o retomarlo un poco mas tarde.",
          scheduling: {
            status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
            requestedSlot,
            errorCode: error.code || "calendar_appointment_failed",
          },
        });
      }

      const calendarProviderName = getCalendarProviderName();
      if (!isCalendarBackedAppointmentConfirmed(appointment, calendarProviderName)) {
        await logSchedulingState({
          leadId: lead.id,
          conversationId: conversation.id,
          status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
          metadata: {
            requestedSlot,
            appointment,
            errorCode: "appointment_not_confirmed_for_handoff",
          },
        });

        return sendAndPersistSchedulingReply({
          lead,
          conversation,
          incoming,
          outgoingProvider,
          replyContent:
            "No pude confirmar ese horario en calendario. La cita no quedo programada, asi que seguimos por aqui para intentar con otra opcion.",
          scheduling: {
            status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
            requestedSlot,
            appointment,
            errorCode: "appointment_not_confirmed_for_handoff",
          },
        });
      }

      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.SLOT_SELECTED,
        metadata: {
          selectedSlot,
          modality: appointment.modality,
          location: appointment.location,
        },
      });
      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.APPOINTMENT_CONFIRMED,
        metadata: {
          appointment,
          summary,
          modality: appointment.modality,
          location: appointment.location,
          timeZone: appointment.timeZone || selectedSlot.timeZone || "America/Mexico_City",
          googleCalendarEventId: appointment.googleCalendarEventId || null,
        },
      });
      await finalizeHandoffAfterAppointment({
        leadId: lead.id,
        conversationId: conversation.id,
      });
      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.HANDOFF_FINALIZED,
        metadata: {
          appointmentId: appointment.id,
        },
      });

      return sendAndPersistSchedulingReply({
        lead,
        conversation,
        incoming,
        outgoingProvider,
        replyContent: buildAppointmentConfirmedReply(selectedSlot, appointment.modality),
        scheduling: {
          status: SCHEDULING_STATUSES.APPOINTMENT_CONFIRMED,
          selectedSlot,
          appointment,
          summary,
          modality: appointment.modality,
          location: appointment.location,
          timeZone: appointment.timeZone || selectedSlot.timeZone || "America/Mexico_City",
          googleCalendarEventId: appointment.googleCalendarEventId || null,
        },
      });
    }
  }

  if (
    [
      SCHEDULING_STATUSES.OFFERED,
      SCHEDULING_STATUSES.WAITING_ACCEPTANCE,
      SCHEDULING_STATUSES.MODALITY_REQUIRED,
    ].includes(status)
  ) {
    if (isNegativeSchedulingResponse(incoming.content)) {
      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.DECLINED,
      });

      return sendAndPersistSchedulingReply({
        lead,
        conversation,
        incoming,
        outgoingProvider,
        replyContent:
          "De acuerdo, seguimos con el perfilamiento por aqui. Puedo responder dudas generales con la informacion autorizada sin agendar por ahora.",
        scheduling: {
          status: SCHEDULING_STATUSES.DECLINED,
        },
      });
    }

    if (
      isSchedulingAcceptance(incoming.content) ||
      status === SCHEDULING_STATUSES.MODALITY_REQUIRED ||
      detectAppointmentModality(incoming.content) ||
      detectProspectLocation(incoming.content) ||
      isGenericMeetingRequest(incoming.content)
    ) {
      const modalityCheck = needsSchedulingModalityClarification({
        state,
        message: incoming.content,
      });

      if (modalityCheck.needed) {
        await logSchedulingState({
          leadId: lead.id,
          conversationId: conversation.id,
          status: SCHEDULING_STATUSES.MODALITY_REQUIRED,
          metadata: {
            modality: modalityCheck.context.modality,
            requestedModality: modalityCheck.context.requestedModality,
            location: modalityCheck.context.location,
          },
        });

        return sendAndPersistSchedulingReply({
          lead,
          conversation,
          incoming,
          outgoingProvider,
          replyContent: modalityCheck.reply,
          scheduling: {
            status: SCHEDULING_STATUSES.MODALITY_REQUIRED,
            modality: modalityCheck.context.modality,
            requestedModality: modalityCheck.context.requestedModality,
            location: modalityCheck.context.location,
          },
        });
      }

      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
        metadata: {
          modality: modalityCheck.context.modality,
          location: modalityCheck.context.location,
        },
      });
      const slots = await calendarProvider.getAvailableSlots({
        modality: modalityCheck.context.modality,
        location: modalityCheck.context.location,
        conversationId: conversation.id,
        leadId: lead.id,
      });
      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.SLOT_OPTIONS_PRESENTED,
        metadata: {
          slots,
          modality: modalityCheck.context.modality,
          location: modalityCheck.context.location,
        },
      });

      return sendAndPersistSchedulingReply({
        lead,
        conversation,
        incoming,
        outgoingProvider,
        replyContent: buildSlotOptionsReply(slots, modalityCheck.context.modality),
        scheduling: {
          status: SCHEDULING_STATUSES.SLOT_OPTIONS_PRESENTED,
          slots,
          modality: modalityCheck.context.modality,
          location: modalityCheck.context.location,
        },
      });
    }
  }

  let presentedSlots = status === SCHEDULING_STATUSES.SLOT_OPTIONS_PRESENTED ? state.slots || [] : [];
  const schedulingContext = mergeSchedulingContext(state, incoming.content);

  if (!presentedSlots.length) {
    presentedSlots = await getLatestPresentedSchedulingSlots({
      conversationId: conversation.id,
    });
  }
  const selectedSlot = parseSlotSelection(incoming.content, presentedSlots);

  if (selectedSlot) {
    const summary = await getConversationSummaryForScheduling({
      conversationId: conversation.id,
      lead,
    });
    let appointment;

    try {
      appointment = await calendarProvider.createAppointment({
        slot: selectedSlot,
        summary,
        modality: schedulingContext.modality || selectedSlot.modality || APPOINTMENT_MODALITIES.PHONE_CALL,
        location: schedulingContext.location || selectedSlot.location || null,
        idempotencyKey: `${conversation.id}:${lead.id}:${selectedSlot.id}`,
      });
    } catch (error) {
      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
        metadata: {
          errorCode: error.code || "calendar_appointment_failed",
          calendarError: error.details || null,
        },
      });

      return sendAndPersistSchedulingReply({
        lead,
        conversation,
        incoming,
        outgoingProvider,
        replyContent:
          "No pude confirmar ese horario en este momento. La cita no quedo programada. Podemos intentar con otra opcion o retomarlo un poco mas tarde.",
        scheduling: {
          status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
          errorCode: error.code || "calendar_appointment_failed",
        },
      });
    }
    await logSchedulingState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: SCHEDULING_STATUSES.SLOT_SELECTED,
      metadata: {
        selectedSlot,
        modality: appointment.modality,
        location: appointment.location,
      },
    });
    const calendarProviderName = getCalendarProviderName();
    if (!isCalendarBackedAppointmentConfirmed(appointment, calendarProviderName)) {
      await logSchedulingState({
        leadId: lead.id,
        conversationId: conversation.id,
        status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
        metadata: {
          selectedSlot,
          appointment,
          errorCode: "appointment_not_confirmed_for_handoff",
        },
      });

      return sendAndPersistSchedulingReply({
        lead,
        conversation,
        incoming,
        outgoingProvider,
        replyContent:
          "No pude confirmar ese horario en calendario. La cita no quedo programada, asi que seguimos por aqui para intentar con otra opcion.",
        scheduling: {
          status: SCHEDULING_STATUSES.AVAILABILITY_REQUIRED,
          selectedSlot,
          appointment,
          errorCode: "appointment_not_confirmed_for_handoff",
        },
      });
    }
    await logSchedulingState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: SCHEDULING_STATUSES.APPOINTMENT_CONFIRMED,
      metadata: {
        appointment,
        summary,
        modality: appointment.modality,
        location: appointment.location,
        timeZone: appointment.timeZone || selectedSlot.timeZone || "America/Mexico_City",
        googleCalendarEventId: appointment.googleCalendarEventId || null,
      },
    });
    await finalizeHandoffAfterAppointment({
      leadId: lead.id,
      conversationId: conversation.id,
    });
    await logSchedulingState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: SCHEDULING_STATUSES.HANDOFF_FINALIZED,
      metadata: {
        appointmentId: appointment.id,
      },
    });

    return sendAndPersistSchedulingReply({
      lead,
      conversation,
      incoming,
      outgoingProvider,
      replyContent: buildAppointmentConfirmedReply(selectedSlot, appointment.modality),
      scheduling: {
        status: SCHEDULING_STATUSES.APPOINTMENT_CONFIRMED,
        selectedSlot,
        appointment,
        summary,
        modality: appointment.modality,
        location: appointment.location,
        timeZone: appointment.timeZone || selectedSlot.timeZone || "America/Mexico_City",
        googleCalendarEventId: appointment.googleCalendarEventId || null,
      },
    });
  }

  const recentMessages = await getRecentConversationMessages({
    conversationId: conversation.id,
    limit: 12,
  });

  if (
    status !== SCHEDULING_STATUSES.DECLINED &&
    /me interesa|sigamos|siguiente paso|quiero avanzar|proceder|continuar/i.test(incoming.content) &&
    hasUsefulSchedulingContext({ lead, recentMessages })
  ) {
    await logSchedulingState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: SCHEDULING_STATUSES.READY_TO_OFFER,
    });
    await logSchedulingState({
      leadId: lead.id,
      conversationId: conversation.id,
      status: SCHEDULING_STATUSES.OFFERED,
    });

    return sendAndPersistSchedulingReply({
      lead,
      conversation,
      incoming,
      outgoingProvider,
      replyContent: buildSchedulingOfferReply(),
      scheduling: {
        status: SCHEDULING_STATUSES.OFFERED,
      },
    });
  }

  return null;
}

async function registerEngineerContactRequest({ leadId, conversationId }) {
  await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        handoff_contact_requested_at = COALESCE(handoff_contact_requested_at, NOW()),
        conversation_owner = 'INGENIERO',
        human_takeover = TRUE,
        handoff_finalized_at = COALESCE(handoff_finalized_at, NOW()),
        updated_at = NOW()
      WHERE id = $1
    `,
    [conversationId]
  );

  await pool.query(
    `
      INSERT INTO gc_ai_activity_logs (
        id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, 'handoff_contact_requested', 'gc_ai_conversation', $2, $3::jsonb)
    `,
    [
      createId("activity"),
      conversationId,
      JSON.stringify({
        leadId,
        channel: "whatsapp",
      }),
    ]
  );
}

async function incrementPostHandoffInteractionCount({ conversationId }) {
  const result = await pool.query(
    `
      UPDATE gc_ai_conversations
      SET
        post_handoff_interaction_count = LEAST(post_handoff_interaction_count + 1, $2),
        updated_at = NOW()
      WHERE id = $1
      RETURNING post_handoff_interaction_count
    `,
    [conversationId, POST_HANDOFF_MAX_AUTO_REPLIES]
  );

  return result.rows[0]?.post_handoff_interaction_count || POST_HANDOFF_MAX_AUTO_REPLIES;
}

async function handlePostHandoffInbound({ lead, conversation, incoming }) {
  const currentCount = Number(conversation.post_handoff_interaction_count || 0);

  if (currentCount >= POST_HANDOFF_MAX_AUTO_REPLIES) {
    return {
      processed: true,
      leadId: lead.id,
      conversationId: conversation.id,
      postHandoff: true,
      autoReply: {
        sent: false,
        reason: "post_handoff_auto_reply_limit_reached",
      },
    };
  }

  const nextCount = await incrementPostHandoffInteractionCount({
    conversationId: conversation.id,
  });
  let replyContent = POST_HANDOFF_BOUNDARY_MESSAGE;
  let contactRequested = false;

  if (nextCount >= POST_HANDOFF_MAX_AUTO_REPLIES) {
    replyContent = POST_HANDOFF_FINAL_MESSAGE;
  } else if (currentCount === 0) {
    replyContent = POST_HANDOFF_CONTACT_QUESTION;
  } else if (isAffirmativeContactRequest(incoming.content)) {
    contactRequested = true;
    replyContent = POST_HANDOFF_CONTACT_CONFIRMATION;
    await registerEngineerContactRequest({
      leadId: lead.id,
      conversationId: conversation.id,
    });
  }

  const sendResult = await sendAutoReply({
    toPhone: incoming.fromPhone,
    phoneNumberId: incoming.phoneNumberId,
    content: replyContent,
    transport: incoming.transport,
  });

  const outgoingMessage = await saveMessage({
    leadId: lead.id,
    conversationId: conversation.id,
    role: "ai",
    direction: "outgoing",
    content: replyContent,
    messageType: "text",
    externalMessageId: sendResult.whatsappMessageId || null,
    provider: getOutgoingProvider(incoming),
    rawPayload: {
      autoReply: sendResult,
      responseSource: "DETERMINISTIC_HANDOFF",
      postHandoff: {
        contactRequested,
        interactionCount: nextCount,
      },
    },
  });

  return {
    processed: true,
    leadId: lead.id,
    conversationId: conversation.id,
    outgoingMessageId: outgoingMessage.id,
    postHandoff: true,
    contactRequested,
    autoReply: {
      sent: Boolean(sendResult.sent),
      status: sendResult.status || null,
      reason: sendResult.reason || null,
    },
  };
}

async function sendAutoReply({ toPhone, phoneNumberId, content, transport = "whatsapp" }) {
  if (transport === "simulator") {
    return {
      sent: true,
      status: "simulator_captured",
      whatsappMessageId: createId("sim-out"),
      simulator: true,
    };
  }

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

  const incomingProvider = getIncomingProvider(incoming);
  const outgoingProvider = getOutgoingProvider(incoming);
  const ownerIdentity = getOwnerIdentity(incoming.fromPhone);

  if (ownerIdentity.isOwner) {
    return handleOwnerInbound({
      incoming,
      incomingProvider,
      outgoingProvider,
      ownerIdentity,
    });
  }

  const duplicateInboundMessage = await findMessageByProviderMessageId({
    provider: incomingProvider,
    providerMessageId: incoming.whatsappMessageId,
  });

  if (duplicateInboundMessage) {
    console.info("whatsapp_agent_duplicate_inbound_message", {
      provider: incomingProvider,
      duplicate: true,
    });

    return {
      processed: true,
      duplicate: true,
      reason: "duplicate_provider_message_id",
      autoReply: {
        sent: false,
        reason: "duplicate_provider_message_id",
      },
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
      transport: incoming.transport,
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

  const inboundMessage = await saveMessage({
    leadId: lead.id,
    conversationId: conversation.id,
    role: "lead",
    direction: "incoming",
    content: incoming.content,
    messageType: incoming.messageType,
    externalMessageId: incoming.whatsappMessageId,
    rawPayload: incoming.rawPayload,
    provider: getIncomingProvider(incoming),
  });

  if (inboundMessage.duplicate) {
    console.info("whatsapp_agent_duplicate_inbound_message", {
      provider: incomingProvider,
      duplicate: true,
      raceDetected: true,
    });

    return {
      processed: true,
      duplicate: true,
      reason: "duplicate_provider_message_id",
      autoReply: {
        sent: false,
        reason: "duplicate_provider_message_id",
      },
    };
  }

  if (isTransferredConversation(conversation, lead)) {
    return handlePostHandoffInbound({
      lead,
      conversation,
      incoming,
    });
  }

  const scopeResult = await handleScopeGuard({
    lead,
    conversation,
    incoming,
    outgoingProvider,
  });

  if (scopeResult) {
    return scopeResult;
  }

  if (conversation.demo_mode) {
    if (demoModeService.isDemoExpired(conversation)) {
      await demoModeService.finishDemo({
        leadId: lead.id,
        reason: "expired",
      });

      const replyContent =
        "La demo ya expiro. Si quieres continuar, el ingeniero responsable puede volver a activarla o darle seguimiento a tu caso.";
      const sendResult = await sendAutoReply({
        toPhone: incoming.fromPhone,
        phoneNumberId: incoming.phoneNumberId,
        content: replyContent,
        transport: incoming.transport,
      });

      await saveMessage({
        leadId: lead.id,
        conversationId: conversation.id,
        role: "ai",
        direction: "outgoing",
        content: replyContent,
        messageType: "text",
        externalMessageId: sendResult.whatsappMessageId || null,
        provider: outgoingProvider,
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
        "La demo llego al limite de preguntas. Voy a dejar tu caso listo para seguimiento con el ingeniero responsable.";
      const sendResult = await sendAutoReply({
        toPhone: incoming.fromPhone,
        phoneNumberId: incoming.phoneNumberId,
        content: replyContent,
        transport: incoming.transport,
      });

      await saveMessage({
        leadId: lead.id,
        conversationId: conversation.id,
        role: "ai",
        direction: "outgoing",
        content: replyContent,
        messageType: "text",
        externalMessageId: sendResult.whatsappMessageId || null,
        provider: outgoingProvider,
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

  const schedulingResult = await handleSchedulingFlow({
    lead,
    conversation,
    incoming,
    outgoingProvider,
  });

  if (schedulingResult) {
    return schedulingResult;
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
  const shouldUseSimulatorMock = isSimulatorMockMode(incoming);
  const simulatorMockHistory =
    shouldUseSimulatorMock
      ? await getRecentConversationMessages({ conversationId: conversation.id })
      : [];

  if (
    shouldUseSimulatorMock &&
    !decision.shouldUseAi &&
    isSimulatorContextualFollowup(incoming.content)
  ) {
    aiResult = createSimulatorMockAiResult({
      incoming,
      decision,
      lead,
      recentMessages: simulatorMockHistory,
    });
    replyContent = aiResult.reply;
    if (
      shouldPreventAiSchedulingHandoff({
        incoming,
        aiResult,
        recentMessages: simulatorMockHistory,
      })
    ) {
      aiResult = {
        ...aiResult,
        shouldTransferToHuman: false,
        leadStatus: aiResult.leadStatus || lead.status || "ai_profiling",
        nextSuggestedAction: "Continuar agenda sin handoff hasta confirmar cita",
      };
    }

    await applyAiResultToLead({
      leadId: lead.id,
      conversationId: conversation.id,
      aiResult,
    });
  } else if (decision.shouldUseAi) {
    try {
      aiResult = shouldUseSimulatorMock
        ? createSimulatorMockAiResult({
            incoming,
            decision,
            lead,
            recentMessages: simulatorMockHistory,
          })
        : await aiAgentService.generateProfilingResponse({
            lead,
            conversation,
            incomingMessage: incoming.content,
            reason: decision.reason,
          });
      replyContent = aiResult.reply;
      if (shouldPreventAiSchedulingHandoff({
        incoming,
        aiResult,
        recentMessages: shouldUseSimulatorMock
          ? simulatorMockHistory
          : await getRecentConversationMessages({ conversationId: conversation.id, limit: 12 }),
      })) {
        aiResult = {
          ...aiResult,
          shouldTransferToHuman: false,
          leadStatus: aiResult.leadStatus || lead.status || "ai_profiling",
          nextSuggestedAction: "Continuar agenda sin handoff hasta confirmar cita",
        };
      }

      await applyAiResultToLead({
        leadId: lead.id,
        conversationId: conversation.id,
        aiResult,
      });

      if (!shouldUseSimulatorMock && aiResult && !aiResult.skipped) {
        await logScopeMetric({
          leadId: lead.id,
          conversationId: conversation.id,
          event: "openai_call",
          metadata: {
            reason: decision.reason,
          },
        });
      }
    } catch (error) {
      replyContent =
        "Gracias por contarme. En este momento voy a pasar tu caso con el ingeniero responsable para que pueda orientarte mejor sin perder el contexto.";
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

  replyContent = withMaluIntroduction(replyContent, conversation);
  if (!isPriceQuestion(incoming.content)) {
    replyContent = stripUnrequestedPriceReferences(replyContent) || replyContent;
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
    transport: incoming.transport,
  });

  const outgoingMessage = await saveMessage({
    leadId: lead.id,
    conversationId: conversation.id,
    role: "ai",
    direction: "outgoing",
    content: replyContent,
    messageType: "text",
    externalMessageId: sendResult.whatsappMessageId || null,
    provider: outgoingProvider,
    rawPayload: {
      autoReply: sendResult,
      responseSource: aiResult
        ? shouldUseSimulatorMock
          ? "MOCK"
          : aiResult.skipped
            ? "FALLBACK"
            : "LIVE_AI"
        : "DETERMINISTIC_INTENT",
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

async function processSimulatorInbound({
  sessionId,
  text,
  messageId,
  phone,
  profileName = "Usuario de prueba",
  mode = "MOCK",
}) {
  const normalizedText = String(text || "");
  const normalizedMode = mode === "LIVE_AI" ? "LIVE_AI" : "MOCK";

  return processIncomingMessage({
    whatsappMessageId: messageId || createId("sim-in"),
    fromPhone: normalizePhone(phone),
    contactName: profileName,
    phoneNumberId: "simulator-phone-number-id",
    messageType: "text",
    content: normalizedText,
    provider: SIMULATOR_PROVIDER,
    transport: "simulator",
    simulationMode: normalizedMode,
    rawPayload: {
      simulator: true,
      sessionId,
      mode: normalizedMode,
    },
  });
}

module.exports = {
  extractIncomingMessages,
  processWebhookPayload,
  processSimulatorInbound,
};
