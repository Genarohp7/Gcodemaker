const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function getErrorMessage(payload, fallback) {
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  return fallback;
}

async function requestJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(payload, "No pudimos conectar con el demo")
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function normalizeLead(payload) {
  const lead =
    payload?.data?.lead || payload?.data || payload?.lead || payload || null;

  if (!lead?.id) {
    throw new Error("El backend no devolvio el identificador del lead");
  }

  return lead;
}

function normalizeAiReply(payload) {
  const data = payload?.data || payload || {};

  return {
    reply: data.reply || payload?.reply || "",
    questionCount: data.questionCount ?? payload?.questionCount ?? 0,
    limitReached: Boolean(data.limitReached ?? payload?.limitReached),
  };
}

export async function createDemoLead({ name, phone, businessName, goal }) {
  const payload = await requestJson("/demo-leads", {
    method: "POST",
    body: JSON.stringify({
      name,
      phone,
      businessName,
      goal,
    }),
  });

  return normalizeLead(payload);
}

export async function sendDemoMessage({ leadId, message }) {
  const payload = await requestJson("/ai-demo", {
    method: "POST",
    body: JSON.stringify({
      leadId,
      message,
    }),
  });

  return normalizeAiReply(payload);
}

export function getDemoLimitFromError(error) {
  const data = error?.payload?.data || {};

  if (error?.status !== 403) return null;

  return {
    message:
      error?.payload?.message || "Has alcanzado el limite de preguntas del demo",
    questionCount: data.questionCount ?? 3,
    limitReached: Boolean(data.limitReached ?? true),
  };
}
