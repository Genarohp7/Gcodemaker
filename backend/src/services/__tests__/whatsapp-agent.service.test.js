const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SERVICE_PATH = "../whatsapp-agent.service";
const DB_PATH = "../../db";
const ENV_PATH = "../../config/env";
const AI_AGENT_PATH = "../ai-agent.service";
const CALENDAR_PROVIDER_PATH = "../calendar-provider.service";
const DEMO_MODE_PATH = "../demo-mode.service";
const INTENT_GUARD_PATH = "../intent-guard.service";
const SCOPE_GUARD_PATH = "../malu-scope-guard.service";
const WHATSAPP_PATH = "../whatsapp.service";

function createWhatsAppPayload({ messageId, text = "Necesito una landing", from = "5215551234567" }) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: {
                phone_number_id: "test-phone-number-id",
              },
              contacts: [
                {
                  wa_id: from,
                  profile: {
                    name: "Cliente Prueba",
                  },
                },
              ],
              messages: [
                {
                  id: messageId,
                  from,
                  type: "text",
                  text: {
                    body: text,
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function getHourInMexicoCity(isoDate) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoDate));
  const hour = parts.find((part) => part.type === "hour")?.value;

  return Number(hour);
}

function createInMemoryDatabase() {
  const state = {
    leads: [],
    conversations: [],
    messages: [],
    activityLogs: [],
    leadUpdates: 0,
  };

  function findLeadByPhone(phone) {
    return state.leads.find((lead) => lead.phone === phone);
  }

  async function query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, " ").trim();

    if (normalized.includes("FROM gc_ai_messages") && normalized.includes("provider_message_id = $2")) {
      return {
        rows: state.messages.filter(
          (message) => message.provider === params[0] && message.provider_message_id === params[1]
        ),
      };
    }

    if (normalized.includes("SELECT role, content, created_at FROM gc_ai_messages")) {
      const limit = params[1] || 12;
      return {
        rows: state.messages
          .filter((message) => message.conversation_id === params[0])
          .slice(-limit)
          .map((message) => ({
            role: message.role,
            content: message.content,
            created_at: message.created_at || new Date(),
          }))
          .reverse(),
      };
    }

    if (normalized.includes("SELECT metadata FROM gc_ai_activity_logs")) {
      const rows = state.activityLogs
        .filter(
          (activity) =>
            activity.entity_id === params[0] &&
            activity.action === params[1] &&
            (!params[2] || activity.metadata.status === params[2])
        )
        .slice(-1)
        .map((activity) => ({
          metadata: activity.metadata,
        }));

      return { rows };
    }

    if (
      normalized.includes("FROM gc_ai_activity_logs") &&
      normalized.includes("metadata->>'providerMessageId'")
    ) {
      const rows = state.activityLogs
        .filter(
          (activity) =>
            activity.action === params[0] &&
            activity.metadata.provider === params[1] &&
            activity.metadata.providerMessageId === params[2]
        )
        .map((activity) => ({ id: activity.id }));

      return { rows: rows.slice(0, 1) };
    }

    if (normalized.startsWith("INSERT INTO gc_ai_leads")) {
      const existing = findLeadByPhone(params[2]);

      if (existing) {
        existing.name = existing.name || params[1] || null;
        existing.updated_at = new Date();
        existing.last_message_at = new Date();
        return { rows: [existing] };
      }

      const lead = {
        id: params[0],
        name: params[1],
        phone: params[2],
        status: "new",
        service_interest: null,
        qualification_reason: null,
        ai_enabled: true,
        human_takeover: false,
        off_topic_count: 0,
        ai_response_count: 0,
      };
      state.leads.push(lead);
      return { rows: [lead] };
    }

    if (normalized.includes("FROM gc_ai_conversations") && normalized.includes("status = 'open'")) {
      const rows = state.conversations.filter(
        (conversation) => conversation.lead_id === params[0] && conversation.channel === "whatsapp" && conversation.status === "open"
      );
      return { rows: rows.slice(0, 1) };
    }

    if (normalized.startsWith("INSERT INTO gc_ai_conversations")) {
      const conversation = {
        id: params[0],
        lead_id: params[1],
        channel: "whatsapp",
        status: "open",
        ai_enabled: true,
        human_takeover: false,
        conversation_owner: "MALU",
        handoff_finalized_at: null,
        handoff_contact_requested_at: null,
        post_handoff_interaction_count: 0,
        conversation_scope_status: "COMMERCIAL_ACTIVE",
        off_topic_count: 0,
        non_commercial_blocked_at: null,
        commercial_reactivated_at: null,
        demo_mode: false,
        demo_remaining_questions: 0,
        metadata: {},
      };
      state.conversations.push(conversation);
      return { rows: [conversation] };
    }

    if (normalized.startsWith("INSERT INTO gc_ai_messages")) {
      const provider = params[6];
      const providerMessageId = params[7];

      if (
        providerMessageId &&
        state.messages.some(
          (message) => message.provider === provider && message.provider_message_id === providerMessageId
        )
      ) {
        const error = new Error("duplicate key value violates unique provider_message_id");
        error.code = "23505";
        error.constraint = "idx_gc_ai_messages_provider_message_id_unique";
        throw error;
      }

      const message = {
        id: params[0],
        lead_id: params[1],
        conversation_id: params[2],
        role: params[3],
        message_type: params[4],
        content: params[5],
        provider,
        provider_message_id: providerMessageId,
        metadata: JSON.parse(params[8]),
      };
      state.messages.push(message);
      return { rows: [message] };
    }

    if (normalized.startsWith("UPDATE gc_ai_leads")) {
      state.leadUpdates += 1;
      const lead = state.leads.find((item) => item.id === params[0]);

      if (lead && normalized.includes("status = 'qualified_for_human'")) {
        lead.status = "qualified_for_human";
        lead.ai_enabled = false;
        lead.human_takeover = true;
      } else if (lead && normalized.includes("off_topic_count = off_topic_count + 1")) {
        lead.off_topic_count += 1;
      } else if (lead && normalized.includes("ai_response_count")) {
        lead.status = params[1] || lead.status;
        lead.service_interest = params[2] || lead.service_interest;
        lead.ai_response_count += params[3] ? 0 : 1;
        lead.ai_enabled = params[4] ? false : lead.ai_enabled;
        lead.human_takeover = params[4] ? true : lead.human_takeover;
      } else if (lead) {
        lead.status = params[1] || lead.status;
        lead.service_interest = params[2] || lead.service_interest;
        lead.qualification_reason = params[3] || lead.qualification_reason;
        lead.ai_enabled = params[4] ? false : lead.ai_enabled;
        lead.human_takeover = params[5] ? true : lead.human_takeover;
        lead.off_topic_count += params[6] === "off_topic" ? 1 : 0;
      }

      return { rows: [] };
    }

    if (normalized.startsWith("UPDATE gc_ai_conversations")) {
      const conversation = state.conversations.find((item) => item.id === params[0]);
      if (conversation) {
        if (normalized.includes("conversation_scope_status")) {
          conversation.conversation_scope_status = params[1] || conversation.conversation_scope_status;
          conversation.off_topic_count += params[2] ? 1 : 0;
          conversation.non_commercial_blocked_at =
            params[3] ? conversation.non_commercial_blocked_at || new Date() : conversation.non_commercial_blocked_at;
          conversation.commercial_reactivated_at = params[4] ? new Date() : conversation.commercial_reactivated_at;
          return { rows: [] };
        }

        if (normalized.includes("post_handoff_interaction_count")) {
          conversation.post_handoff_interaction_count = Math.min(
            conversation.post_handoff_interaction_count + 1,
            params[1]
          );
          return {
            rows: [
              {
                post_handoff_interaction_count: conversation.post_handoff_interaction_count,
              },
            ],
          };
        }

        if (normalized.includes("handoff_contact_requested_at")) {
          conversation.handoff_contact_requested_at =
            conversation.handoff_contact_requested_at || new Date();
          conversation.conversation_owner = "INGENIERO";
          conversation.human_takeover = true;
          conversation.handoff_finalized_at = conversation.handoff_finalized_at || new Date();
          return { rows: [] };
        }

        conversation.human_takeover = true;
        conversation.conversation_owner = "INGENIERO";
        conversation.handoff_finalized_at = conversation.handoff_finalized_at || new Date();
      }
      return { rows: [] };
    }

    if (normalized.startsWith("INSERT INTO gc_ai_activity_logs")) {
      const isParameterizedAction = normalized.includes("VALUES ($1, $2");
      state.activityLogs.push({
        id: params[0],
        action: isParameterizedAction ? params[1] : "handoff_contact_requested",
        entity_id: isParameterizedAction ? params[2] : params[1],
        metadata: JSON.parse(isParameterizedAction ? params[3] : params[2]),
      });
      return { rows: [] };
    }

    throw new Error(`Unhandled query: ${normalized}`);
  }

  return {
    state,
    pool: {
      query,
    },
  };
}

function loadServiceWithFakes(options = {}) {
  const database = createInMemoryDatabase();
  const calls = {
    ai: 0,
    whatsapp: 0,
  };
  const sentMessages = [];
  const aiResult = {
    reply: "Claro, puedo ayudarte a perfilar tu proyecto.",
    shouldTransferToHuman: false,
    skipped: false,
    leadStatus: "profiling",
    serviceInterest: "landing",
    ...(options.aiResult || {}),
  };
  const decision = {
    action: "use_ai_profiling",
    shouldReply: true,
    shouldUseAi: true,
    leadStatus: "profiling",
    serviceInterest: null,
    reason: "commercial_interest",
    ...(options.decision || {}),
  };

  for (const modulePath of [
    SERVICE_PATH,
    DB_PATH,
    ENV_PATH,
    AI_AGENT_PATH,
    CALENDAR_PROVIDER_PATH,
    DEMO_MODE_PATH,
    INTENT_GUARD_PATH,
    SCOPE_GUARD_PATH,
    WHATSAPP_PATH,
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }

  require.cache[require.resolve(DB_PATH)] = {
    exports: {
      pool: database.pool,
    },
  };
  require.cache[require.resolve(ENV_PATH)] = {
    exports: {
      whatsappPhoneNumberId: "test-phone-number-id",
      whatsappAgentAutoReplyEnabled: true,
      whatsappAccessToken: "test-token-not-logged",
      gcMaluOwnerPhoneE164: "",
      googleCalendarTimeZone: "America/Mexico_City",
      googleCalendarDefaultDurationMinutes: 30,
      ...(options.env || {}),
    },
  };
  require.cache[require.resolve(AI_AGENT_PATH)] = {
    exports: {
      async generateProfilingResponse() {
        calls.ai += 1;
        return aiResult;
      },
    },
  };
  const calendarFake = {
    async getAvailableSlots({ modality = null, location = null } = {}) {
      return [
        {
          id: "mock-slot-1",
          label: "Opcion 1",
          startsAt: "2026-08-03T16:00:00.000Z",
          endsAt: "2026-08-03T16:30:00.000Z",
          durationMinutes: 30,
          timeZone: "America/Mexico_City",
          modality,
          location,
          simulated: true,
        },
        {
          id: "mock-slot-2",
          label: "Opcion 2",
          startsAt: "2026-08-03T18:00:00.000Z",
          endsAt: "2026-08-03T18:30:00.000Z",
          durationMinutes: 30,
          timeZone: "America/Mexico_City",
          modality,
          location,
          simulated: true,
        },
      ];
    },
    async createAppointment({ slot, summary, modality = null, location = null }) {
      return {
        id: `mock-appointment-${slot.id}`,
        status: "confirmed",
        slot,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timeZone: slot.timeZone,
        modality: modality || slot.modality || null,
        location: location || slot.location || null,
        confirmedAt: "2026-08-01T12:00:00.000Z",
        googleCalendarEventId: null,
        summary,
        simulated: true,
      };
    },
  };

  require.cache[require.resolve(CALENDAR_PROVIDER_PATH)] = {
    exports: {
      getCalendarProvider() {
        return options.calendarProvider || calendarFake;
      },
      getCalendarProviderName() {
        return options.calendarProviderName || "MOCK";
      },
    },
  };
  require.cache[require.resolve(DEMO_MODE_PATH)] = {
    exports: {
      isDemoCommand() {
        return false;
      },
      isDemoExpired() {
        return false;
      },
      finishDemo() {
        throw new Error("demo should not run");
      },
      consumeDemoQuestion() {
        throw new Error("demo should not run");
      },
    },
  };
  if (!options.useRealIntentGuard) {
    require.cache[require.resolve(INTENT_GUARD_PATH)] = {
      exports: {
        decideNextAction() {
          return decision;
        },
      },
    };
  }
  require.cache[require.resolve(WHATSAPP_PATH)] = {
    exports: {
      async sendTextMessage(request) {
        calls.whatsapp += 1;
        sentMessages.push(request);
        return {
          ok: true,
          status: "sent",
          whatsappMessageId: `wamid-out-${database.state.messages.length}-${calls.whatsapp}`,
        };
      },
    },
  };

  return {
    service: require(SERVICE_PATH),
    database,
    calls,
    sentMessages,
  };
}

async function testNewMessageProcessesAsBefore() {
  const { service, database, calls } = loadServiceWithFakes();

  const result = await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-in-1",
    })
  );

  assert.equal(result.messagesReceived, 1);
  assert.equal(result.messagesProcessed, 1);
  assert.equal(result.results[0].duplicate, undefined);
  assert.equal(calls.ai, 1);
  assert.equal(calls.whatsapp, 1);
  assert.equal(database.state.messages.filter((message) => message.role === "lead").length, 1);
  assert.equal(database.state.messages.filter((message) => message.role === "ai").length, 1);
  assert.equal(database.state.leads[0].ai_response_count, 1);
}

async function testOwnerSenderUsesInternalFlowWithoutLead() {
  const { service, database, calls, sentMessages } = loadServiceWithFakes({
    env: {
      gcMaluOwnerPhoneE164: "+525512345678",
    },
  });

  const result = await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-owner-1",
      from: "525512345678",
      text: "Hola Malu",
    })
  );

  assert.equal(result.messagesProcessed, 1);
  assert.equal(result.results[0].actorType, "OWNER");
  assert.equal(result.results[0].ownerDetected, true);
  assert.equal(result.results[0].commercialLeadCreated, false);
  assert.equal(result.results[0].decision.usedAi, false);
  assert.equal(calls.ai, 0);
  assert.equal(database.state.leads.length, 0);
  assert.equal(database.state.conversations.length, 0);
  assert.equal(database.state.messages.length, 0);
  assert.equal(database.state.leadUpdates, 0);
  assert.equal(database.state.activityLogs.length, 1);
  assert.equal(database.state.activityLogs[0].action, "malu_owner_inbound_message");
  assert.equal(database.state.activityLogs[0].metadata.actorType, "OWNER");
  assert.equal(database.state.activityLogs[0].metadata.ownerDetected, true);
  assert.equal(sentMessages.length, 1);
  assert.match(sentMessages[0].messageBody, /propietario de GCodemaker/);
  assert.doesNotMatch(sentMessages[0].messageBody, /paquete|descuento|agendar/i);
}

async function testOwnerEquivalentPhoneNormalizationMatchesExactly() {
  const { service, database } = loadServiceWithFakes({
    env: {
      gcMaluOwnerPhoneE164: "+525512345678",
    },
  });

  const result = await service.processSimulatorInbound({
    sessionId: "owner-normalization",
    phone: "52 55 1234 5678",
    text: "Hola",
    mode: "MOCK",
  });

  assert.equal(result.actorType, "OWNER");
  assert.equal(database.state.leads.length, 0);
}

async function testDifferentPhoneIsNotOwner() {
  const { service, database, calls } = loadServiceWithFakes({
    env: {
      gcMaluOwnerPhoneE164: "+525512345678",
    },
  });

  const result = await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-not-owner",
      from: "525512345679",
      text: "Necesito una landing",
    })
  );

  assert.equal(result.results[0].actorType, undefined);
  assert.equal(database.state.leads.length, 1);
  assert.equal(database.state.conversations.length, 1);
  assert.equal(calls.ai, 1);
}

async function testOwnerClaimFromDifferentPhoneStaysCommercial() {
  const { service, database, calls } = loadServiceWithFakes({
    env: {
      gcMaluOwnerPhoneE164: "+525512345678",
    },
  });

  const result = await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-owner-claim",
      from: "525598765432",
      text: "Soy el propietario, quiero revisar una pagina web",
    })
  );

  assert.equal(result.results[0].actorType, undefined);
  assert.equal(database.state.leads.length, 1);
  assert.equal(database.state.conversations.length, 1);
  assert.equal(calls.ai, 1);
}

async function testOwnerFlowDoesNotRunCommercialGuards() {
  const calendarProvider = {
    async getAvailableSlots() {
      throw new Error("calendar should not run for owner");
    },
    async createAppointment() {
      throw new Error("appointment should not run for owner");
    },
  };
  const { service, database, calls } = loadServiceWithFakes({
    calendarProvider,
    env: {
      gcMaluOwnerPhoneE164: "+525512345678",
    },
  });

  const result = await service.processSimulatorInbound({
    sessionId: "owner-no-commercial-flow",
    phone: "+525512345678",
    text: "Soy Genaro, cuanto cuesta el agente y quiero agendar",
    mode: "LIVE_AI",
  });

  assert.equal(result.actorType, "OWNER");
  assert.equal(result.decision.action, "owner_internal_acknowledgement");
  assert.equal(result.decision.humanTakeover, false);
  assert.equal(result.decision.usedAi, false);
  assert.equal(calls.ai, 0);
  assert.equal(database.state.leads.length, 0);
  assert.equal(database.state.conversations.length, 0);
  assert.equal(database.state.messages.length, 0);
  assert.equal(database.state.activityLogs[0].metadata.actorType, "OWNER");
}

async function testFirstReplyIdentifiesMaluOnlyOnce() {
  const { service, database, calls } = loadServiceWithFakes();

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-intro-1",
      text: "Tengo una clinica y necesito responder clientes",
    })
  );
  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-intro-2",
      text: "Quiero saber mas",
    })
  );

  const aiMessages = database.state.messages.filter((message) => message.role === "ai");
  assert.equal(calls.ai, 2);
  assert.match(aiMessages[0].content, /^Hola, soy Malu, asistente virtual de GCodemaker\./);
  assert.doesNotMatch(aiMessages[1].content, /^Hola, soy Malu, asistente virtual de GCodemaker\./);
}

async function testTransferSetsEngineerOwner() {
  const { service, database, calls } = loadServiceWithFakes({
    decision: {
      action: "transfer_to_human",
      shouldReply: true,
      shouldUseAi: false,
      reply: "Perfecto, con eso ya tengo una idea mas clara.",
      leadStatus: "qualified_for_human",
      humanTakeover: true,
      disableAi: true,
      reason: "engineer_decision_required",
    },
  });

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-transfer-1",
      text: "Me pueden hacer un descuento especial?",
    })
  );

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 1);
  assert.equal(database.state.leads[0].ai_enabled, false);
  assert.equal(database.state.leads[0].human_takeover, true);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.ok(database.state.conversations[0].handoff_finalized_at);
}

async function testAiTransferSetsEngineerOwner() {
  const { service, database } = loadServiceWithFakes({
    aiResult: {
      shouldTransferToHuman: true,
      leadStatus: "qualified_for_human",
    },
  });

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-ai-transfer-1",
    })
  );

  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.equal(database.state.leads[0].ai_enabled, false);
}

async function testDuplicateProviderMessageIdDoesNotRepeatEffects() {
  const { service, database, calls } = loadServiceWithFakes();
  const payload = createWhatsAppPayload({
    messageId: "wamid-duplicate-1",
  });

  await service.processWebhookPayload(payload);
  const duplicateResult = await service.processWebhookPayload(payload);

  assert.equal(duplicateResult.results[0].duplicate, true);
  assert.equal(duplicateResult.results[0].autoReply.sent, false);
  assert.equal(calls.ai, 1);
  assert.equal(calls.whatsapp, 1);
  assert.equal(database.state.messages.length, 2);
  assert.equal(database.state.leads[0].ai_response_count, 1);
  assert.equal(database.state.leadUpdates, 2);
}

async function testNullProviderMessageIdRemainsAllowed() {
  const { service, database, calls } = loadServiceWithFakes();

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: null,
      text: "Necesito una pagina web",
    })
  );
  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: null,
      text: "Tambien necesito automatizar mensajes",
    })
  );

  assert.equal(calls.ai, 2);
  assert.equal(calls.whatsapp, 2);
  assert.equal(database.state.messages.filter((message) => message.provider_message_id === null).length, 2);
  assert.equal(database.state.messages.filter((message) => message.role === "ai").length, 2);
}

async function createTransferredConversationFixture() {
  const fixture = loadServiceWithFakes();

  await fixture.service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-fixture-1",
    })
  );

  const lead = fixture.database.state.leads[0];
  const conversation = fixture.database.state.conversations[0];
  lead.ai_enabled = false;
  lead.human_takeover = true;
  conversation.conversation_owner = "INGENIERO";
  conversation.human_takeover = true;
  conversation.handoff_finalized_at = new Date();
  fixture.calls.ai = 0;
  fixture.calls.whatsapp = 0;

  return fixture;
}

async function testFirstPostHandoffInboundAsksForContact() {
  const { service, database, calls } = await createTransferredConversationFixture();

  const result = await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-post-1",
      text: "Tengo otra duda del servicio",
    })
  );

  assert.equal(result.results[0].postHandoff, true);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 1);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.equal(database.state.conversations[0].post_handoff_interaction_count, 1);
  assert.match(
    database.state.messages.at(-1).content,
    /Gustas que le pida que se ponga en contacto contigo/
  );
}

async function testAffirmativePostHandoffRegistersNotification() {
  const { service, database, calls } = await createTransferredConversationFixture();

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-post-2a",
      text: "Tengo otra duda del servicio",
    })
  );
  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-post-2b",
      text: "Si, por favor que me contacte",
    })
  );

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 2);
  assert.ok(database.state.conversations[0].handoff_contact_requested_at);
  assert.equal(
    database.state.activityLogs.filter((activity) => activity.action === "handoff_contact_requested").length,
    1
  );
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.match(database.state.messages.at(-1).content, /ya deje registrada tu solicitud/);
}

async function testPostHandoffNegativeOrInsistenceDoesNotReactivateAi() {
  const { service, database, calls } = await createTransferredConversationFixture();

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-post-3a",
      text: "Tengo otra duda del servicio",
    })
  );
  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-post-3b",
      text: "No, respondeme tu",
    })
  );

  assert.equal(calls.ai, 0);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.equal(database.state.leads[0].ai_enabled, false);
  assert.match(database.state.messages.at(-1).content, /corresponde al ingeniero asignado/);
}

async function testPostHandoffStopsAfterFourAutoReplies() {
  const { service, database, calls } = await createTransferredConversationFixture();

  for (let index = 1; index <= 5; index += 1) {
    await service.processWebhookPayload(
      createWhatsAppPayload({
        messageId: `wamid-post-limit-${index}`,
        text: "Insisto, respondeme tu",
      })
    );
  }

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 4);
  assert.equal(database.state.conversations[0].post_handoff_interaction_count, 4);
  assert.equal(database.state.messages.filter((message) => message.role === "lead").length, 6);
  assert.equal(database.state.messages.filter((message) => message.role === "ai").length, 5);
  assert.match(
    database.state.messages.filter((message) => message.role === "ai").at(-1).content,
    /Tu solicitud ya quedo registrada/
  );
}

async function testDemoDoesNotReactivateTransferredConversation() {
  const { service, database, calls } = await createTransferredConversationFixture();
  database.state.conversations[0].demo_mode = true;
  database.state.conversations[0].demo_remaining_questions = 3;

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-demo-transferred-1",
      text: "Quiero seguir la demo",
    })
  );

  assert.equal(calls.ai, 0);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
}

async function testAutoReplyDisabledStillSavesMessagesWithoutSending() {
  const { service, database, calls } = loadServiceWithFakes({
    env: {
      whatsappAgentAutoReplyEnabled: false,
    },
  });

  await service.processWebhookPayload(
    createWhatsAppPayload({
      messageId: "wamid-disabled-1",
    })
  );

  assert.equal(calls.ai, 1);
  assert.equal(calls.whatsapp, 0);
  assert.equal(database.state.messages.filter((message) => message.role === "lead").length, 1);
  assert.equal(database.state.messages.filter((message) => message.role === "ai").length, 1);
  assert.equal(database.state.messages.at(-1).metadata.rawPayload.autoReply.reason, "auto_reply_disabled");
}

async function testSimulatorMockUsesRealFlowWithoutOpenAiOrMeta() {
  const { service, database, calls } = loadServiceWithFakes();

  const result = await service.processSimulatorInbound({
    sessionId: "sim-session-1",
    text: "Necesito automatizar respuestas de clientes",
    messageId: "sim-in-1",
    phone: "999000000001",
    mode: "MOCK",
  });

  assert.equal(result.processed, true);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(result.decision.humanTakeover, false);
  assert.equal(result.decision.usedAi, true);
  assert.equal(database.state.messages.filter((message) => message.provider === "simulator").length, 2);
  assert.match(database.state.messages.at(-1).content, /^Hola, soy Malu, asistente virtual de GCodemaker\./);
  assert.match(database.state.messages.at(-1).content, /paquete de Agentes de IA/);
  assert.doesNotMatch(database.state.messages.at(-1).content, /\$1,900 MXN mensuales/);
  assert.match(database.state.messages.at(-1).content, /cuantos mensajes recibes/i);
}

async function testSimulatorMockProfilesLandingWithoutTransfer() {
  const { service, database, calls } = loadServiceWithFakes();

  const result = await service.processSimulatorInbound({
    sessionId: "sim-session-landing",
    text: "Quiero una pagina sencilla para mi negocio",
    messageId: "sim-in-landing",
    phone: "999000000004",
    mode: "MOCK",
  });

  assert.equal(result.processed, true);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(result.decision.humanTakeover, false);
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
  assert.match(database.state.messages.at(-1).content, /Landing Esencial/);
  assert.doesNotMatch(database.state.messages.at(-1).content, /\$2,500 MXN/);
  assert.match(database.state.messages.at(-1).content, /a que se dedica tu negocio/i);
}

async function testSimulatorMockKeepsAgentContextForAdditionalCosts() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000005";

  await service.processSimulatorInbound({
    sessionId: "sim-session-context-agent",
    text: "Hola quiero mas informacion",
    messageId: "sim-context-agent-1",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-context-agent",
    text: "Quiero un asistente que atienda mis mensajes",
    messageId: "sim-context-agent-2",
    phone,
    mode: "MOCK",
  });
  const result = await service.processSimulatorInbound({
    sessionId: "sim-session-context-agent",
    text: "Tiene algun otro costo?",
    messageId: "sim-context-agent-3",
    phone,
    mode: "MOCK",
  });

  const lastReply = database.state.messages.at(-1).content;
  assert.equal(result.processed, true);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(result.decision.humanTakeover, false);
  assert.match(lastReply, /IA Respuestas/);
  assert.match(lastReply, /\$1,900 MXN/);
  assert.match(lastReply, /IVA/);
  assert.match(lastReply, /implementacion/i);
  assert.match(lastReply, /15%/);
  assert.doesNotMatch(lastReply, /Para ubicar mejor tu caso/);
  assert.doesNotMatch(lastReply, /^Hola, soy Malu/);
}

async function testSimulatorMockAnswersContextualAgentFollowups() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000006";

  await service.processSimulatorInbound({
    sessionId: "sim-session-context-agent-followups",
    text: "Quiero un asistente que atienda mis mensajes",
    messageId: "sim-context-agent-followups-1",
    phone,
    mode: "MOCK",
  });

  const followups = [
    ["Incluye IVA?", /IVA.*factura|factura.*IVA/i],
    ["Que incluye?", /IA Respuestas|IA Perfilador|IA Comercial/i],
    ["Que no incluye?", /CRM completo|campanas masivas/i],
    ["Cuantos mensajes permite?", /150 leads|300 leads|500 leads/i],
    ["Tiene CRM?", /no incluyen un CRM completo/i],
    ["Puede atender fuera de horario?", /24 horas de WhatsApp|fuera del horario humano/i],
    ["Que necesito para empezar?", /reglas|preguntas frecuentes|servicios/i],
  ];

  for (const [text, expected] of followups) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-context-agent-followups",
      text,
      messageId: `sim-context-agent-followups-${text.replace(/\W/g, "-")}`,
      phone,
      mode: "MOCK",
    });
    assert.match(database.state.messages.at(-1).content, expected);
    assert.doesNotMatch(database.state.messages.at(-1).content, /^Hola, soy Malu/);
  }

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
}

async function testSimulatorMockListsAiPackagesAndDiscountRules() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000016";

  await service.processSimulatorInbound({
    sessionId: "sim-session-ai-packages",
    text: "Quiero un agente para WhatsApp",
    messageId: "sim-ai-packages-1",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-ai-packages",
    text: "Que otros paquetes tienen?",
    messageId: "sim-ai-packages-2",
    phone,
    mode: "MOCK",
  });

  const packagesReply = database.state.messages.at(-1).content;
  assert.match(packagesReply, /IA Respuestas/);
  assert.match(packagesReply, /IA Perfilador/);
  assert.match(packagesReply, /IA Comercial/);
  assert.match(packagesReply, /\$1,900 MXN/);
  assert.match(packagesReply, /\$3,900 MXN/);
  assert.match(packagesReply, /\$6,900 MXN/);
  assert.match(packagesReply, /15%/);
  assert.doesNotMatch(packagesReply, /quedaria en|queda en|serian \$|seria \$/i);

  await service.processSimulatorInbound({
    sessionId: "sim-session-ai-packages",
    text: "El 15% tambien aplica a la mensualidad?",
    messageId: "sim-ai-packages-3",
    phone,
    mode: "MOCK",
  });

  const discountReply = database.state.messages.at(-1).content;
  assert.match(discountReply, /solo|unicamente/i);
  assert.match(discountReply, /implementacion/i);
  assert.match(discountReply, /no aplica sobre mensualidad/i);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
}

async function testSimulatorMockKeepsLandingContextForAdditionalCosts() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000007";

  await service.processSimulatorInbound({
    sessionId: "sim-session-context-landing",
    text: "Quiero una pagina sencilla para mi negocio",
    messageId: "sim-context-landing-1",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-context-landing",
    text: "Tiene otro costo?",
    messageId: "sim-context-landing-2",
    phone,
    mode: "MOCK",
  });

  const lastReply = database.state.messages.at(-1).content;
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.match(lastReply, /\$2,500 MXN/);
  assert.match(lastReply, /Tienda en linea|pagos|reservaciones complejas/i);
  assert.doesNotMatch(lastReply, /\$1,900 MXN/);
}

async function testSimulatorMockClarifiesContextlessCostQuestion() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });

  await service.processSimulatorInbound({
    sessionId: "sim-session-contextless-cost",
    text: "Tiene otro costo?",
    messageId: "sim-contextless-cost-1",
    phone: "999000000008",
    mode: "MOCK",
  });

  const lastReply = database.state.messages.at(-1).content;
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.match(lastReply, /a que servicio te refieres/i);
  assert.match(lastReply, /Landing Esencial|paquetes de Agentes de IA/);
}

async function testSimulatorMockHandlesServiceComparisonAndSwitch() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000010";

  await service.processSimulatorInbound({
    sessionId: "sim-session-comparison",
    text: "Quiero un asistente que atienda mis mensajes",
    messageId: "sim-comparison-1",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-comparison",
    text: "Y la landing?",
    messageId: "sim-comparison-2",
    phone,
    mode: "MOCK",
  });
  assert.match(database.state.messages.at(-1).content, /Landing Esencial/);
  assert.doesNotMatch(database.state.messages.at(-1).content, /\$2,500 MXN/);

  await service.processSimulatorInbound({
    sessionId: "sim-session-comparison",
    text: "Cual me conviene?",
    messageId: "sim-comparison-3",
    phone,
    mode: "MOCK",
  });

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.match(database.state.messages.at(-1).content, /Landing Esencial/);
  assert.match(database.state.messages.at(-1).content, /paquete IA/);
  assert.match(database.state.messages.at(-1).content, /Que problema pesa mas hoy/i);
}

async function testSimulatorMockDoesNotRepeatKnownVolumeQuestion() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000009";

  await service.processSimulatorInbound({
    sessionId: "sim-session-known-volume",
    text: "Quiero un asistente que atienda mis mensajes",
    messageId: "sim-known-volume-1",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-known-volume",
    text: "Recibo 80 mensajes al dia",
    messageId: "sim-known-volume-2",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-known-volume",
    text: "Que incluye?",
    messageId: "sim-known-volume-3",
    phone,
    mode: "MOCK",
  });

  assert.doesNotMatch(database.state.messages.at(-1).content, /cuantos mensajes recibes/i);
}

async function testSimulatorDuplicateMessageDoesNotReplyTwice() {
  const { service, database, calls } = loadServiceWithFakes();

  await service.processSimulatorInbound({
    sessionId: "sim-session-duplicate",
    text: "Necesito una landing",
    messageId: "sim-in-duplicate",
    phone: "999000000002",
    mode: "MOCK",
  });
  const duplicate = await service.processSimulatorInbound({
    sessionId: "sim-session-duplicate",
    text: "Necesito una landing",
    messageId: "sim-in-duplicate",
    phone: "999000000002",
    mode: "MOCK",
  });

  assert.equal(duplicate.duplicate, true);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(database.state.messages.filter((message) => message.provider === "simulator").length, 2);
}

async function testSimulatorTransferAndPostHandoffDoesNotUseOpenAi() {
  const { service, database, calls } = loadServiceWithFakes({
    decision: {
      action: "use_ai_profiling",
      shouldReply: true,
      shouldUseAi: true,
      leadStatus: "ai_profiling",
      reason: "commercial_interest",
    },
  });

  await service.processSimulatorInbound({
    sessionId: "sim-session-transfer",
    text: "Me puedes hacer un descuento especial?",
    messageId: "sim-in-transfer-1",
    phone: "999000000003",
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-transfer",
    text: "Tengo otra duda",
    messageId: "sim-in-transfer-2",
    phone: "999000000003",
    mode: "MOCK",
  });

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.equal(database.state.conversations[0].post_handoff_interaction_count, 1);
  assert.match(database.state.messages.at(-1).content, /Gustas que le pida que se ponga en contacto contigo/);
}

async function testRealGuardHumanRequestUsesInstitutionalLanguage() {
  const { service, database, calls } = loadServiceWithFakes({
    useRealIntentGuard: true,
  });

  await service.processSimulatorInbound({
    sessionId: "sim-session-human-request",
    text: "Quiero hablar con una persona",
    messageId: "sim-in-human-request-1",
    phone: "999000000004",
    mode: "MOCK",
  });

  const reply = database.state.messages.filter((message) => message.role === "ai").at(-1).content;
  assert.equal(calls.ai, 0);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.match(reply, /ingeniero responsable/);
  assert.doesNotMatch(reply, /Genaro/);
}

async function testSchedulingOfferKeepsMaluOwnerUntilAppointment() {
  const { service, database, calls } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000011";

  await service.processSimulatorInbound({
    sessionId: "sim-session-scheduling",
    text: "Hola, quiero una pagina web",
    messageId: "sim-scheduling-1",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-scheduling",
    text: "Soy dentista y quiero tener presencia en Google",
    messageId: "sim-scheduling-2",
    phone,
    mode: "MOCK",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-scheduling",
    text: "Solo tengo el logotipo",
    messageId: "sim-scheduling-3",
    phone,
    mode: "MOCK",
  });
  const offer = await service.processSimulatorInbound({
    sessionId: "sim-session-scheduling",
    text: "Me interesa",
    messageId: "sim-scheduling-4",
    phone,
    mode: "MOCK",
  });

  assert.equal(calls.whatsapp, 0);
  assert.equal(offer.scheduling.status, "SCHEDULING_OFFERED");
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
  assert.equal(database.state.conversations[0].human_takeover, false);
  assert.match(database.state.messages.at(-1).content, /consultoria comercial final/i);
  assert.match(database.state.messages.at(-1).content, /modalidad/i);
  assert.doesNotMatch(database.state.messages.at(-1).content, /Genaro/);
}

async function testSchedulingMockConfirmsAppointmentThenFinalizesHandoff() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000012";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Prefiero videollamada",
    "Opcion 1",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-confirm",
      text,
      messageId: `sim-scheduling-confirm-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const schedulingEvents = database.state.activityLogs.filter(
    (activity) => activity.action === "malu_scheduling_state_changed"
  );
  const statuses = schedulingEvents.map((activity) => activity.metadata.status);
  const slotEvent = schedulingEvents.find(
    (activity) => activity.metadata.status === "SLOT_OPTIONS_PRESENTED"
  );
  assert.ok(statuses.includes("SCHEDULING_OFFERED"), `statuses=${statuses.join(",")}`);
  assert.ok(
    statuses.includes("SLOT_OPTIONS_PRESENTED"),
    `statuses=${statuses.join(",")} slots=${JSON.stringify(slotEvent?.metadata?.slots || [])}`
  );
  assert.ok(
    statuses.includes("APPOINTMENT_CONFIRMED"),
    `statuses=${statuses.join(",")} slots=${JSON.stringify(slotEvent?.metadata?.slots || [])}`
  );
  assert.ok(statuses.includes("HANDOFF_FINALIZED"));
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.equal(database.state.conversations[0].human_takeover, true);
  assert.equal(database.state.leads[0].ai_enabled, false);
  assert.match(database.state.messages.at(-1).content, /videollamada quedo programada/i);
  assert.match(database.state.messages.at(-1).content, /confirmar la cita/i);
  assert.match(database.state.messages.at(-1).content, /ingeniero responsable/i);
  assert.doesNotMatch(database.state.messages.at(-1).content, /Genaro/);
}

async function testSchedulingInPersonAvailableOnlyForCdmx() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000031";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Estoy en Ciudad de Mexico y quiero reunion presencial",
    "Opcion 1",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-cdmx-presencial",
      text,
      messageId: `sim-scheduling-cdmx-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const appointmentEvent = database.state.activityLogs.find(
    (activity) => activity.metadata.status === "APPOINTMENT_CONFIRMED"
  );
  assert.equal(appointmentEvent.metadata.appointment.modality, "PRESENCIAL");
  assert.equal(appointmentEvent.metadata.appointment.location.inMexicoCity, true);
  assert.match(database.state.messages.at(-1).content, /reunion presencial quedo programada/i);
}

async function testSchedulingOutsideCdmxDoesNotOfferInPerson() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000032";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Estoy en Baja California y quiero reunion presencial",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-bc",
      text,
      messageId: `sim-scheduling-bc-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const reply = database.state.messages.at(-1).content;
  assert.match(reply, /presencial solo esta disponible en Ciudad de Mexico/i);
  assert.match(reply, /videollamada|llamada telefonica/i);
  assert.doesNotMatch(reply, /horarios simulados/i);
}

async function testSchedulingRespectsCdmxVideoPreference() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000033";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Estoy en CDMX, pero prefiero videollamada",
    "Opcion 1",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-cdmx-video",
      text,
      messageId: `sim-scheduling-cdmx-video-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const appointmentEvent = database.state.activityLogs.find(
    (activity) => activity.metadata.status === "APPOINTMENT_CONFIRMED"
  );
  assert.equal(appointmentEvent.metadata.appointment.modality, "VIDEOLLAMADA");
  assert.match(database.state.messages.at(-1).content, /videollamada quedo programada/i);
}

async function testSchedulingUnknownLocationAsksNaturallyBeforeClosing() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000034";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Quiero reunirme",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-location-needed",
      text,
      messageId: `sim-scheduling-location-needed-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const reply = database.state.messages.at(-1).content;
  assert.match(reply, /ciudad/i);
  assert.match(reply, /videollamada|llamada telefonica/i);
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
}

async function testSchedulingRemoteFromStartDoesNotRequireLocation() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000035";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Quiero videollamada",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-remote-start",
      text,
      messageId: `sim-scheduling-remote-start-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const slotEvent = database.state.activityLogs.find(
    (activity) => activity.metadata.status === "SLOT_OPTIONS_PRESENTED"
  );
  assert.equal(slotEvent.metadata.modality, "VIDEOLLAMADA");
  assert.equal(slotEvent.metadata.location, null);
  assert.match(database.state.messages.at(-1).content, /opciones disponibles/i);
  assert.doesNotMatch(database.state.messages.at(-1).content, /ciudad/i);
}

async function testSchedulingCalendarFailureDoesNotFinalizeHandoff() {
  const failingCalendarProvider = {
    async getAvailableSlots({ modality = null, location = null } = {}) {
      return [
        {
          id: "google-slot-1",
          label: "Opcion 1",
          startsAt: "2026-08-03T16:00:00.000Z",
          endsAt: "2026-08-03T16:30:00.000Z",
          durationMinutes: 30,
          timeZone: "America/Mexico_City",
          modality,
          location,
          simulated: false,
        },
      ];
    },
    async createAppointment() {
      const error = new Error("Google Calendar fallo");
      error.code = "google_calendar_event_create_failed";
      throw error;
    },
  };
  const { service, database } = loadServiceWithFakes({
    useRealIntentGuard: true,
    calendarProvider: failingCalendarProvider,
    calendarProviderName: "GOOGLE",
  });
  const phone = "999000000036";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Quiero videollamada",
    "Opcion 1",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-calendar-fails",
      text,
      messageId: `sim-scheduling-calendar-fails-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const statuses = database.state.activityLogs
    .filter((activity) => activity.action === "malu_scheduling_state_changed")
    .map((activity) => activity.metadata.status);
  assert.ok(!statuses.includes("APPOINTMENT_CONFIRMED"));
  assert.ok(!statuses.includes("HANDOFF_FINALIZED"));
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
  assert.equal(database.state.conversations[0].human_takeover, false);
  assert.match(database.state.messages.at(-1).content, /no quedo programada/i);
}

async function testDirectRequestedSlotRequiresConfirmedGoogleEventBeforeHandoff() {
  const calendarProvider = {
    async getAvailableSlots({ preferredSlot, modality = null, location = null } = {}) {
      return [
        {
          ...preferredSlot,
          modality,
          location,
          simulated: false,
        },
      ];
    },
    async createAppointment({ slot, summary, modality = null, location = null }) {
      return {
        id: "google-appointment-missing-event",
        status: "confirmed",
        slot,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timeZone: slot.timeZone,
        modality,
        location,
        confirmedAt: "2026-08-01T12:00:00.000Z",
        googleCalendarEventId: null,
        summary,
        simulated: false,
      };
    },
  };
  const { service, database } = loadServiceWithFakes({
    useRealIntentGuard: true,
    calendarProvider,
    calendarProviderName: "GOOGLE",
  });
  const phone = "999000000037";

  for (const [index, text] of [
    "Quiero un agente de IA para mi pizzeria",
    "Necesito que tome pedidos por WhatsApp",
    "Me interesa coordinar una llamada",
    "Podria ser el proximo lunes a las 13:00?",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-direct-slot-google-no-event",
      text,
      messageId: `sim-direct-slot-no-event-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const statuses = database.state.activityLogs
    .filter((activity) => activity.action === "malu_scheduling_state_changed")
    .map((activity) => activity.metadata.status);
  assert.ok(statuses.includes("CALENDAR_AVAILABILITY_REQUIRED"), statuses.join(","));
  assert.ok(!statuses.includes("APPOINTMENT_CONFIRMED"), statuses.join(","));
  assert.ok(!statuses.includes("HANDOFF_FINALIZED"), statuses.join(","));
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
  assert.equal(database.state.conversations[0].human_takeover, false);
  assert.match(database.state.messages.at(-1).content, /no quedo programada/i);
}

async function testInPersonModalityPersistsAfterLocationProvided() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000039";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "Quiero una reunion presencial",
    "Me encuentro en la Ciudad de Mexico en Coyoacan",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-presencial-location-after",
      text,
      messageId: `sim-presencial-location-after-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const schedulingEvents = database.state.activityLogs.filter(
    (activity) => activity.action === "malu_scheduling_state_changed"
  );
  const lastSchedulingEvent = schedulingEvents.at(-1);
  const reply = database.state.messages.at(-1).content;

  assert.equal(lastSchedulingEvent.metadata.status, "SLOT_OPTIONS_PRESENTED");
  assert.equal(lastSchedulingEvent.metadata.modality, "PRESENCIAL");
  assert.equal(lastSchedulingEvent.metadata.location.inMexicoCity, true);
  assert.doesNotMatch(reply, /Cual prefieres/i);
  assert.doesNotMatch(reply, /modalidad presencial, videollamada o llamada telefonica/i);
}

async function testDirectRequestedSlotWithGoogleEventFinalizesHandoff() {
  const calendarProvider = {
    async getAvailableSlots({ preferredSlot, modality = null, location = null } = {}) {
      return [
        {
          ...preferredSlot,
          modality,
          location,
          simulated: false,
        },
      ];
    },
    async createAppointment({ slot, summary, modality = null, location = null }) {
      return {
        id: "google-appointment-confirmed",
        status: "confirmed",
        slot,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timeZone: slot.timeZone,
        modality,
        location,
        confirmedAt: "2026-08-01T12:00:00.000Z",
        googleCalendarEventId: "google-event-present",
        summary,
        simulated: false,
      };
    },
  };
  const { service, database } = loadServiceWithFakes({
    useRealIntentGuard: true,
    calendarProvider,
    calendarProviderName: "GOOGLE",
  });
  const phone = "999000000038";

  for (const [index, text] of [
    "Quiero un agente de IA para mi pizzeria",
    "Necesito que tome pedidos por WhatsApp",
    "Me interesa coordinar una llamada",
    "Podria ser el proximo lunes a las 13:00?",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-direct-slot-google-event",
      text,
      messageId: `sim-direct-slot-event-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const appointmentEvent = database.state.activityLogs.find(
    (activity) => activity.metadata.status === "APPOINTMENT_CONFIRMED"
  );
  assert.equal(appointmentEvent.metadata.googleCalendarEventId, "google-event-present");
  assert.equal(appointmentEvent.metadata.modality, "LLAMADA");
  assert.equal(getHourInMexicoCity(appointmentEvent.metadata.appointment.startsAt), 13);
  assert.equal(database.state.conversations[0].conversation_owner, "INGENIERO");
  assert.equal(database.state.conversations[0].human_takeover, true);
  assert.match(database.state.messages.at(-1).content, /llamada/i);
  assert.match(database.state.messages.at(-1).content, /quedo programada/i);
  assert.doesNotMatch(database.state.messages.at(-1).content, /America\/Mexico_City/i);
}

async function testRequestedSlotAvailableIsBookedDirectlyWithoutAlternatives() {
  const calls = {
    preferredSlot: null,
    createAppointment: 0,
  };
  const calendarProvider = {
    async getAvailableSlots({ preferredSlot, modality = null, location = null } = {}) {
      calls.preferredSlot = preferredSlot;
      return [
        {
          ...preferredSlot,
          modality,
          location,
          simulated: false,
        },
      ];
    },
    async createAppointment({ slot, summary, modality = null, location = null }) {
      calls.createAppointment += 1;
      return {
        id: "google-appointment-requested-slot",
        status: "confirmed",
        slot,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timeZone: slot.timeZone,
        modality,
        location,
        confirmedAt: "2026-08-01T12:00:00.000Z",
        googleCalendarEventId: "google-event-requested-slot",
        summary,
        simulated: false,
      };
    },
  };
  const { service, database } = loadServiceWithFakes({
    useRealIntentGuard: true,
    calendarProvider,
    calendarProviderName: "GOOGLE",
  });
  const phone = "999000000040";

  for (const [index, text] of [
    "Quiero un agente de IA para mi pizzeria",
    "Necesito que tome pedidos por WhatsApp",
    "Me interesa coordinar una llamada",
    "Podria ser el proximo lunes a las 3 de la tarde?",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-requested-slot-available",
      text,
      messageId: `sim-requested-slot-available-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const statuses = database.state.activityLogs
    .filter((activity) => activity.action === "malu_scheduling_state_changed")
    .map((activity) => activity.metadata.status);
  const reply = database.state.messages.at(-1).content;

  assert.equal(calls.createAppointment, 1);
  assert.ok(calls.preferredSlot, "preferred slot should be passed to provider");
  assert.equal(getHourInMexicoCity(calls.preferredSlot.startsAt), 15);
  assert.ok(!statuses.includes("SLOT_OPTIONS_PRESENTED"), statuses.join(","));
  assert.ok(statuses.includes("APPOINTMENT_CONFIRMED"), statuses.join(","));
  assert.doesNotMatch(reply, /America\/Mexico_City/i);
}

async function testRequestedSlotOccupiedOffersAlternativesWithoutCreatingAppointment() {
  const calls = {
    preferredSlot: null,
    createAppointment: 0,
  };
  const calendarProvider = {
    async getAvailableSlots({ preferredSlot, modality = null, location = null } = {}) {
      calls.preferredSlot = preferredSlot;
      return [
        {
          id: "alt-slot-1",
          label: "Opcion 1",
          startsAt: "2026-08-03T20:00:00.000Z",
          endsAt: "2026-08-03T20:30:00.000Z",
          durationMinutes: 30,
          timeZone: "America/Mexico_City",
          modality,
          location,
          simulated: false,
        },
      ];
    },
    async createAppointment() {
      calls.createAppointment += 1;
      throw new Error("No debe crear cita cuando el slot solicitado no fue devuelto");
    },
  };
  const { service, database } = loadServiceWithFakes({
    useRealIntentGuard: true,
    calendarProvider,
    calendarProviderName: "GOOGLE",
  });
  const phone = "999000000041";

  for (const [index, text] of [
    "Quiero un agente de IA para mi pizzeria",
    "Necesito que tome pedidos por WhatsApp",
    "Me interesa coordinar una llamada",
    "Podria ser el proximo lunes a las 3 de la tarde?",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-requested-slot-occupied",
      text,
      messageId: `sim-requested-slot-occupied-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const slotEvent = database.state.activityLogs.find(
    (activity) => activity.metadata.status === "SLOT_OPTIONS_PRESENTED"
  );
  const reply = database.state.messages.at(-1).content;

  assert.equal(calls.createAppointment, 0);
  assert.ok(calls.preferredSlot, "preferred slot should be checked first");
  assert.equal(getHourInMexicoCity(calls.preferredSlot.startsAt), 15);
  assert.ok(slotEvent, "alternatives should be presented");
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
  assert.equal(database.state.conversations[0].human_takeover, false);
  assert.match(reply, /no aparece disponible/i);
  assert.match(reply, /opciones disponibles/i);
  assert.doesNotMatch(reply, /America\/Mexico_City/i);
}

async function testSchedulingDeclinedKeepsMaluOwner() {
  const { service, database } = loadServiceWithFakes({ useRealIntentGuard: true });
  const phone = "999000000013";

  for (const [index, text] of [
    "Quiero una pagina web",
    "Soy dentista y quiero tener presencia en Google",
    "Solo tengo el logotipo",
    "Me interesa",
    "No gracias",
  ].entries()) {
    await service.processSimulatorInbound({
      sessionId: "sim-session-scheduling-decline",
      text,
      messageId: `sim-scheduling-decline-${index + 1}`,
      phone,
      mode: "MOCK",
    });
  }

  const schedulingEvents = database.state.activityLogs.filter(
    (activity) => activity.action === "malu_scheduling_state_changed"
  );
  assert.equal(schedulingEvents.at(-1).metadata.status, "SCHEDULING_DECLINED");
  assert.equal(database.state.conversations[0].conversation_owner, "MALU");
  assert.equal(database.state.conversations[0].human_takeover, false);
  assert.match(database.state.messages.at(-1).content, /sin agendar por ahora/i);
}

async function testScopeBlocksPureOffTopicBeforeOpenAi() {
  const { service, database, calls } = loadServiceWithFakes();

  const result = await service.processSimulatorInbound({
    sessionId: "sim-session-scope-off-topic",
    text: "Quien gano el mundial?",
    messageId: "sim-scope-off-topic-1",
    phone: "999000000021",
    mode: "LIVE_AI",
  });

  assert.equal(result.decision.usedAi, false);
  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.match(database.state.messages.at(-1).content, /fuera de lo que puedo ayudarte/i);
  assert.equal(database.state.messages.at(-1).metadata.rawPayload.responseSource, "DETERMINISTIC_SCOPE");
  assert.equal(database.state.conversations[0].off_topic_count, 1);
}

async function testScopeStopsRepeatedRecreationalUse() {
  const { service, database, calls } = loadServiceWithFakes();
  const phone = "999000000022";

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-jokes",
    text: "Cuentame un chiste.",
    messageId: "sim-scope-jokes-1",
    phone,
    mode: "LIVE_AI",
  });
  const second = await service.processSimulatorInbound({
    sessionId: "sim-session-scope-jokes",
    text: "Otro.",
    messageId: "sim-scope-jokes-2",
    phone,
    mode: "LIVE_AI",
  });
  const third = await service.processSimulatorInbound({
    sessionId: "sim-session-scope-jokes",
    text: "Vamos, uno bueno.",
    messageId: "sim-scope-jokes-3",
    phone,
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(database.state.messages.filter((message) => message.role === "ai").length, 1);
  assert.equal(
    database.state.messages.filter((message) => message.role === "ai").at(-1).metadata.rawPayload.responseSource,
    "DETERMINISTIC_SCOPE"
  );
  assert.equal(database.state.conversations[0].conversation_scope_status, "NON_COMMERCIAL_BLOCKED");
  assert.equal(second.decision.usedAi, false);
  assert.equal(third.decision.usedAi, false);
}

async function testScopeAllowsContextualHumorInsideCommercialLead() {
  const { service, database, calls } = loadServiceWithFakes();
  const phone = "999000000023";

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-humor",
    text: "Necesito un chatbot para mi negocio.",
    messageId: "sim-scope-humor-1",
    phone,
    mode: "LIVE_AI",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-humor",
    text: "Jajaja, entonces la IA trabaja mas que yo.",
    messageId: "sim-scope-humor-2",
    phone,
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 2);
  assert.equal(database.state.conversations[0].conversation_scope_status, "COMMERCIAL_ACTIVE");
  assert.equal(database.state.conversations[0].off_topic_count, 0);
}

async function testScopeReconductsTechnologyConsultingThenBlocks() {
  const { service, database, calls } = loadServiceWithFakes();
  const phone = "999000000024";

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-hosting",
    text: "Cual es el mejor hosting?",
    messageId: "sim-scope-hosting-1",
    phone,
    mode: "LIVE_AI",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-hosting",
    text: "No, dime cual es el mejor.",
    messageId: "sim-scope-hosting-2",
    phone,
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.equal(database.state.messages.filter((message) => message.role === "ai").length, 1);
  assert.match(
    database.state.messages.filter((message) => message.role === "ai").at(-1).content,
    /consulta tecnologica general/i
  );
  assert.equal(
    database.state.messages.filter((message) => message.role === "ai").at(-1).metadata.rawPayload.responseSource,
    "DETERMINISTIC_SCOPE"
  );
  assert.equal(database.state.conversations[0].conversation_scope_status, "NON_COMMERCIAL_BLOCKED");
}

async function testScopeBlocksTutorialBeforeOpenAi() {
  const { service, database, calls } = loadServiceWithFakes();

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-tutorial",
    text: "Ensename paso a paso a crear un chatbot con OpenAI.",
    messageId: "sim-scope-tutorial-1",
    phone: "999000000025",
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 0);
  assert.equal(calls.whatsapp, 0);
  assert.match(database.state.messages.at(-1).content, /solucion de GCodemaker/i);
  assert.equal(database.state.messages.at(-1).metadata.rawPayload.responseSource, "DETERMINISTIC_SCOPE");
}

async function testScopeAllowsCommercialIntentToUseAi() {
  const { service, database, calls } = loadServiceWithFakes();

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-commercial",
    text: "Necesito un chatbot para mi negocio.",
    messageId: "sim-scope-commercial-1",
    phone: "999000000026",
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 1);
  assert.equal(database.state.conversations[0].conversation_scope_status, "COMMERCIAL_ACTIVE");
}

async function testScopeReactivatesOnlyWithClearCommercialIntent() {
  const { service, database, calls } = loadServiceWithFakes();
  const phone = "999000000027";

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-reactivation",
    text: "Cuentame un chiste.",
    messageId: "sim-scope-reactivation-1",
    phone,
    mode: "LIVE_AI",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-reactivation",
    text: "Otro.",
    messageId: "sim-scope-reactivation-2",
    phone,
    mode: "LIVE_AI",
  });
  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-reactivation",
    text: "Ahora si.",
    messageId: "sim-scope-reactivation-3",
    phone,
    mode: "LIVE_AI",
  });
  assert.equal(calls.ai, 0);
  assert.equal(database.state.conversations[0].conversation_scope_status, "NON_COMMERCIAL_BLOCKED");

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-reactivation",
    text: "Ya en serio, necesito una pagina web para mi restaurante.",
    messageId: "sim-scope-reactivation-4",
    phone,
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 1);
  assert.equal(database.state.conversations[0].conversation_scope_status, "COMMERCIAL_ACTIVE");
  assert.ok(database.state.conversations[0].commercial_reactivated_at);
}

async function testScopeTreatsHostingIncludedAsPurchaseQuestion() {
  const { service, database, calls } = loadServiceWithFakes();

  await service.processSimulatorInbound({
    sessionId: "sim-session-scope-purchase-hosting",
    text: "Que hosting incluye la pagina que ustedes me hacen?",
    messageId: "sim-scope-purchase-hosting-1",
    phone: "999000000028",
    mode: "LIVE_AI",
  });

  assert.equal(calls.ai, 1);
  assert.equal(database.state.conversations[0].off_topic_count, 0);
  assert.equal(database.state.conversations[0].conversation_scope_status, "COMMERCIAL_ACTIVE");
}

function testScopeMigrationAddsConversationFields() {
  const sql = fs.readFileSync(
    path.join(__dirname, "../../db/migrations/021_gc_ai_scope_consumption_control.sql"),
    "utf8"
  );

  assert.match(sql, /conversation_scope_status TEXT NOT NULL DEFAULT 'COMMERCIAL_ACTIVE'/);
  assert.match(sql, /off_topic_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(sql, /non_commercial_blocked_at TIMESTAMPTZ/);
  assert.match(sql, /commercial_reactivated_at TIMESTAMPTZ/);
  assert.match(sql, /NON_COMMERCIAL_BLOCKED/);
}

function testScopeGuardBlocksCircumferenceQuestion() {
  delete require.cache[require.resolve(SCOPE_GUARD_PATH)];
  const scopeGuard = require(SCOPE_GUARD_PATH);
  const decision = scopeGuard.classifyMessage({
    message: "Quiero saber la circunferencia de la Tierra.",
    conversation: {
      conversation_scope_status: "COMMERCIAL_ACTIVE",
      off_topic_count: 0,
    },
    recentMessages: [],
  });

  assert.equal(decision.action, "warn_or_block");
  assert.equal(decision.reason, "pure_off_topic");
  assert.match(decision.reply, /fuera de lo que puedo ayudarte/i);
}

function testIntentGuardTransfersDecisionRequests() {
  delete require.cache[require.resolve(INTENT_GUARD_PATH)];
  const intentGuard = require(INTENT_GUARD_PATH);

  for (const text of [
    "Me puedes dar un descuento?",
    "Me garantizas una fecha especial?",
    "Puedes hacer una excepcion?",
  ]) {
    const decision = intentGuard.decideNextAction({
      message: text,
      lead: {
        ai_enabled: true,
      },
    });

    assert.equal(decision.action, "transfer_to_human");
    assert.equal(decision.humanTakeover, true);
    assert.equal(decision.disableAi, true);
    assert.equal(decision.reason, "engineer_decision_required");
  }

  const priceDecision = intentGuard.decideNextAction({
    message: "Cual es el precio de una landing?",
    lead: {
      ai_enabled: true,
    },
  });

  assert.equal(priceDecision.action, "use_ai_profiling");
  assert.equal(priceDecision.shouldUseAi, true);
  assert.equal(priceDecision.reason, "commercial_interest_profile_needed");
}

function testIntentGuardProfilesCommercialInterestBeforeTransfer() {
  delete require.cache[require.resolve(INTENT_GUARD_PATH)];
  const intentGuard = require(INTENT_GUARD_PATH);

  for (const text of [
    "Necesito responder a mis clientes en horarios no laborales, pero como si hubiera alguien en servicio.",
    "Quiero automatizar WhatsApp",
    "Quiero una pagina sencilla para mi negocio",
    "Cuanto cuesta una landing?",
    "Cuanto tarda en implementarse el servicio?",
    "Quiero conocer sus servicios",
  ]) {
    const decision = intentGuard.decideNextAction({
      message: text,
      lead: {
        ai_enabled: true,
      },
    });

    assert.equal(decision.action, "use_ai_profiling");
    assert.equal(decision.shouldUseAi, true);
    assert.equal(decision.humanTakeover, undefined);
    assert.equal(decision.disableAi, undefined);
    assert.equal(decision.reason, "commercial_interest_profile_needed");
  }
}

function testIntentGuardLetsAmbiguousProfilingFollowupsReachAi() {
  delete require.cache[require.resolve(INTENT_GUARD_PATH)];
  const intentGuard = require(INTENT_GUARD_PATH);

  for (const text of [
    "alrededor de 10",
    "tengo un consultorio y quiero resolver dudas de los pacientes",
    "solo tengo el logo",
  ]) {
    const decision = intentGuard.decideNextAction({
      message: text,
      lead: {
        ai_enabled: true,
      },
    });

    assert.equal(decision.action, "use_ai_profiling");
    assert.equal(decision.shouldUseAi, true);
    assert.equal(decision.shouldReply, true);
    assert.equal(decision.reply, undefined);
  }
}

function testMigrationBackfillsConversationOwner() {
  const sql = fs.readFileSync(
    path.join(__dirname, "../../db/migrations/019_gc_ai_handoff_policy.sql"),
    "utf8"
  );

  assert.match(sql, /conversation_owner TEXT/);
  assert.match(sql, /WHEN human_takeover IS TRUE THEN 'INGENIERO'/);
  assert.match(sql, /ELSE 'MALU'/);
  assert.match(sql, /post_handoff_interaction_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(sql, /CHECK \(conversation_owner IN \('MALU', 'INGENIERO'\)\)/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS idx_gc_ai_messages_provider_message_id_unique/);
  assert.match(sql, /WHERE provider_message_id IS NOT NULL/);
}

function testMaluKnowledgeFilesRemainAnchored() {
  const aiAgentSource = fs.readFileSync(path.join(__dirname, "../ai-agent.service.js"), "utf8");
  const intentGuardSource = fs.readFileSync(path.join(__dirname, "../intent-guard.service.js"), "utf8");
  const { buildMaluBusinessKnowledgePrompt } = require("../../knowledge/malu-business-knowledge");
  const businessKnowledgePrompt = buildMaluBusinessKnowledgePrompt();
  const originalPromptKnowledge = `GCodemaker ofrece paginas web profesionales, landing pages, sistemas web a medida,
automatizaciones con IA, chatbots para WhatsApp/Instagram/Facebook e integraciones
digitales para negocios.

Tu trabajo:
- perfilar brevemente al prospecto;
- responder solo dudas relacionadas con servicios digitales de GCodemaker;
- no actuar como ChatGPT general;
- comunicar unicamente precios base expresamente autorizados, sin inventar cotizaciones finales;
- no hacer mas de una pregunta principal por respuesta;
- responder primero lo que este cubierto por el conocimiento autorizado antes de proponer una transferencia humana.`;

  assert.match(aiAgentSource, /REGLAS OPERATIVAS COMPLEMENTARIAS DE MALU/);
  assert.match(aiAgentSource, /MODELO COGNITIVO DE MALU/);
  assert.match(aiAgentSource, /buildMaluBusinessKnowledgePrompt/);
  assert.ok(aiAgentSource.includes(originalPromptKnowledge));
  assert.match(aiAgentSource, /paginas web profesionales, landing pages, sistemas web a medida/);
  assert.match(aiAgentSource, /precios base expresamente autorizados/);
  assert.match(aiAgentSource, /Antes de transferir una conversacion/);
  assert.match(aiAgentSource, /Para tiempos de implementacion/);
  assert.match(aiAgentSource, /ingeniero responsable/);
  assert.doesNotMatch(aiAgentSource, /transferir a Genaro/);
  assert.match(aiAgentSource, /buildImplementationTimingReply/);
  assert.match(aiAgentSource, /shouldTransferToHuman: false/);
  assert.match(businessKnowledgePrompt, /BUSINESS KNOWLEDGE AUTORIZADO DE GCODemaker/);
  assert.match(businessKnowledgePrompt, /Landing Esencial/);
  assert.match(businessKnowledgePrompt, /\$2,500 MXN/);
  assert.match(businessKnowledgePrompt, /Agente de IA Base/);
  assert.match(businessKnowledgePrompt, /\$1,900 MXN mensuales/);
  assert.match(businessKnowledgePrompt, /IA Respuestas/);
  assert.match(businessKnowledgePrompt, /IA Perfilador/);
  assert.match(businessKnowledgePrompt, /IA Comercial/);
  assert.match(aiAgentSource, /problema principal, objetivo del negocio, contexto operativo/);
  assert.match(aiAgentSource, /Pregunta solo cuando la respuesta reduzca incertidumbre/);
  assert.match(aiAgentSource, /orienta primero y ofrece transferencia/);
  assert.match(aiAgentSource, /El exito es entregar contexto claro y util/);
  assert.doesNotMatch(intentGuardSource, /Para ubicar mejor tu caso/);
  assert.match(
    intentGuardSource,
    /Voy a pasar tu caso con el ingeniero responsable para que pueda orientarte mejor y darte una propuesta adecuada/
  );
  assert.doesNotMatch(intentGuardSource, /Voy a pasar tu caso con Genaro/);
}

async function main() {
  await testNewMessageProcessesAsBefore();
  await testOwnerSenderUsesInternalFlowWithoutLead();
  await testOwnerEquivalentPhoneNormalizationMatchesExactly();
  await testDifferentPhoneIsNotOwner();
  await testOwnerClaimFromDifferentPhoneStaysCommercial();
  await testOwnerFlowDoesNotRunCommercialGuards();
  await testFirstReplyIdentifiesMaluOnlyOnce();
  await testTransferSetsEngineerOwner();
  await testAiTransferSetsEngineerOwner();
  await testDuplicateProviderMessageIdDoesNotRepeatEffects();
  await testNullProviderMessageIdRemainsAllowed();
  await testFirstPostHandoffInboundAsksForContact();
  await testAffirmativePostHandoffRegistersNotification();
  await testPostHandoffNegativeOrInsistenceDoesNotReactivateAi();
  await testPostHandoffStopsAfterFourAutoReplies();
  await testDemoDoesNotReactivateTransferredConversation();
  await testAutoReplyDisabledStillSavesMessagesWithoutSending();
  await testSimulatorMockUsesRealFlowWithoutOpenAiOrMeta();
  await testSimulatorMockProfilesLandingWithoutTransfer();
  await testSimulatorMockKeepsAgentContextForAdditionalCosts();
  await testSimulatorMockAnswersContextualAgentFollowups();
  await testSimulatorMockListsAiPackagesAndDiscountRules();
  await testSimulatorMockKeepsLandingContextForAdditionalCosts();
  await testSimulatorMockClarifiesContextlessCostQuestion();
  await testSimulatorMockHandlesServiceComparisonAndSwitch();
  await testSimulatorMockDoesNotRepeatKnownVolumeQuestion();
  await testSimulatorDuplicateMessageDoesNotReplyTwice();
  await testSimulatorTransferAndPostHandoffDoesNotUseOpenAi();
  await testRealGuardHumanRequestUsesInstitutionalLanguage();
  await testSchedulingOfferKeepsMaluOwnerUntilAppointment();
  await testSchedulingMockConfirmsAppointmentThenFinalizesHandoff();
  await testSchedulingInPersonAvailableOnlyForCdmx();
  await testSchedulingOutsideCdmxDoesNotOfferInPerson();
  await testSchedulingRespectsCdmxVideoPreference();
  await testSchedulingUnknownLocationAsksNaturallyBeforeClosing();
  await testSchedulingRemoteFromStartDoesNotRequireLocation();
  await testSchedulingCalendarFailureDoesNotFinalizeHandoff();
  await testDirectRequestedSlotRequiresConfirmedGoogleEventBeforeHandoff();
  await testInPersonModalityPersistsAfterLocationProvided();
  await testDirectRequestedSlotWithGoogleEventFinalizesHandoff();
  await testRequestedSlotAvailableIsBookedDirectlyWithoutAlternatives();
  await testRequestedSlotOccupiedOffersAlternativesWithoutCreatingAppointment();
  await testSchedulingDeclinedKeepsMaluOwner();
  await testScopeBlocksPureOffTopicBeforeOpenAi();
  await testScopeStopsRepeatedRecreationalUse();
  await testScopeAllowsContextualHumorInsideCommercialLead();
  await testScopeReconductsTechnologyConsultingThenBlocks();
  await testScopeBlocksTutorialBeforeOpenAi();
  await testScopeAllowsCommercialIntentToUseAi();
  await testScopeReactivatesOnlyWithClearCommercialIntent();
  await testScopeTreatsHostingIncludedAsPurchaseQuestion();
  testIntentGuardTransfersDecisionRequests();
  testIntentGuardProfilesCommercialInterestBeforeTransfer();
  testIntentGuardLetsAmbiguousProfilingFollowupsReachAi();
  testMigrationBackfillsConversationOwner();
  testScopeMigrationAddsConversationFields();
  testScopeGuardBlocksCircumferenceQuestion();
  testMaluKnowledgeFilesRemainAnchored();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
