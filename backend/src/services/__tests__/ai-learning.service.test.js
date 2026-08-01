const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SERVICE_PATH = "../ai-admin.service";
const DB_PATH = "../../db";
const DEMO_MODE_PATH = "../demo-mode.service";
const AUTH_PATH = "../../middleware/ai-admin-auth.middleware";
const ENV_PATH = "../../config/env";

function createState() {
  return {
    conversations: [
      {
        id: "conversation-1",
        lead_id: "lead-1",
        channel: "whatsapp",
        status: "open",
        conversation_owner: "MALU",
        human_takeover: false,
        post_handoff_interaction_count: 0,
        created_at: new Date("2026-01-01T10:00:00Z"),
        updated_at: new Date("2026-01-01T10:02:00Z"),
      },
    ],
    leads: [
      {
        id: "lead-1",
        name: "Cliente",
        phone: "5215551234567",
      },
    ],
    messages: [
      {
        id: "message-1",
        conversation_id: "conversation-1",
        lead_id: "lead-1",
        role: "lead",
        content: "Necesito una landing",
        provider: "whatsapp_webhook",
        provider_message_id: "wamid-in-1",
        message_type: "text",
        metadata: { secretLike: "not-returned" },
        created_at: new Date("2026-01-01T10:00:00Z"),
      },
      {
        id: "message-2",
        conversation_id: "conversation-1",
        lead_id: "lead-1",
        role: "ai",
        content: "Claro, puedo orientarte.",
        provider: "whatsapp_cloud_api",
        provider_message_id: "wamid-out-1",
        message_type: "text",
        metadata: { providerRaw: "not-returned" },
        created_at: new Date("2026-01-01T10:01:00Z"),
      },
    ],
    reviews: [],
    findings: [],
    frameworkVersions: [],
  };
}

function getMetrics(state, conversationId) {
  const conversation = state.conversations.find((item) => item.id === conversationId);
  const messages = state.messages.filter((message) => message.conversation_id === conversationId);
  const review = state.reviews.find((item) => item.conversation_id === conversationId);

  return {
    inbound_count: messages.filter((message) => message.role === "lead").length,
    outbound_count: messages.filter((message) => message.role === "ai").length,
    ai_response_count: messages.filter(
      (message) => message.role === "ai" && message.provider === "whatsapp_cloud_api"
    ).length,
    conversation_duration: "00:01:00",
    had_handoff: conversation.human_takeover || conversation.conversation_owner === "INGENIERO",
    post_handoff_interaction_count: conversation.post_handoff_interaction_count,
    customer_abandoned_before_handoff: false,
    required_repeat_questions: review?.required_repeat_questions || null,
  };
}

function createPool(state) {
  return {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (normalized.includes("FROM gc_ai_conversations conversations") && normalized.includes("COALESCE(reviews.review_status")) {
        const rows = state.conversations.map((conversation) => {
          const lead = state.leads.find((item) => item.id === conversation.lead_id);
          const review = state.reviews.find((item) => item.conversation_id === conversation.id);
          return {
            conversation_id: conversation.id,
            lead_id: conversation.lead_id,
            channel: conversation.channel,
            conversation_status: conversation.status,
            conversation_owner: conversation.conversation_owner,
            human_takeover: conversation.human_takeover,
            lead_name: lead.name,
            lead_phone: lead.phone,
            review_status: review?.review_status || null,
            ...getMetrics(state, conversation.id),
          };
        });
        return { rows };
      }

      if (normalized.includes("FROM gc_ai_conversations conversations") && normalized.includes("WHERE conversations.id = $1")) {
        const conversation = state.conversations.find((item) => item.id === params[0]);
        if (!conversation) {
          return { rows: [] };
        }
        const lead = state.leads.find((item) => item.id === conversation.lead_id);
        const review = state.reviews.find((item) => item.conversation_id === conversation.id);
        return {
          rows: [
            {
              ...conversation,
              lead_name: lead.name,
              lead_phone: lead.phone,
              review_id: review?.id || null,
              review_status: review?.review_status || null,
              ...getMetrics(state, conversation.id),
            },
          ],
        };
      }

      if (normalized.includes("FROM gc_ai_messages") && normalized.includes("WHERE conversation_id = $1")) {
        return {
          rows: state.messages.filter((message) => message.conversation_id === params[0]),
        };
      }

      if (normalized.startsWith("INSERT INTO gc_ai_conversation_reviews")) {
        const review = {
          id: params[0],
          conversation_id: params[1],
          reviewer_user_id: params[2],
          review_status: params[3],
          discovery_score: params[4],
          context_quality_score: params[5],
          question_efficiency_score: params[6],
          handoff_quality_score: params[7],
          customer_friction_score: params[8],
          required_repeat_questions: params[9],
          transferred_too_early: params[10],
          transferred_too_late: params[11],
          asked_irrelevant_questions: params[12],
          invented_information: params[13],
          notes: params[14],
          reviewed_at: params[3] === "REVIEWED" ? new Date() : null,
        };
        state.reviews = state.reviews.filter((item) => item.conversation_id !== params[1]);
        state.reviews.push(review);
        return { rows: [review] };
      }

      if (normalized.startsWith("INSERT INTO gc_ai_learning_findings")) {
        const finding = {
          id: params[0],
          finding_code: params[1],
          title: params[2],
          description: params[3],
          evidence_summary: params[4],
          sample_conversation_ids: JSON.parse(params[5]),
          detected_pattern: params[6],
          expected_impact: params[7],
          proposed_change: params[8],
          affected_layer: params[9],
          status: params[10],
          source_version: params[11],
          target_version: params[12],
          created_by: params[13],
        };
        state.findings.push(finding);
        return { rows: [finding] };
      }

      if (normalized.includes("FROM gc_ai_learning_findings")) {
        return { rows: state.findings };
      }

      if (normalized.startsWith("UPDATE gc_ai_learning_findings")) {
        const finding = state.findings.find(
          (item) => item.id === params[0] || item.finding_code === params[0]
        );
        if (!finding) {
          return { rows: [] };
        }
        finding.status = params[1];
        finding.target_version = params[2] || finding.target_version;
        return { rows: [finding] };
      }

      if (normalized.startsWith("INSERT INTO gc_ai_framework_versions")) {
        const frameworkVersion = {
          id: params[0],
          framework_name: params[1],
          version: params[2],
          change_summary: params[3],
          source_finding_ids: JSON.parse(params[4]),
          status: params[5],
          created_by: params[6],
        };
        state.frameworkVersions.push(frameworkVersion);
        return { rows: [frameworkVersion] };
      }

      throw new Error(`Unhandled query: ${normalized}`);
    },
  };
}

function loadService() {
  const state = createState();

  for (const modulePath of [SERVICE_PATH, DB_PATH, DEMO_MODE_PATH]) {
    delete require.cache[require.resolve(modulePath)];
  }

  require.cache[require.resolve(DB_PATH)] = {
    exports: {
      pool: createPool(state),
    },
  };
  require.cache[require.resolve(DEMO_MODE_PATH)] = {
    exports: {},
  };

  return {
    service: require(SERVICE_PATH),
    state,
  };
}

async function testCreateValidReview() {
  const { service, state } = loadService();
  const review = await service.saveConversationReview({
    conversationId: "conversation-1",
    reviewerUserId: "admin-1",
    review: {
      discoveryScore: 5,
      contextQualityScore: 4,
      questionEfficiencyScore: 4,
      handoffQualityScore: 5,
      customerFrictionScore: 2,
      requiredRepeatQuestions: false,
      notes: "Buen contexto.",
    },
  });

  assert.equal(review.review_status, "REVIEWED");
  assert.equal(review.discovery_score, 5);
  assert.equal(state.reviews.length, 1);
}

async function testRejectInvalidScore() {
  const { service } = loadService();

  await assert.rejects(
    () =>
      service.saveConversationReview({
        conversationId: "conversation-1",
        review: {
          discoveryScore: 6,
        },
      }),
    /discoveryScore debe estar entre 1 y 5/
  );
}

async function testConversationDetailIncludesMessagesWithoutMetadata() {
  const { service } = loadService();
  const detail = await service.getLearningConversationDetail({
    conversationId: "conversation-1",
  });

  assert.equal(detail.conversation_owner, "MALU");
  assert.equal(detail.lead_phone, "*********4567");
  assert.equal(detail.messages.length, 2);
  assert.equal(detail.messages[0].content, "Necesito una landing");
  assert.equal(detail.messages[0].metadata, undefined);
}

async function testUnauthorizedAdminDenied() {
  delete require.cache[require.resolve(AUTH_PATH)];
  delete require.cache[require.resolve(ENV_PATH)];
  require.cache[require.resolve(ENV_PATH)] = {
    exports: {
      gcAiAdminKey: "expected-admin-key",
    },
  };
  const { requireAiAdmin } = require(AUTH_PATH);
  const req = {
    header() {
      return null;
    },
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  let nextCalled = false;

  requireAiAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
}

async function testCreateFindingAndChangeStatus() {
  const { service, state } = loadService();
  const finding = await service.createLearningFinding({
    createdBy: "admin-1",
    finding: {
      findingCode: "MALU-FINDING-001",
      title: "Repeticion de preguntas",
      description: "Se detecto una pregunta repetida.",
      evidenceSummary: "Una conversacion revisada.",
      sampleConversationIds: ["conversation-1"],
      detectedPattern: "Pregunta ya contestada",
      expectedImpact: "Menos friccion",
      proposedChange: "Ajuste futuro de criterio",
      affectedLayer: "COGNITIVE_LAYER",
    },
  });
  const updated = await service.updateLearningFindingStatus({
    findingId: finding.id,
    status: "UNDER_REVIEW",
  });

  assert.equal(finding.sample_conversation_ids[0], "conversation-1");
  assert.equal(updated.status, "UNDER_REVIEW");
  assert.equal(state.findings.length, 1);
}

async function testImplementedRequiresTargetVersion() {
  const { service } = loadService();

  await assert.rejects(
    () =>
      service.updateLearningFindingStatus({
        findingId: "MALU-FINDING-001",
        status: "IMPLEMENTED",
      }),
    /targetVersion es obligatorio/
  );
}

async function testRegisterFrameworkVersion() {
  const { service } = loadService();
  const version = await service.createFrameworkVersion({
    createdBy: "admin-1",
    version: {
      frameworkName: "MALU_COGNITIVE_LAYER",
      version: "1.0.1",
      changeSummary: "Registro de trazabilidad.",
      sourceFindingIds: ["MALU-FINDING-001"],
      status: "DRAFT",
    },
  });

  assert.equal(version.framework_name, "MALU_COGNITIVE_LAYER");
  assert.equal(version.version, "1.0.1");
  assert.equal(version.source_finding_ids[0], "MALU-FINDING-001");
}

function testContinuousLearningMigrationShape() {
  const sql = fs.readFileSync(
    path.join(__dirname, "../../db/migrations/020_gc_ai_continuous_learning.sql"),
    "utf8"
  );

  assert.match(sql, /CREATE TABLE IF NOT EXISTS gc_ai_conversation_reviews/);
  assert.match(sql, /CHECK \(discovery_score IS NULL OR discovery_score BETWEEN 1 AND 5\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS gc_ai_learning_findings/);
  assert.match(sql, /affected_layer IN/);
  assert.match(sql, /status <> 'IMPLEMENTED' OR target_version IS NOT NULL/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS gc_ai_framework_versions/);
  assert.match(sql, /UNIQUE \(framework_name, version\)/);
  assert.match(sql, /CREATE OR REPLACE VIEW gc_ai_conversation_review_metrics/);
}

async function main() {
  await testCreateValidReview();
  await testRejectInvalidScore();
  await testConversationDetailIncludesMessagesWithoutMetadata();
  await testUnauthorizedAdminDenied();
  await testCreateFindingAndChangeStatus();
  await testImplementedRequiresTargetVersion();
  await testRegisterFrameworkVersion();
  testContinuousLearningMigrationShape();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
