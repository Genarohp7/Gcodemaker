const assert = require("node:assert/strict");
const test = require("node:test");

const dashboard = require("../malu-dashboard.service");

function createRow(overrides = {}) {
  return {
    conversation_id: overrides.conversation_id || "conv-1",
    lead_id: overrides.lead_id || "lead-1",
    conversation_created_at: overrides.conversation_created_at || "2026-08-03T10:00:00.000Z",
    conversation_updated_at: overrides.conversation_updated_at || "2026-08-03T10:05:00.000Z",
    conversation_owner: overrides.conversation_owner || "MALU",
    human_takeover: overrides.human_takeover || false,
    handoff_finalized_at: overrides.handoff_finalized_at || null,
    lead_name: overrides.lead_name || "Prospecto",
    phone: overrides.phone || "+525512345678",
    source: overrides.source || "whatsapp",
    lead_status: overrides.lead_status || "open",
    interest_level: overrides.interest_level || "unknown",
    service_interest: overrides.service_interest || null,
    lead_created_at: overrides.lead_created_at || "2026-08-03T10:00:00.000Z",
    business_type: overrides.business_type || null,
    business_name: overrides.business_name || null,
    project_need: overrides.project_need || null,
    objective: overrides.objective || null,
    summary: overrides.summary || null,
    message_count: overrides.message_count || 1,
    inbound_count: overrides.inbound_count || 1,
    outbound_count: overrides.outbound_count || 0,
    last_activity_at: overrides.last_activity_at || "2026-08-03T10:05:00.000Z",
    price_question: overrides.price_question || false,
    confirmed_appointments: overrides.confirmed_appointments || 0,
    cancelled_appointments: overrides.cancelled_appointments || 0,
    latest_appointment_status: overrides.latest_appointment_status || null,
    latest_appointment_starts_at: overrides.latest_appointment_starts_at || null,
    latest_appointment_modality: overrides.latest_appointment_modality || null,
    google_event_present: overrides.google_event_present || false,
    usage_calls: overrides.usage_calls || 0,
    tokens_input: overrides.tokens_input || 0,
    tokens_output: overrides.tokens_output || 0,
    estimated_cost: overrides.estimated_cost || 0,
  };
}

test("classifies early abandonment deterministically", () => {
  const row = createRow();

  assert.equal(dashboard.classifyConversation(row), "Abandonado");
  assert.equal(dashboard.getAbandonmentStage(row), "only_greeted");
});

test("classifies profile, interest, appointment and handoff without AI", () => {
  assert.equal(
    dashboard.classifyConversation(createRow({ business_type: "Pizzeria", inbound_count: 2 })),
    "Perfilado"
  );
  assert.equal(
    dashboard.classifyConversation(createRow({ price_question: true, inbound_count: 3 })),
    "Interesado"
  );
  assert.equal(
    dashboard.classifyConversation(createRow({ confirmed_appointments: 1 })),
    "Cita"
  );
  assert.equal(
    dashboard.classifyConversation(createRow({ conversation_owner: "INGENIERO" })),
    "Transferido"
  );
});

test("builds overview excluding rows omitted by DB filters and produces funnel", () => {
  const period = dashboard.resolvePeriod(
    { period: "last_7_days" },
    new Date("2026-08-03T12:00:00.000Z")
  );
  const model = dashboard.buildOverviewModel({
    rows: [
      createRow({ conversation_id: "conv-1", business_type: "Pizzeria", inbound_count: 2 }),
      createRow({ conversation_id: "conv-2", price_question: true, inbound_count: 3 }),
      createRow({ conversation_id: "conv-3", confirmed_appointments: 1 }),
    ],
    previousRows: [createRow({ conversation_id: "prev-1" })],
    appointments: [
      {
        id: "appt-1",
        conversation_id: "conv-3",
        lead_id: "lead-3",
        lead_name: "Prospecto",
        business_name: "Pizzeria",
        service_interest: "IA Respuestas",
        status: "CONFIRMED",
        modality: "LLAMADA",
        starts_at: "2026-08-04T15:00:00.000Z",
        ends_at: "2026-08-04T15:30:00.000Z",
        engineer_timezone: "America/Mexico_City",
        google_calendar_event_id: "event-1",
        created_at: "2026-08-03T12:00:00.000Z",
      },
    ],
    period,
  });

  assert.equal(model.metrics.conversationsStarted, 3);
  assert.equal(model.metrics.profiledLeads, 3);
  assert.equal(model.metrics.interestedLeads, 2);
  assert.equal(model.metrics.confirmedAppointments, 1);
  assert.equal(model.funnel[0].label, "Conversaciones");
  assert.equal(model.funnel[3].label, "Citas");
});

test("sanitizes phone numbers for dashboard output", () => {
  assert.equal(dashboard.sanitizePhone("+52 55 1234 5678"), "***5678");
  assert.equal(dashboard.sanitizePhone(""), "Sin telefono");
});
