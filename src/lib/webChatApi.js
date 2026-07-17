const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function fetchWebChatJson(path, sessionToken, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export function getWebChatConversations(sessionToken) {
  return fetchWebChatJson("/api/web-chat/conversations", sessionToken);
}

export function getWebChatConversationMessages(sessionToken, conversationId) {
  return fetchWebChatJson(
    `/api/web-chat/conversations/${conversationId}/messages`,
    sessionToken
  );
}

export function sendWebChatMessage(sessionToken, conversationId, payload) {
  return fetchWebChatJson(
    `/api/web-chat/conversations/${conversationId}/messages`,
    sessionToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function uploadWebChatAttachment(sessionToken, conversationId, file) {
  return fetchWebChatJson(
    `/api/web-chat/conversations/${conversationId}/attachments`,
    sessionToken,
    {
      method: "POST",
      body: JSON.stringify({
        name: file?.name || "",
        type: file?.type || "",
        size: file?.size || 0,
      }),
    }
  );
}

export function markWebChatConversationAsRead(sessionToken, conversationId) {
  return fetchWebChatJson(
    `/api/web-chat/conversations/${conversationId}/read`,
    sessionToken,
    {
      method: "PATCH",
      body: JSON.stringify({}),
    }
  );
}

export async function getWebChatMessageMediaBlob(sessionToken, messageId) {
  const response = await fetch(`${API_BASE_URL}/api/web-chat/messages/${messageId}/media`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}
