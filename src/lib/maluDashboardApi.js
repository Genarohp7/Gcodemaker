const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : "";
}

async function requestDashboard(path, { sessionToken, params } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "No pudimos cargar el dashboard de Malu");
  }

  return payload.data;
}

export function getMaluDashboardOverview(sessionToken, params) {
  return requestDashboard("/admin/malu-dashboard/overview", {
    sessionToken,
    params,
  });
}

export function getMaluDashboardConversations(sessionToken, params) {
  return requestDashboard("/admin/malu-dashboard/conversations", {
    sessionToken,
    params,
  });
}

export function getMaluDashboardConversation(sessionToken, conversationId) {
  return requestDashboard(`/admin/malu-dashboard/conversations/${conversationId}`, {
    sessionToken,
  });
}

export function getMaluDashboardLeads(sessionToken, params) {
  return requestDashboard("/admin/malu-dashboard/leads", {
    sessionToken,
    params,
  });
}

export function getMaluDashboardAppointments(sessionToken, params) {
  return requestDashboard("/admin/malu-dashboard/appointments", {
    sessionToken,
    params,
  });
}

export function getMaluDashboardUsage(sessionToken, params) {
  return requestDashboard("/admin/malu-dashboard/usage", {
    sessionToken,
    params,
  });
}

export function getMaluDashboardStatus(sessionToken) {
  return requestDashboard("/admin/malu-dashboard/status", {
    sessionToken,
  });
}
