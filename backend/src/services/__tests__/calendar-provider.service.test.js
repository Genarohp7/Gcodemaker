const assert = require("node:assert/strict");
const http = require("node:http");

const ENV_PATH = "../../config/env";
const DB_PATH = "../../db";
const GOOGLE_APIS_PATH = "googleapis";
const OAUTH_PATH = "../google-calendar-oauth.service";
const OAUTH_STATE_PATH = "../google-calendar-oauth-state.service";
const GOOGLE_CALENDAR_PATH = "../google-calendar-availability.service";
const GOOGLE_CALENDAR_CONNECTION_PATH = "../google-calendar-connection.service";
const CALENDAR_PROVIDER_PATH = "../calendar-provider.service";
const CALENDAR_ADMIN_CONTROLLER_PATH = "../../controllers/calendar-admin.controller";
const MOCK_CALENDAR_PATH = "../calendar-availability.service";
const APP_PATH = "../../app";
const ROUTES_PATH = "../../routes";
const CALENDAR_ADMIN_ROUTES_PATH = "../../routes/calendar-admin.routes";
const AI_ADMIN_ROUTES_PATH = "../../routes/ai-admin.routes";
const AI_ADMIN_MIDDLEWARE_PATH = "../../middleware/ai-admin-auth.middleware";
const DEMO_ROUTES_PATH = "../../routes/demo.routes";
const WHATSAPP_AGENT_ROUTES_PATH = "../../routes/whatsapp-agent.routes";
const BROADCAST_ROUTES_PATH = "../../routes/broadcast.routes";
const MALU_SIMULATOR_ROUTES_PATH = "../../routes/malu-simulator.routes";
const MALU_QA_AUTH_MIDDLEWARE_PATH = "../../middleware/malu-qa-auth.middleware";
const BROADCAST_DB_SERVICE_PATH = "../broadcast-db.service";

function clearModules() {
  for (const modulePath of [
    ENV_PATH,
    DB_PATH,
    GOOGLE_APIS_PATH,
    OAUTH_PATH,
    OAUTH_STATE_PATH,
    GOOGLE_CALENDAR_PATH,
    GOOGLE_CALENDAR_CONNECTION_PATH,
    CALENDAR_PROVIDER_PATH,
    CALENDAR_ADMIN_CONTROLLER_PATH,
    APP_PATH,
    ROUTES_PATH,
    CALENDAR_ADMIN_ROUTES_PATH,
    AI_ADMIN_ROUTES_PATH,
    AI_ADMIN_MIDDLEWARE_PATH,
    DEMO_ROUTES_PATH,
    WHATSAPP_AGENT_ROUTES_PATH,
    BROADCAST_ROUTES_PATH,
    MALU_SIMULATOR_ROUTES_PATH,
    MALU_QA_AUTH_MIDDLEWARE_PATH,
    BROADCAST_DB_SERVICE_PATH,
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
}

function loadCalendarModules({ env = {}, google = {}, db = {} } = {}) {
  clearModules();

  const insertedAppointments = [];
  const calendarConnections = [];
  const calendarCalls = {
    freebusy: 0,
    eventsInsert: 0,
    getToken: 0,
    lastFreebusyRequest: null,
    lastEventRequest: null,
    lastSetCredentials: null,
    revokedToken: null,
  };
  const fakeDb = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (db.query) {
        return db.query(sql, params, { insertedAppointments });
      }

      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) {
        return { rows: [] };
      }

      if (normalized.includes("FROM gc_ai_calendar_connections")) {
        const rows = calendarConnections
          .filter((connection) => connection.provider === params[0] && connection.status === "ACTIVE")
          .sort((a, b) => b.created_at - a.created_at);
        return {
          rows,
        };
      }

      if (normalized.startsWith("UPDATE gc_ai_calendar_connections") && normalized.includes("WHERE provider")) {
        for (const connection of calendarConnections) {
          if (connection.provider === params[0] && connection.status === "ACTIVE") {
            connection.status = "DISCONNECTED";
            connection.encrypted_refresh_token = null;
            connection.disconnected_at = new Date();
            connection.updated_at = new Date();
          }
        }
        return { rows: [] };
      }

      if (normalized.startsWith("UPDATE gc_ai_calendar_connections") && normalized.includes("WHERE id")) {
        for (const connection of calendarConnections) {
          if (connection.id === params[0]) {
            connection.status = "DISCONNECTED";
            connection.encrypted_refresh_token = null;
            connection.disconnected_at = new Date();
            connection.updated_at = new Date();
          }
        }
        return { rows: [] };
      }

      if (normalized.startsWith("INSERT INTO gc_ai_calendar_connections")) {
        const connection = {
          id: params[0],
          provider: params[1],
          calendar_id: params[2],
          encrypted_refresh_token: params[3],
          status: "ACTIVE",
          scopes: JSON.parse(params[4]),
          token_version: "v1",
          connected_at: new Date(),
          disconnected_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        calendarConnections.push(connection);

        return { rows: [connection] };
      }

      if (normalized.includes("FROM gc_ai_calendar_appointments")) {
        return {
          rows: insertedAppointments.filter(
            (appointment) => appointment.idempotency_key === params[0]
          ),
        };
      }

      if (normalized.startsWith("INSERT INTO gc_ai_calendar_appointments")) {
        if (!insertedAppointments.some((appointment) => appointment.idempotency_key === params[11])) {
          insertedAppointments.push({
            id: params[0],
            conversation_id: params[1],
            lead_id: params[2],
            modality: params[3],
            starts_at: new Date(params[4]),
            ends_at: new Date(params[5]),
            engineer_timezone: params[6],
            prospect_timezone: params[7],
            location: JSON.parse(params[8]),
            google_calendar_event_id: params[9],
            google_meet_link: params[10],
            idempotency_key: params[11],
            confirmed_at: new Date(params[12]),
          });
        }

        return { rows: [] };
      }

      throw new Error(`Unhandled calendar query: ${normalized}`);
    },
  };

  class FakeOAuth2 {
    constructor(clientId, clientSecret, redirectUri) {
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.redirectUri = redirectUri;
      this.credentials = null;
    }

    generateAuthUrl(options) {
      return `https://accounts.google.com/o/oauth2/v2/auth?access_type=${options.access_type}&prompt=${options.prompt}&state=${options.state}&scope=${encodeURIComponent(options.scope.join(" "))}`;
    }

    async getToken() {
      calendarCalls.getToken += 1;
      return google.tokenResponse || {
        tokens: {
          access_token: "fake-access-token",
          refresh_token: "fake-refresh-token",
          expiry_date: 123,
          scope:
            "https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.events",
        },
      };
    }

    setCredentials(credentials) {
      this.credentials = credentials;
      calendarCalls.lastSetCredentials = credentials;
    }

    async revokeToken(token) {
      calendarCalls.revokedToken = token;
    }
  }

  require.cache[require.resolve(ENV_PATH)] = {
    exports: {
      nodeEnv: "development",
      googleCalendarEnabled: false,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      googleRedirectUri: "http://localhost:3000/admin/calendar/google/callback",
      googleCalendarId: "primary",
      googleRefreshToken: "",
      googleTokenEncryptionKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      googleCalendarTimeZone: "America/Mexico_City",
      googleCalendarDefaultDurationMinutes: 30,
      googleCalendarLookaheadDays: 14,
      googleCalendarMinNoticeHours: 0,
      googleCalendarBufferMinutes: 15,
      gcAiAdminKey: "admin-key",
      ...env,
    },
  };
  require.cache[require.resolve(DB_PATH)] = {
    exports: {
      pool: fakeDb,
    },
  };
  require.cache[require.resolve(GOOGLE_APIS_PATH)] = {
    exports: {
      google: {
        auth: {
          OAuth2: google.OAuth2 || FakeOAuth2,
        },
        calendar() {
          return {
            freebusy: {
              async query(request) {
                calendarCalls.freebusy += 1;
                calendarCalls.lastFreebusyRequest = request;
                return google.freebusyResponse || {
                  data: {
                    calendars: {
                      primary: {
                        busy: [],
                      },
                    },
                  },
                };
              },
            },
            events: {
              async insert(request) {
                calendarCalls.eventsInsert += 1;
                calendarCalls.lastEventRequest = request;
                if (google.eventsInsertError) {
                  throw google.eventsInsertError;
                }

                return google.eventsInsertResponse || {
                  data: {
                    id: "google-event-1",
                    hangoutLink: request.requestBody.conferenceData
                      ? "https://meet.google.com/mock"
                      : null,
                    start: {
                      dateTime: request.requestBody.start.dateTime,
                      timeZone: request.requestBody.start.timeZone,
                    },
                    end: {
                      dateTime: request.requestBody.end.dateTime,
                      timeZone: request.requestBody.end.timeZone,
                    },
                  },
                };
              },
            },
          };
        },
      },
    },
  };

  return {
    calls: calendarCalls,
    insertedAppointments,
    calendarConnections,
    oauth: require(OAUTH_PATH),
    googleCalendar: require(GOOGLE_CALENDAR_PATH),
    connection: require(GOOGLE_CALENDAR_CONNECTION_PATH),
    oauthState: require(OAUTH_STATE_PATH),
    provider: require(CALENDAR_PROVIDER_PATH),
    controller: require(CALENDAR_ADMIN_CONTROLLER_PATH),
  };
}

function request(server, { method = "GET", path, headers = {} }) {
  const address = server.address();

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: "127.0.0.1",
        port: address.port,
        path,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = body ? JSON.parse(body) : null;
          } catch {
            json = null;
          }
          resolve({
            statusCode: res.statusCode,
            body,
            json,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

async function withTestServer(callback) {
  const { calls } = loadCalendarModules();
  const express = require("express");
  for (const modulePath of [
    DEMO_ROUTES_PATH,
    WHATSAPP_AGENT_ROUTES_PATH,
    BROADCAST_ROUTES_PATH,
    MALU_SIMULATOR_ROUTES_PATH,
  ]) {
    require.cache[require.resolve(modulePath)] = {
      exports: express.Router(),
    };
  }
  const app = require(APP_PATH);
  const server = app.listen(0);

  try {
    return await callback(server, calls);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function createResponse() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    send(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function createMiddlewareRequest(headers = {}) {
  return {
    get(name) {
      return headers[String(name).toLowerCase()] || "";
    },
  };
}

function loadMaluQaMiddleware({ env = {}, session = null } = {}) {
  clearModules();
  require.cache[require.resolve(ENV_PATH)] = {
    exports: {
      gcAiAdminKey: "admin-key",
      gcMaluQaPanelEnabled: false,
      ...env,
    },
  };
  require.cache[require.resolve(BROADCAST_DB_SERVICE_PATH)] = {
    exports: {
      verifySessionToken() {
        return session;
      },
    },
  };

  return require(MALU_QA_AUTH_MIDDLEWARE_PATH);
}

async function testMaluQaPanelRequiresFeatureFlagAndAdmin() {
  const disabled = loadMaluQaMiddleware();
  const disabledResponse = createResponse();
  let nextCalled = false;

  disabled.requireMaluQaPanelEnabled(
    createMiddlewareRequest({ "x-admin-key": "admin-key" }),
    disabledResponse,
    () => {
      nextCalled = true;
    }
  );
  assert.equal(disabledResponse.statusCode, 403);
  assert.equal(nextCalled, false);

  const enabledNoAuth = loadMaluQaMiddleware({
    env: {
      gcMaluQaPanelEnabled: true,
    },
  });
  const noAuthResponse = createResponse();
  enabledNoAuth.requireMaluQaAdmin(createMiddlewareRequest(), noAuthResponse, () => {
    nextCalled = true;
  });
  assert.equal(noAuthResponse.statusCode, 401);

  const enabledWithKey = loadMaluQaMiddleware({
    env: {
      gcMaluQaPanelEnabled: true,
    },
  });
  let backendKeyAllowed = false;
  enabledWithKey.requireMaluQaAdmin(
    createMiddlewareRequest({ "x-admin-key": "admin-key" }),
    createResponse(),
    () => {
      backendKeyAllowed = true;
    }
  );
  assert.equal(backendKeyAllowed, true);

  const enabledWithAdminSession = loadMaluQaMiddleware({
    env: {
      gcMaluQaPanelEnabled: true,
    },
    session: {
      role: "admin_cliente",
      sub: "admin-user",
    },
  });
  let adminSessionAllowed = false;
  enabledWithAdminSession.requireMaluQaAdmin(
    createMiddlewareRequest({ authorization: "Bearer signed-session" }),
    createResponse(),
    () => {
      adminSessionAllowed = true;
    }
  );
  assert.equal(adminSessionAllowed, true);

  const enabledWithOperatorSession = loadMaluQaMiddleware({
    env: {
      gcMaluQaPanelEnabled: true,
    },
    session: {
      role: "operador_cliente",
      sub: "operator-user",
    },
  });
  const operatorResponse = createResponse();
  let operatorAllowed = false;
  enabledWithOperatorSession.requireMaluQaAdmin(
    createMiddlewareRequest({ authorization: "Bearer signed-session" }),
    operatorResponse,
    () => {
      operatorAllowed = true;
    }
  );
  assert.equal(operatorResponse.statusCode, 401);
  assert.equal(operatorAllowed, false);
}

async function testMockProviderContinuesWorking() {
  const { provider: providerService } = loadCalendarModules();
  delete require.cache[require.resolve(MOCK_CALENDAR_PATH)];

  assert.equal(providerService.getCalendarProviderName(), "MOCK");
  const slots = await providerService.getCalendarProvider().getAvailableSlots({
    modality: "VIDEOLLAMADA",
  });
  assert.equal(slots.length, 3);
  assert.equal(slots[0].simulated, true);
}

async function testGoogleDisabledDoesNotCallGoogle() {
  const { googleCalendar, calls } = loadCalendarModules();

  await assert.rejects(
    () => googleCalendar.getAvailableSlots(),
    /Google Calendar deshabilitado/
  );
  assert.equal(calls.freebusy, 0);
}

async function testMissingCredentialsFailsSafely() {
  const { googleCalendar } = loadCalendarModules({
    env: {
      googleCalendarEnabled: true,
      googleRefreshToken: "",
    },
  });

  await assert.rejects(
    () => googleCalendar.getAvailableSlots(),
    /refresh token/
  );
}

function testOauthUrlUsesMinimumScopes() {
  const { oauth } = loadCalendarModules();
  const url = oauth.getAuthorizationUrl({ state: "state-id" });

  assert.match(url, /calendar\.freebusy/);
  assert.match(url, /calendar\.events/);
  assert.doesNotMatch(url, /auth%2Fcalendar(?:%20|$)/);
  assert.match(url, /access_type=offline/);
  assert.match(url, /prompt=consent/);
}

function testOAuthAdminUrlGeneratesSecureState() {
  const { controller } = loadCalendarModules();
  const res = createResponse();

  controller.getGoogleAuthorizationUrl({ query: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.payload.data.authorizationUrl, /state=/);
  assert.match(res.payload.data.authorizationUrl, new RegExp(res.payload.data.state));
  assert.match(res.payload.data.state, /^[A-Za-z0-9_-]{32,}$/);
  assert.doesNotMatch(res.payload.data.state, /secret|token|google-client-secret/i);
}

async function testOAuthControllerDoesNotExposeRefreshToken() {
  const { controller } = loadCalendarModules();
  const res = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code",
      },
    },
    res
  );

  const serialized = JSON.stringify(res.payload);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.data.hasRefreshToken, true);
  assert.equal(res.payload.data.encryptedRefreshTokenReady, true);
  assert.doesNotMatch(serialized, /fake-refresh-token/);
  assert.doesNotMatch(serialized, /fake-access-token/);
}

async function testOAuthGetCallbackReadsQueryAndDoesNotExposeTokens() {
  const { controller, calls } = loadCalendarModules();
  const stateResponse = createResponse();
  const res = createResponse();

  controller.getGoogleAuthorizationUrl({ query: {} }, stateResponse);
  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        code: "fake-code",
        state: stateResponse.payload.data.state,
      },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(calls.getToken, 1);
  assert.match(res.payload, /Google Calendar autorizado correctamente/);
  assert.doesNotMatch(res.payload, /fake-refresh-token/);
  assert.doesNotMatch(res.payload, /fake-access-token/);
}

async function testOAuthCallbackPersistsEncryptedRefreshToken() {
  const { controller, calendarConnections } = loadCalendarModules();
  const res = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code",
      },
    },
    res
  );

  const serialized = JSON.stringify(res.payload);
  assert.equal(res.statusCode, 200);
  assert.equal(calendarConnections.length, 1);
  assert.equal(calendarConnections[0].status, "ACTIVE");
  assert.ok(calendarConnections[0].encrypted_refresh_token);
  assert.notEqual(calendarConnections[0].encrypted_refresh_token, "fake-refresh-token");
  assert.doesNotMatch(serialized, /fake-refresh-token|fake-access-token|v1:/);
}

async function testCalendarStatusDoesNotExposeRefreshTokenOrCiphertext() {
  const { controller } = loadCalendarModules();
  const callbackResponse = createResponse();
  const statusResponse = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code",
      },
    },
    callbackResponse
  );
  await controller.getCalendarStatus({}, statusResponse);

  const serialized = JSON.stringify(statusResponse.payload);
  assert.equal(statusResponse.statusCode, 200);
  assert.equal(statusResponse.payload.data.connected, true);
  assert.equal(statusResponse.payload.data.connectionStatus, "ACTIVE");
  assert.equal(statusResponse.payload.data.configured.refreshToken, true);
  assert.doesNotMatch(serialized, /fake-refresh-token|fake-access-token|v1:/);
}

async function testActiveConnectionTakesPriorityOverEnvRefreshToken() {
  const { controller, connection } = loadCalendarModules({
    env: {
      googleRefreshToken: "env-refresh-token",
    },
  });
  const callbackResponse = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code",
      },
    },
    callbackResponse
  );

  const refreshToken = await connection.getRefreshTokenForGoogleCalendar();
  assert.equal(refreshToken, "fake-refresh-token");
}

async function testDisconnectInvalidatesActiveConnection() {
  const { controller, calendarConnections, calls } = loadCalendarModules();
  const callbackResponse = createResponse();
  const disconnectResponse = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code",
      },
    },
    callbackResponse
  );
  await controller.disconnectGoogleCalendar({}, disconnectResponse);

  const serialized = JSON.stringify(disconnectResponse.payload);
  assert.equal(disconnectResponse.statusCode, 200);
  assert.equal(disconnectResponse.payload.data.revoked, true);
  assert.equal(disconnectResponse.payload.data.disconnected, true);
  assert.equal(calendarConnections[0].status, "DISCONNECTED");
  assert.equal(calendarConnections[0].encrypted_refresh_token, null);
  assert.equal(calls.revokedToken, "fake-refresh-token");
  assert.doesNotMatch(serialized, /fake-refresh-token|fake-access-token|v1:/);
}

async function testCallbackWithoutRefreshTokenPreservesActiveConnection() {
  const google = {};
  const { controller, calendarConnections } = loadCalendarModules({ google });
  const firstResponse = createResponse();
  const secondResponse = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code",
      },
    },
    firstResponse
  );
  const activeConnectionId = calendarConnections[0].id;
  google.tokenResponse = {
    tokens: {
      access_token: "fake-access-token-2",
      expiry_date: 456,
      scope:
        "https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.events",
    },
  };

  await controller.handleGoogleOAuthCallback(
    {
      body: {
        code: "fake-code-2",
      },
    },
    secondResponse
  );

  const activeConnections = calendarConnections.filter((connection) => connection.status === "ACTIVE");
  assert.equal(secondResponse.statusCode, 200);
  assert.equal(activeConnections.length, 1);
  assert.equal(activeConnections[0].id, activeConnectionId);
  assert.equal(secondResponse.payload.data.hasRefreshToken, false);
  assert.equal(secondResponse.payload.data.connected, true);
}

async function testOAuthGetCallbackRequiresStateBeforeTokenExchange() {
  const { controller, calls } = loadCalendarModules();
  const res = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        code: "fake-code",
      },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(calls.getToken, 0);
  assert.doesNotMatch(String(res.payload), /fake-refresh-token|fake-access-token/);
}

async function testOAuthGetCallbackRejectsInvalidState() {
  const { controller, calls } = loadCalendarModules();
  const res = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        code: "fake-code",
        state: "invalid-state",
      },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(calls.getToken, 0);
}

async function testOAuthGetCallbackRejectsExpiredState() {
  const { controller, calls, oauthState } = loadCalendarModules();
  const state = oauthState.createState({ now: 1000 });
  const res = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        code: "fake-code",
        state,
      },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(calls.getToken, 0);
}

async function testOAuthGetCallbackRejectsReusedState() {
  const { controller, calls } = loadCalendarModules();
  const stateResponse = createResponse();
  const first = createResponse();
  const second = createResponse();

  controller.getGoogleAuthorizationUrl({ query: {} }, stateResponse);
  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        code: "fake-code",
        state: stateResponse.payload.data.state,
      },
      body: {},
    },
    first
  );
  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        code: "fake-code",
        state: stateResponse.payload.data.state,
      },
      body: {},
    },
    second
  );

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 400);
  assert.equal(calls.getToken, 1);
}

async function testOAuthGetCallbackHandlesGoogleError() {
  const { controller, calls } = loadCalendarModules();
  const res = createResponse();

  await controller.handleGoogleOAuthCallback(
    {
      method: "GET",
      query: {
        error: "access_denied",
        state: "state-id",
      },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(calls.getToken, 0);
  assert.match(res.payload, /no fue autorizado/i);
}

async function testPublicGetCallbackWorksWithoutAdminKey() {
  await withTestServer(async (server, calls) => {
    const oauthUrlResponse = await request(server, {
      path: "/admin/calendar/google/oauth-url",
      headers: {
        "x-admin-key": "admin-key",
      },
    });
    const authorizationUrl = new URL(oauthUrlResponse.json.data.authorizationUrl);
    const state = authorizationUrl.searchParams.get("state");
    const callbackResponse = await request(server, {
      path: `/admin/calendar/google/callback?code=fake-code&state=${encodeURIComponent(state)}`,
    });

    assert.equal(callbackResponse.statusCode, 200);
    assert.match(callbackResponse.body, /Google Calendar autorizado correctamente/);
    assert.equal(calls.getToken, 1);
    assert.doesNotMatch(callbackResponse.body, /fake-refresh-token|fake-access-token|fake-code/);
  });
}

async function testCalendarAdminEndpointsRemainProtected() {
  await withTestServer(async (server) => {
    const statusResponse = await request(server, {
      path: "/admin/calendar/status",
    });
    const oauthUrlResponse = await request(server, {
      path: "/admin/calendar/google/oauth-url",
    });
    const postCallbackResponse = await request(server, {
      method: "POST",
      path: "/admin/calendar/google/callback",
    });
    const disconnectResponse = await request(server, {
      method: "POST",
      path: "/admin/calendar/google/disconnect",
    });

    assert.equal(statusResponse.statusCode, 401);
    assert.equal(oauthUrlResponse.statusCode, 401);
    assert.equal(postCallbackResponse.statusCode, 401);
    assert.equal(disconnectResponse.statusCode, 401);
  });
}

async function testFreeBusyCreatesAvailableSlotsWithBufferAndBusinessHours() {
  const { googleCalendar, calls } = loadCalendarModules({
    env: {
      googleCalendarEnabled: true,
      googleRefreshToken: "refresh-token",
      googleCalendarBufferMinutes: 15,
      googleCalendarLookaheadDays: 1,
    },
    google: {
      freebusyResponse: {
        data: {
          calendars: {
            primary: {
                  busy: [
                {
                  start: "2026-08-03T15:20:00.000Z",
                  end: "2026-08-03T15:50:00.000Z",
                },
              ],
            },
          },
        },
      },
    },
  });
  const slots = await googleCalendar.getAvailableSlots({
    now: new Date("2026-08-03T14:00:00.000Z"),
    modality: "VIDEOLLAMADA",
  });

  assert.equal(calls.freebusy, 1);
  assert.ok(slots.length > 0);
  assert.notEqual(slots[0].startsAt, "2026-08-03T15:00:00.000Z");
  assert.equal(slots[0].durationMinutes, 30);
  assert.equal(slots[0].timeZone, "America/Mexico_City");
}

async function testSundayDoesNotGenerateSlots() {
  const { googleCalendar } = loadCalendarModules({
    env: {
      googleCalendarEnabled: true,
      googleRefreshToken: "refresh-token",
      googleCalendarLookaheadDays: 0,
    },
  });
  const slots = await googleCalendar.getAvailableSlots({
    now: new Date("2026-08-02T14:00:00.000Z"),
  });

  assert.equal(slots.length, 0);
}

async function testCreateAppointmentModalitiesAndMeet() {
  for (const [modality, expectedConferenceVersion] of [
    ["PRESENCIAL", 0],
    ["VIDEOLLAMADA", 1],
    ["LLAMADA", 0],
  ]) {
    const { googleCalendar, calls } = loadCalendarModules({
      env: {
        googleCalendarEnabled: true,
        googleRefreshToken: "refresh-token",
      },
    });
    const appointment = await googleCalendar.createAppointment({
      slot: {
        id: "slot-1",
        startsAt: "2026-08-03T16:00:00.000Z",
        endsAt: "2026-08-03T16:30:00.000Z",
        timeZone: "America/Mexico_City",
      },
      summary: {
        prospect: "Cliente",
        business: "Negocio",
        conversationId: "conv-1",
        leadId: "lead-1",
      },
      modality,
      location: modality === "PRESENCIAL" ? { city: "Ciudad de Mexico" } : null,
      idempotencyKey: `idem-${modality}`,
    });

    assert.equal(calls.lastEventRequest.conferenceDataVersion, expectedConferenceVersion);
    assert.equal(Boolean(calls.lastEventRequest.requestBody.conferenceData), modality === "VIDEOLLAMADA");
    assert.equal(appointment.modality, modality);
    assert.equal(appointment.googleCalendarEventId, "google-event-1");
  }
}

async function testCreateAppointmentSendsLocalWallClockTimeToGoogle() {
  const { googleCalendar, calls } = loadCalendarModules({
    env: {
      googleCalendarEnabled: true,
      googleRefreshToken: "refresh-token",
    },
  });

  await googleCalendar.createAppointment({
    slot: {
      id: "slot-13-cdmx",
      startsAt: "2026-08-03T19:00:00.000Z",
      endsAt: "2026-08-03T19:30:00.000Z",
      timeZone: "America/Mexico_City",
    },
    summary: {
      prospect: "Cliente",
      business: "Negocio",
      conversationId: "conv-wall-clock",
      leadId: "lead-wall-clock",
    },
    modality: "LLAMADA",
    idempotencyKey: "wall-clock-13-cdmx",
  });

  assert.equal(calls.lastEventRequest.requestBody.start.dateTime, "2026-08-03T13:00:00");
  assert.equal(calls.lastEventRequest.requestBody.end.dateTime, "2026-08-03T13:30:00");
  assert.equal(calls.lastEventRequest.requestBody.start.timeZone, "America/Mexico_City");
  assert.equal(calls.lastEventRequest.requestBody.end.timeZone, "America/Mexico_City");
}

async function testIdempotencyPreventsDoubleEvent() {
  const { googleCalendar, calls } = loadCalendarModules({
    env: {
      googleCalendarEnabled: true,
      googleRefreshToken: "refresh-token",
    },
  });
  const request = {
    slot: {
      id: "slot-1",
      startsAt: "2026-08-03T16:00:00.000Z",
      endsAt: "2026-08-03T16:30:00.000Z",
      timeZone: "America/Mexico_City",
    },
    summary: {
      conversationId: "conv-1",
      leadId: "lead-1",
    },
    modality: "VIDEOLLAMADA",
    idempotencyKey: "same-idempotency-key",
  };

  await googleCalendar.createAppointment(request);
  const second = await googleCalendar.createAppointment(request);

  assert.equal(calls.eventsInsert, 1);
  assert.equal(second.reused, true);
}

async function testGoogleFailureIsSanitized() {
  const { googleCalendar } = loadCalendarModules({
    env: {
      googleCalendarEnabled: true,
      googleRefreshToken: "refresh-token",
    },
    google: {
      eventsInsertError: {
        message: "secret-ish upstream detail",
        code: 500,
        errors: [{ reason: "backendError" }],
      },
    },
  });

  await assert.rejects(
    () =>
      googleCalendar.createAppointment({
        slot: {
          id: "slot-1",
          startsAt: "2026-08-03T16:00:00.000Z",
          endsAt: "2026-08-03T16:30:00.000Z",
          timeZone: "America/Mexico_City",
        },
        summary: {
          conversationId: "conv-1",
          leadId: "lead-1",
        },
        modality: "VIDEOLLAMADA",
        idempotencyKey: "failed-idempotency-key",
      }),
    (error) => {
      assert.equal(error.code, "google_calendar_event_create_failed");
      assert.equal(error.details.reason, "backendError");
      return true;
    }
  );
}

async function main() {
  await testMaluQaPanelRequiresFeatureFlagAndAdmin();
  await testMockProviderContinuesWorking();
  await testGoogleDisabledDoesNotCallGoogle();
  await testMissingCredentialsFailsSafely();
  testOauthUrlUsesMinimumScopes();
  testOAuthAdminUrlGeneratesSecureState();
  await testOAuthControllerDoesNotExposeRefreshToken();
  await testOAuthGetCallbackReadsQueryAndDoesNotExposeTokens();
  await testOAuthCallbackPersistsEncryptedRefreshToken();
  await testCalendarStatusDoesNotExposeRefreshTokenOrCiphertext();
  await testActiveConnectionTakesPriorityOverEnvRefreshToken();
  await testDisconnectInvalidatesActiveConnection();
  await testCallbackWithoutRefreshTokenPreservesActiveConnection();
  await testOAuthGetCallbackRequiresStateBeforeTokenExchange();
  await testOAuthGetCallbackRejectsInvalidState();
  await testOAuthGetCallbackRejectsExpiredState();
  await testOAuthGetCallbackRejectsReusedState();
  await testOAuthGetCallbackHandlesGoogleError();
  await testPublicGetCallbackWorksWithoutAdminKey();
  await testCalendarAdminEndpointsRemainProtected();
  await testFreeBusyCreatesAvailableSlotsWithBufferAndBusinessHours();
  await testSundayDoesNotGenerateSlots();
  await testCreateAppointmentModalitiesAndMeet();
  await testCreateAppointmentSendsLocalWallClockTimeToGoogle();
  await testIdempotencyPreventsDoubleEvent();
  await testGoogleFailureIsSanitized();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
