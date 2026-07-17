const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function normalizeApiErrorMessage(message) {
  if (!message) {
    return "Request failed";
  }

  if (String(message).startsWith("Falta configurar ")) {
    return "La conexión de Meta aún no está configurada en el backend.";
  }

  return message;
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || "Request failed");
  }

  return payload.data;
}

export async function getBroadcastOverview() {
  return fetchJson("/api/broadcast/overview");
}

export async function getBroadcastCampaigns() {
  return fetchJson("/api/broadcast/campaigns");
}

export async function getBroadcastCampaignDeliveryReports(sessionToken) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/campaigns/delivery-reports`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function getBroadcastAllowedTemplates(sessionToken) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/templates/allowed`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function sendBroadcastCampaign(sessionToken, campaign) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/campaigns/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(campaign),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    const firstError = payload.data?.results?.find((result) => result.errorMessage)?.errorMessage;

    throw new Error(firstError || payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function loginBroadcastUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function sendWhatsAppTemplateTest(sessionToken, recipientPhone, connectionId = null) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/whatsapp/test-send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipientPhone,
      templateName: "hello_world",
      languageCode: "en_US",
      connectionId,
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    const metaError =
      payload.data?.metaResponse?.error?.message ||
      payload.data?.metaResponse?.error?.error_data?.details;

    throw new Error(metaError || payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function sendWhatsAppTextTest(
  sessionToken,
  recipientPhone,
  messageBody,
  connectionId = null
) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/whatsapp/test-send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipientPhone,
      messageBody,
      connectionId,
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    const metaError =
      payload.data?.metaResponse?.error?.message ||
      payload.data?.metaResponse?.error?.error_data?.details;

    throw new Error(metaError || payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function createManualWhatsAppConnection(sessionToken, connection) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/whatsapp/connections/manual`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(connection),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function getWhatsAppConnections(sessionToken) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/whatsapp/connections`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function getWhatsAppInboundMessages(sessionToken) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/whatsapp/inbound-messages`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function exchangeEmbeddedSignupCode(sessionToken, code, embeddedSignup) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/meta/embedded-signup/exchange`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, embeddedSignup }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(normalizeApiErrorMessage(payload.message) || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function createBroadcastUser(sessionToken, user) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function updateBroadcastUserStatus(userId, status) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function updateBroadcastUserMessages(userId, assignedMessages) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/users/${userId}/messages`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ assignedMessages }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function updateBroadcastUserAccess(userId, menuAccess) {
  const response = await fetch(`${API_BASE_URL}/api/broadcast/users/${userId}/access`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ menuAccess }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}
