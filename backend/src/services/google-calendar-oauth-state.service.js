const crypto = require("crypto");

const FLOW = "google_calendar_oauth";
const STATE_TTL_MS = 10 * 60 * 1000;
const states = new Map();

function pruneExpired(now = Date.now()) {
  for (const [state, record] of states.entries()) {
    if (record.expiresAt <= now || record.usedAt) {
      states.delete(state);
    }
  }
}

function createState({ now = Date.now() } = {}) {
  pruneExpired(now);

  const state = crypto.randomBytes(32).toString("base64url");
  states.set(state, {
    flow: FLOW,
    createdAt: now,
    expiresAt: now + STATE_TTL_MS,
    usedAt: null,
  });

  return state;
}

function consumeState(state, { now = Date.now() } = {}) {
  pruneExpired(now);

  if (!state) {
    const error = new Error("OAuth state requerido");
    error.code = "oauth_state_required";
    error.statusCode = 400;
    throw error;
  }

  const record = states.get(state);
  if (!record || record.flow !== FLOW) {
    const error = new Error("OAuth state invalido");
    error.code = "oauth_state_invalid";
    error.statusCode = 400;
    throw error;
  }

  if (record.expiresAt <= now) {
    states.delete(state);
    const error = new Error("OAuth state expirado");
    error.code = "oauth_state_expired";
    error.statusCode = 400;
    throw error;
  }

  if (record.usedAt) {
    states.delete(state);
    const error = new Error("OAuth state ya utilizado");
    error.code = "oauth_state_reused";
    error.statusCode = 400;
    throw error;
  }

  record.usedAt = now;
  states.delete(state);

  return {
    ok: true,
    flow: record.flow,
  };
}

function clearStatesForTests() {
  states.clear();
}

module.exports = {
  clearStatesForTests,
  consumeState,
  createState,
};
