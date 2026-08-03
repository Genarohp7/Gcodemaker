const env = require("../config/env");
const { pool } = require("../db");

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MX_TIMEZONE = "America/Mexico_City";

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function resolvePeriod(query = {}, now = new Date()) {
  const period = query.period || "last_30_days";

  if (period === "custom" && query.from && query.to) {
    const from = startOfDay(new Date(`${query.from}T00:00:00`));
    const to = addDays(startOfDay(new Date(`${query.to}T00:00:00`)), 1);
    return {
      key: "custom",
      label: "Rango personalizado",
      from,
      to,
      previousFrom: new Date(from.getTime() - (to.getTime() - from.getTime())),
      previousTo: from,
    };
  }

  const today = startOfDay(now);
  const definitions = {
    today: {
      label: "Hoy",
      from: today,
      to: addDays(today, 1),
    },
    last_7_days: {
      label: "Ultimos 7 dias",
      from: addDays(today, -6),
      to: addDays(today, 1),
    },
    last_30_days: {
      label: "Ultimos 30 dias",
      from: addDays(today, -29),
      to: addDays(today, 1),
    },
    current_month: {
      label: "Mes actual",
      from: startOfMonth(now),
      to: addMonths(startOfMonth(now), 1),
    },
    previous_month: {
      label: "Mes anterior",
      from: addMonths(startOfMonth(now), -1),
      to: startOfMonth(now),
    },
  };

  const selected = definitions[period] || definitions.last_30_days;
  const duration = selected.to.getTime() - selected.from.getTime();

  return {
    key: definitions[period] ? period : "last_30_days",
    label: selected.label,
    from: selected.from,
    to: selected.to,
    previousFrom: new Date(selected.from.getTime() - duration),
    previousTo: selected.from,
  };
}

function formatPeriod(period) {
  return {
    key: period.key,
    label: period.label,
    from: toIsoDate(period.from),
    to: toIsoDate(addDays(period.to, -1)),
    timezone: MX_TIMEZONE,
  };
}

function toNumber(value) {
  return Number(value || 0);
}

function percentage(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Number(((Number(numerator) / Number(denominator)) * 100).toFixed(1));
}

function variation(current, previous) {
  if (!previous && !current) {
    return 0;
  }

  if (!previous) {
    return 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function sanitizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "Sin telefono";
  }

  return `***${digits.slice(-4)}`;
}

function hasProfile(row) {
  return Boolean(
    row.business_type ||
      row.business_name ||
      row.project_need ||
      row.objective ||
      row.summary ||
      row.service_interest ||
      ["partially_profiled", "qualified_for_human"].includes(row.lead_status)
  );
}

function hasInterest(row) {
  return Boolean(
    row.interest_level === "high" ||
      row.interest_level === "medium" ||
      row.lead_status === "qualified_for_human" ||
      row.price_question ||
      row.confirmed_appointments > 0 ||
      row.conversation_owner === "INGENIERO" ||
      row.handoff_finalized_at
  );
}

function isTransferred(row) {
  return row.conversation_owner === "INGENIERO" || Boolean(row.handoff_finalized_at);
}

function isEarlyAbandonment(row) {
  return !hasProfile(row) && toNumber(row.inbound_count) <= 1;
}

function getAbandonmentStage(row) {
  if (row.confirmed_appointments > 0 || isTransferred(row)) {
    return null;
  }

  if (isEarlyAbandonment(row)) {
    return "only_greeted";
  }

  if (!hasProfile(row)) {
    return "profiling";
  }

  if (row.price_question && !hasInterest(row)) {
    return "price_no_advance";
  }

  if (hasInterest(row)) {
    return "interested_no_schedule";
  }

  if (row.service_interest || row.project_need) {
    return "service_known";
  }

  return "other";
}

function classifyConversation(row) {
  if (row.confirmed_appointments > 0) {
    return "Cita";
  }

  if (isTransferred(row)) {
    return "Transferido";
  }

  if (hasInterest(row)) {
    return "Interesado";
  }

  if (hasProfile(row)) {
    return "Perfilado";
  }

  if (getAbandonmentStage(row)) {
    return "Abandonado";
  }

  return "Nuevo";
}

function buildExecutiveSummary(metrics, periodLabel) {
  return `Durante ${periodLabel.toLowerCase()}, Malu atendio ${metrics.conversationsStarted} conversaciones. ${metrics.profiledLeads} prospectos fueron perfilados, ${metrics.interestedLeads} mostraron interes y ${metrics.confirmedAppointments} agendaron una cita. ${metrics.transferredLeads} conversaciones fueron transferidas al ingeniero. La conversion de conversacion a cita fue de ${metrics.conversationToAppointmentRate}%.`;
}

function normalizeRow(row) {
  return {
    ...row,
    inbound_count: toNumber(row.inbound_count),
    outbound_count: toNumber(row.outbound_count),
    message_count: toNumber(row.message_count),
    confirmed_appointments: toNumber(row.confirmed_appointments),
    cancelled_appointments: toNumber(row.cancelled_appointments),
    usage_calls: toNumber(row.usage_calls),
    tokens_input: toNumber(row.tokens_input),
    tokens_output: toNumber(row.tokens_output),
    estimated_cost: Number(row.estimated_cost || 0),
    price_question: Boolean(row.price_question),
  };
}

function mapConversation(row) {
  const normalized = normalizeRow(row);
  const stage = classifyConversation(normalized);

  return {
    id: normalized.conversation_id,
    leadId: normalized.lead_id,
    createdAt: normalized.conversation_created_at,
    updatedAt: normalized.conversation_updated_at,
    lastActivityAt: normalized.last_activity_at,
    prospect: normalized.lead_name || "Prospecto sin nombre",
    phone: sanitizePhone(normalized.phone),
    businessName: normalized.business_name || "Sin negocio",
    businessType: normalized.business_type || "Sin giro",
    projectNeed: normalized.project_need || normalized.objective || "Sin necesidad registrada",
    serviceInterest: normalized.service_interest || "Sin servicio detectado",
    leadStatus: normalized.lead_status || "open",
    interestLevel: normalized.interest_level || "unknown",
    stage,
    owner: normalized.conversation_owner || "MALU",
    humanTakeover: Boolean(normalized.human_takeover || normalized.handoff_finalized_at),
    handoffFinalizedAt: normalized.handoff_finalized_at,
    messageCount: normalized.message_count,
    inboundCount: normalized.inbound_count,
    outboundCount: normalized.outbound_count,
    hasAppointment: normalized.confirmed_appointments > 0,
    appointmentStatus: normalized.latest_appointment_status || null,
    appointmentStartsAt: normalized.latest_appointment_starts_at || null,
    modality: normalized.latest_appointment_modality || null,
    googleEventPresent: Boolean(normalized.google_event_present),
    abandonedStage: getAbandonmentStage(normalized),
    openAiCalls: normalized.usage_calls,
    tokens: normalized.tokens_input + normalized.tokens_output,
    estimatedCost: Number(normalized.estimated_cost.toFixed(6)),
  };
}

function mapAppointment(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    leadId: row.lead_id,
    prospect: row.lead_name || "Prospecto sin nombre",
    businessName: row.business_name || "Sin negocio",
    serviceInterest: row.service_interest || "Sin servicio detectado",
    status: row.status,
    modality: row.modality || "Sin modalidad",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    engineerTimezone: row.engineer_timezone || MX_TIMEZONE,
    googleEventPresent: Boolean(row.google_calendar_event_id),
    createdAt: row.created_at,
  };
}

function buildActivity(conversations, appointments) {
  const events = [];

  conversations.forEach((conversation) => {
    events.push({
      id: `conversation-${conversation.id}`,
      type: "conversation_started",
      label: "Nueva conversacion",
      detail: conversation.businessName,
      createdAt: conversation.createdAt,
    });

    if (conversation.hasAppointment) {
      events.push({
        id: `appointment-${conversation.id}`,
        type: "appointment_confirmed",
        label: "Cita confirmada",
        detail: conversation.prospect,
        createdAt: conversation.appointmentStartsAt,
      });
    }

    if (conversation.handoffFinalizedAt) {
      events.push({
        id: `handoff-${conversation.id}`,
        type: "handoff",
        label: "Transferido al ingeniero",
        detail: conversation.prospect,
        createdAt: conversation.handoffFinalizedAt,
      });
    }
  });

  appointments
    .filter((appointment) => appointment.status === "CANCELLED")
    .forEach((appointment) => {
      events.push({
        id: `appointment-cancelled-${appointment.id}`,
        type: "appointment_cancelled",
        label: "Cita cancelada",
        detail: appointment.prospect,
        createdAt: appointment.createdAt,
      });
    });

  return events
    .filter((event) => event.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 12);
}

function buildTimeline(conversations, period) {
  const byDate = new Map();
  const cursor = new Date(period.from);

  while (cursor < period.to) {
    const key = toIsoDate(cursor);
    byDate.set(key, {
      date: key,
      conversations: 0,
      interested: 0,
      appointments: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  conversations.forEach((conversation) => {
    const key = toIsoDate(new Date(conversation.createdAt));
    const bucket = byDate.get(key);

    if (!bucket) {
      return;
    }

    bucket.conversations += 1;

    if (["Interesado", "Cita", "Transferido"].includes(conversation.stage)) {
      bucket.interested += 1;
    }

    if (conversation.hasAppointment) {
      bucket.appointments += 1;
    }
  });

  return Array.from(byDate.values());
}

function buildFunnel(metrics) {
  const steps = [
    ["Conversaciones", metrics.conversationsStarted],
    ["Perfilados", metrics.profiledLeads],
    ["Interesados", metrics.interestedLeads],
    ["Citas", metrics.confirmedAppointments],
    ["Transferidos", metrics.transferredLeads],
  ];

  return steps.map(([label, value], index) => {
    const previous = index === 0 ? value : steps[index - 1][1];
    return {
      label,
      value,
      previousConversionRate: index === 0 ? 100 : percentage(value, previous),
      globalConversionRate: percentage(value, steps[0][1]),
    };
  });
}

function buildAbandonment(conversations) {
  const labels = {
    only_greeted: "Solo saludo",
    profiling: "Abandono durante perfilamiento",
    service_known: "Llego a conocer el servicio",
    price_no_advance: "Pregunto precio pero no avanzo",
    interested_no_schedule: "Mostro interes pero no agendo",
    other: "Otros/no clasificado",
  };
  const counts = Object.keys(labels).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

  conversations.forEach((conversation) => {
    if (conversation.abandonedStage) {
      counts[conversation.abandonedStage] += 1;
    }
  });

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return Object.entries(labels)
    .map(([key, label]) => ({
      key,
      label,
      value: counts[key],
      percentage: percentage(counts[key], total),
    }))
    .filter((item) => item.value > 0);
}

function buildOverviewModel({ rows = [], previousRows = [], appointments = [], period }) {
  const conversations = rows.map(mapConversation);
  const previousConversations = previousRows.map(mapConversation);
  const appointmentsMapped = appointments.map(mapAppointment);

  const metrics = {
    conversationsStarted: conversations.length,
    profiledLeads: conversations.filter((item) => ["Perfilado", "Interesado", "Cita", "Transferido"].includes(item.stage)).length,
    interestedLeads: conversations.filter((item) => ["Interesado", "Cita", "Transferido"].includes(item.stage)).length,
    transferredLeads: conversations.filter((item) => item.owner === "INGENIERO" || item.handoffFinalizedAt).length,
    confirmedAppointments: appointmentsMapped.filter((item) => item.status === "CONFIRMED").length,
    cancelledAppointments: appointmentsMapped.filter((item) => item.status === "CANCELLED").length,
    abandonments: conversations.filter((item) => item.abandonedStage).length,
    messagesReceived: conversations.reduce((sum, item) => sum + item.inboundCount, 0),
    messagesSent: conversations.reduce((sum, item) => sum + item.outboundCount, 0),
    openAiCalls: conversations.reduce((sum, item) => sum + item.openAiCalls, 0),
    inputTokens: rows.reduce((sum, row) => sum + toNumber(row.tokens_input), 0),
    outputTokens: rows.reduce((sum, row) => sum + toNumber(row.tokens_output), 0),
    estimatedOpenAiCost: Number(conversations.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(6)),
  };

  metrics.totalTokens = metrics.inputTokens + metrics.outputTokens;
  metrics.conversationToInterestRate = percentage(metrics.interestedLeads, metrics.conversationsStarted);
  metrics.conversationToAppointmentRate = percentage(metrics.confirmedAppointments, metrics.conversationsStarted);
  metrics.conversationToHandoffRate = percentage(metrics.transferredLeads, metrics.conversationsStarted);

  const previousMetrics = {
    conversationsStarted: previousConversations.length,
    profiledLeads: previousConversations.filter((item) => ["Perfilado", "Interesado", "Cita", "Transferido"].includes(item.stage)).length,
    interestedLeads: previousConversations.filter((item) => ["Interesado", "Cita", "Transferido"].includes(item.stage)).length,
    confirmedAppointments: previousConversations.filter((item) => item.hasAppointment).length,
    transferredLeads: previousConversations.filter((item) => item.owner === "INGENIERO" || item.handoffFinalizedAt).length,
  };

  return {
    period: formatPeriod(period),
    metrics,
    variations: {
      conversationsStarted: variation(metrics.conversationsStarted, previousMetrics.conversationsStarted),
      profiledLeads: variation(metrics.profiledLeads, previousMetrics.profiledLeads),
      interestedLeads: variation(metrics.interestedLeads, previousMetrics.interestedLeads),
      confirmedAppointments: variation(metrics.confirmedAppointments, previousMetrics.confirmedAppointments),
      transferredLeads: variation(metrics.transferredLeads, previousMetrics.transferredLeads),
    },
    timeline: buildTimeline(conversations, period),
    funnel: buildFunnel(metrics),
    abandonment: buildAbandonment(conversations),
    recentActivity: buildActivity(conversations, appointmentsMapped),
    executiveSummary: buildExecutiveSummary(metrics, period.label),
  };
}

function getPagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function getSearchParams(query = {}) {
  const search = String(query.search || "").trim();
  return search ? `%${search}%` : null;
}

function getBaseConversationSql({ countOnly = false } = {}) {
  return `
    WITH message_stats AS (
      SELECT
        conversation_id,
        COUNT(*)::int AS message_count,
        COUNT(*) FILTER (WHERE role = 'lead')::int AS inbound_count,
        COUNT(*) FILTER (WHERE role = 'ai')::int AS outbound_count,
        MAX(created_at) AS last_activity_at,
        BOOL_OR(content ILIKE '%precio%' OR content ILIKE '%costo%' OR content ILIKE '%cuanto cuesta%' OR content ILIKE '%mensualidad%' OR content ILIKE '%inversion%') AS price_question
      FROM gc_ai_messages
      GROUP BY conversation_id
    ),
    appointment_stats AS (
      SELECT
        conversation_id,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED')::int AS confirmed_appointments,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_appointments,
        (ARRAY_AGG(status ORDER BY created_at DESC))[1] AS latest_appointment_status,
        (ARRAY_AGG(starts_at ORDER BY created_at DESC))[1] AS latest_appointment_starts_at,
        (ARRAY_AGG(modality ORDER BY created_at DESC))[1] AS latest_appointment_modality,
        BOOL_OR(google_calendar_event_id IS NOT NULL) AS google_event_present
      FROM gc_ai_calendar_appointments
      GROUP BY conversation_id
    ),
    usage_stats AS (
      SELECT
        conversation_id,
        COUNT(*)::int AS usage_calls,
        COALESCE(SUM(tokens_input), 0)::int AS tokens_input,
        COALESCE(SUM(tokens_output), 0)::int AS tokens_output,
        COALESCE(SUM(estimated_cost), 0)::numeric AS estimated_cost
      FROM gc_ai_usage_logs
      GROUP BY conversation_id
    ),
    base AS (
      SELECT
        c.id AS conversation_id,
        c.lead_id,
        c.created_at AS conversation_created_at,
        c.updated_at AS conversation_updated_at,
        c.status AS conversation_status,
        c.conversation_owner,
        c.human_takeover,
        c.handoff_finalized_at,
        c.demo_mode,
        c.conversation_scope_status,
        l.name AS lead_name,
        l.phone,
        l.source,
        l.status AS lead_status,
        l.interest_level,
        l.service_interest,
        l.created_at AS lead_created_at,
        p.business_type,
        p.business_name,
        p.project_need,
        p.objective,
        p.summary,
        COALESCE(ms.message_count, 0) AS message_count,
        COALESCE(ms.inbound_count, 0) AS inbound_count,
        COALESCE(ms.outbound_count, 0) AS outbound_count,
        COALESCE(ms.last_activity_at, c.updated_at) AS last_activity_at,
        COALESCE(ms.price_question, false) AS price_question,
        COALESCE(ap.confirmed_appointments, 0) AS confirmed_appointments,
        COALESCE(ap.cancelled_appointments, 0) AS cancelled_appointments,
        ap.latest_appointment_status,
        ap.latest_appointment_starts_at,
        ap.latest_appointment_modality,
        COALESCE(ap.google_event_present, false) AS google_event_present,
        COALESCE(us.usage_calls, 0) AS usage_calls,
        COALESCE(us.tokens_input, 0) AS tokens_input,
        COALESCE(us.tokens_output, 0) AS tokens_output,
        COALESCE(us.estimated_cost, 0) AS estimated_cost
      FROM gc_ai_conversations c
      INNER JOIN gc_ai_leads l ON l.id = c.lead_id
      LEFT JOIN gc_ai_lead_profiles p ON p.lead_id = l.id
      LEFT JOIN message_stats ms ON ms.conversation_id = c.id
      LEFT JOIN appointment_stats ap ON ap.conversation_id = c.id
      LEFT JOIN usage_stats us ON us.conversation_id = c.id
      WHERE c.created_at >= $1
        AND c.created_at < $2
        AND COALESCE(l.source, '') NOT IN ('simulator', 'owner')
        AND COALESCE(c.demo_mode, false) = false
    )
    ${countOnly ? "SELECT COUNT(*)::int AS total FROM base WHERE ($3::text IS NULL OR lead_name ILIKE $3 OR phone ILIKE $3 OR business_name ILIKE $3)" : "SELECT * FROM base WHERE ($3::text IS NULL OR lead_name ILIKE $3 OR phone ILIKE $3 OR business_name ILIKE $3)"}
  `;
}

async function getConversationRows(period, { search = null, limit = null, offset = null } = {}) {
  const sql = `${getBaseConversationSql()} ORDER BY last_activity_at DESC${limit ? " LIMIT $4 OFFSET $5" : ""}`;
  const params = [period.from, period.to, search];

  if (limit) {
    params.push(limit, offset || 0);
  }

  const result = await pool.query(sql, params);
  return result.rows;
}

async function getConversationCount(period, search = null) {
  const result = await pool.query(getBaseConversationSql({ countOnly: true }), [
    period.from,
    period.to,
    search,
  ]);
  return toNumber(result.rows[0]?.total);
}

async function getAppointmentRows(period) {
  const result = await pool.query(
    `
      SELECT
        a.*,
        l.name AS lead_name,
        l.service_interest,
        p.business_name
      FROM gc_ai_calendar_appointments a
      LEFT JOIN gc_ai_leads l ON l.id = a.lead_id
      LEFT JOIN gc_ai_lead_profiles p ON p.lead_id = l.id
      LEFT JOIN gc_ai_conversations c ON c.id = a.conversation_id
      WHERE a.created_at >= $1
        AND a.created_at < $2
        AND COALESCE(l.source, '') NOT IN ('simulator', 'owner')
        AND COALESCE(c.demo_mode, false) = false
      ORDER BY a.starts_at ASC
    `,
    [period.from, period.to]
  );

  return result.rows;
}

async function getDashboardOverview(query = {}) {
  const period = resolvePeriod(query);
  const [rows, previousRows, appointments] = await Promise.all([
    getConversationRows(period),
    getConversationRows({ from: period.previousFrom, to: period.previousTo }),
    getAppointmentRows(period),
  ]);

  return buildOverviewModel({
    rows,
    previousRows,
    appointments,
    period,
  });
}

function filterConversation(conversation, filter) {
  if (!filter || filter === "all") {
    return true;
  }

  const map = {
    active: !conversation.handoffFinalizedAt && !conversation.hasAppointment,
    profiled: ["Perfilado", "Interesado", "Cita", "Transferido"].includes(conversation.stage),
    interested: ["Interesado", "Cita", "Transferido"].includes(conversation.stage),
    appointment: conversation.hasAppointment,
    handoff: conversation.owner === "INGENIERO" || Boolean(conversation.handoffFinalizedAt),
    abandoned: Boolean(conversation.abandonedStage),
  };

  return Boolean(map[filter]);
}

async function getDashboardConversations(query = {}) {
  const period = resolvePeriod(query);
  const pagination = getPagination(query);
  const search = getSearchParams(query);
  const rows = await getConversationRows(period, {
    search,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  const total = await getConversationCount(period, search);
  const conversations = rows.map(mapConversation).filter((item) => filterConversation(item, query.filter));

  return {
    period: formatPeriod(period),
    conversations,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
    },
  };
}

async function getDashboardConversationDetail(conversationId) {
  const period = {
    from: new Date("2000-01-01T00:00:00.000Z"),
    to: new Date("2100-01-01T00:00:00.000Z"),
  };
  const rows = await getConversationRows(period);
  const conversation = rows.map(mapConversation).find((item) => item.id === conversationId);

  if (!conversation) {
    return null;
  }

  const [messagesResult, appointmentsResult] = await Promise.all([
    pool.query(
      `
        SELECT id, role, content, provider, message_type, tokens_input, tokens_output, estimated_cost, created_at
        FROM gc_ai_messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
      `,
      [conversationId]
    ),
    pool.query(
      `
        SELECT *
        FROM gc_ai_calendar_appointments
        WHERE conversation_id = $1
        ORDER BY created_at DESC
      `,
      [conversationId]
    ),
  ]);

  return {
    conversation,
    messages: messagesResult.rows.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      provider: message.provider,
      messageType: message.message_type,
      tokensInput: toNumber(message.tokens_input),
      tokensOutput: toNumber(message.tokens_output),
      estimatedCost: Number(message.estimated_cost || 0),
      createdAt: message.created_at,
    })),
    appointments: appointmentsResult.rows.map((appointment) => ({
      id: appointment.id,
      status: appointment.status,
      modality: appointment.modality,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
      engineerTimezone: appointment.engineer_timezone || MX_TIMEZONE,
      googleEventPresent: Boolean(appointment.google_calendar_event_id),
      googleMeetPresent: Boolean(appointment.google_meet_link),
    })),
  };
}

async function getDashboardLeads(query = {}) {
  const conversations = await getDashboardConversations(query);

  return {
    period: conversations.period,
    leads: conversations.conversations.map((conversation) => ({
      id: conversation.leadId,
      name: conversation.prospect,
      phone: conversation.phone,
      businessName: conversation.businessName,
      businessType: conversation.businessType,
      need: conversation.projectNeed,
      recommendedProduct: conversation.serviceInterest,
      status: conversation.leadStatus,
      interestLevel: conversation.interestLevel,
      stage: conversation.stage,
      owner: conversation.owner,
      hasAppointment: conversation.hasAppointment,
      createdAt: conversation.createdAt,
      lastActivityAt: conversation.lastActivityAt,
    })),
    pagination: conversations.pagination,
  };
}

async function getDashboardAppointments(query = {}) {
  const period = resolvePeriod(query);
  const rows = await getAppointmentRows(period);
  const appointments = rows.map(mapAppointment);

  return {
    period: formatPeriod(period),
    appointments,
    metrics: {
      upcoming: appointments.filter((item) => item.status === "CONFIRMED" && new Date(item.startsAt) >= new Date()).length,
      confirmed: appointments.filter((item) => item.status === "CONFIRMED").length,
      cancelled: appointments.filter((item) => item.status === "CANCELLED").length,
    },
  };
}

async function getDashboardUsage(query = {}) {
  const overview = await getDashboardOverview(query);
  const conversations = overview.metrics.conversationsStarted;
  const leads = overview.metrics.profiledLeads || 1;

  return {
    period: overview.period,
    usage: {
      openAiCalls: overview.metrics.openAiCalls,
      inputTokens: overview.metrics.inputTokens,
      outputTokens: overview.metrics.outputTokens,
      totalTokens: overview.metrics.totalTokens,
      estimatedOpenAiCost: overview.metrics.estimatedOpenAiCost,
      averageCostPerConversation: Number((overview.metrics.estimatedOpenAiCost / Math.max(conversations, 1)).toFixed(6)),
      averageCostPerLead: Number((overview.metrics.estimatedOpenAiCost / leads).toFixed(6)),
      messagesReceived: overview.metrics.messagesReceived,
      messagesSent: overview.metrics.messagesSent,
    },
  };
}

async function getDashboardStatus() {
  const calendarConnectionResult = await pool.query(
    `
      SELECT status, calendar_id
      FROM gc_ai_calendar_connections
      WHERE provider = 'google_calendar'
        AND status = 'ACTIVE'
        AND encrypted_refresh_token IS NOT NULL
      ORDER BY connected_at DESC
      LIMIT 1
    `
  );

  return {
    malu: {
      label: "Malu",
      status: "operational",
      detail: "Operativa",
    },
    whatsapp: {
      label: "WhatsApp",
      status: env.whatsappAgentAutoReplyEnabled && env.whatsappAccessToken && env.whatsappPhoneNumberId ? "operational" : "attention",
      detail: env.whatsappAgentAutoReplyEnabled ? "Auto reply activo" : "Auto reply desactivado",
    },
    openAi: {
      label: "OpenAI",
      status: env.openAiApiKey && env.openAiModel ? "operational" : "attention",
      detail: env.openAiModel || "Modelo no configurado",
    },
    calendar: {
      label: "Google Calendar",
      status:
        env.googleCalendarEnabled && calendarConnectionResult.rows[0]?.status === "ACTIVE"
          ? "operational"
          : "attention",
      detail: calendarConnectionResult.rows[0]?.status || "Sin conexion activa",
      provider: env.googleCalendarEnabled ? "GOOGLE" : "MOCK",
      calendarId: calendarConnectionResult.rows[0]?.calendar_id || env.googleCalendarId || "primary",
    },
    backend: {
      label: "Backend/DB",
      status: "operational",
      detail: "Conectado",
    },
  };
}

module.exports = {
  buildOverviewModel,
  classifyConversation,
  getAbandonmentStage,
  getDashboardAppointments,
  getDashboardConversationDetail,
  getDashboardConversations,
  getDashboardLeads,
  getDashboardOverview,
  getDashboardStatus,
  getDashboardUsage,
  resolvePeriod,
  sanitizePhone,
};
