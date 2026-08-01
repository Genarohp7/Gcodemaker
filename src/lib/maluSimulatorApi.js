const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

async function requestJson(path, { adminKey, sessionToken, ...options } = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  } else if (adminKey) {
    headers["x-admin-key"] = adminKey;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "No pudimos conectar con el simulador");
  }

  return payload.data || payload;
}

export function startMaluSimulatorConversation({ adminKey, sessionToken, sessionId }) {
  return requestJson("/admin/malu-simulator/conversations", {
    adminKey,
    sessionToken,
    method: "POST",
    body: JSON.stringify({
      sessionId,
    }),
  });
}

export function getMaluSimulatorConversation({ adminKey, sessionToken, sessionId }) {
  return requestJson(`/admin/malu-simulator/conversations/${sessionId}`, {
    adminKey,
    sessionToken,
  });
}

export function sendMaluSimulatorMessage({ adminKey, sessionToken, sessionId, text, mode }) {
  return requestJson(`/admin/malu-simulator/conversations/${sessionId}/messages`, {
    adminKey,
    sessionToken,
    method: "POST",
    body: JSON.stringify({
      text,
      mode,
    }),
  });
}

export function resetMaluSimulatorConversation({ adminKey, sessionToken, sessionId }) {
  return requestJson(`/admin/malu-simulator/conversations/${sessionId}/reset`, {
    adminKey,
    sessionToken,
    method: "POST",
    body: JSON.stringify({}),
  });
}
