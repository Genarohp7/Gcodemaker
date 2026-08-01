import { useMemo, useState } from "react";
import {
  resetMaluSimulatorConversation,
  sendMaluSimulatorMessage,
  startMaluSimulatorConversation,
} from "../lib/maluSimulatorApi";
import { loginBroadcastUser } from "../lib/gcBroadcastApi";

const BROADCAST_SESSION_STORAGE_KEY = "gc_broadcast_local_session";

function createSessionId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `session_${Date.now()}`;
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StateRow({ label, value }) {
  return (
    <div className="malu-sim-state__row">
      <span>{label}</span>
      <strong>{value ?? "Sin dato"}</strong>
    </div>
  );
}

function MessageBubble({ message }) {
  const isMalu = message.role === "ai";
  const responseSource = message.metadata?.rawPayload?.responseSource;

  return (
    <article className={`malu-sim-message ${isMalu ? "malu-sim-message--malu" : ""}`}>
      <div className="malu-sim-message__meta">
        <span>{isMalu ? "Malu" : "Prospecto"}</span>
        <time>{formatDate(message.createdAt)}</time>
      </div>
      <p>{message.text}</p>
      <small>
        {message.providerMessageId || "Sin Message ID"}
        {responseSource ? ` | ${responseSource}` : ""}
      </small>
    </article>
  );
}

function loadStoredBroadcastSession() {
  try {
    const rawSession = localStorage.getItem(BROADCAST_SESSION_STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

function storeBroadcastSession(session) {
  localStorage.setItem(BROADCAST_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearBroadcastSession() {
  localStorage.removeItem(BROADCAST_SESSION_STORAGE_KEY);
}

export default function MaluSimulatorPage({ authMode = "manual" }) {
  const [adminKey, setAdminKey] = useState("");
  const [broadcastSession, setBroadcastSession] = useState(() =>
    authMode === "broadcast" ? loadStoredBroadcastSession() : null
  );
  const [loginForm, setLoginForm] = useState({
    phone: "",
    password: "",
  });
  const [sessionId, setSessionId] = useState(createSessionId);
  const [mode, setMode] = useState("MOCK");
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const messages = useMemo(() => conversation?.messages || [], [conversation?.messages]);
  const sessionToken = authMode === "broadcast" ? broadcastSession?.sessionToken : "";
  const isBroadcastAdmin =
    authMode === "broadcast" && broadcastSession?.role === "admin_cliente" && sessionToken;
  const isAuthorized = authMode === "broadcast" ? isBroadcastAdmin : adminKey.trim();
  const canSend = isAuthorized && input.trim() && conversation && status !== "sending";
  const latestResult = useMemo(() => {
    const latest = messages.at(-1);

    return latest?.metadata?.rawPayload?.autoReply?.status || latest?.metadata?.rawPayload?.autoReply?.reason;
  }, [messages]);
  const scheduling = conversation?.conversation?.scheduling;
  const scope = conversation?.conversation?.scope;

  async function handleLogin(event) {
    event.preventDefault();

    setStatus("logging-in");
    setError("");

    try {
      const session = await loginBroadcastUser(loginForm);

      if (session.role !== "admin_cliente") {
        throw new Error("Esta pantalla requiere una sesion admin.");
      }

      storeBroadcastSession(session);
      setBroadcastSession(session);
      setStatus("idle");
    } catch (requestError) {
      clearBroadcastSession();
      setBroadcastSession(null);
      setError(requestError.message);
      setStatus("idle");
    }
  }

  function handleLogout() {
    clearBroadcastSession();
    setBroadcastSession(null);
    setConversation(null);
  }

  function getSimulatorAuth() {
    return authMode === "broadcast"
      ? { sessionToken }
      : { adminKey };
  }

  async function handleStart() {
    setStatus("starting");
    setError("");

    try {
      const data = await startMaluSimulatorConversation({
        ...getSimulatorAuth(),
        sessionId,
      });
      setSessionId(data.sessionId);
      setConversation(data);
      setStatus("idle");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("idle");
    }
  }

  async function handleNewConversation() {
    const nextSessionId = createSessionId();

    setSessionId(nextSessionId);
    setConversation(null);
    setInput("");
    setError("");
    setStatus("starting");

    try {
      const data = await startMaluSimulatorConversation({
        ...getSimulatorAuth(),
        sessionId: nextSessionId,
      });
      setConversation(data);
      setStatus("idle");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("idle");
    }
  }

  async function handleSend(event) {
    event.preventDefault();

    if (!canSend) return;

    const text = input;
    setStatus("sending");
    setError("");

    try {
      const data = await sendMaluSimulatorMessage({
        ...getSimulatorAuth(),
        sessionId,
        text,
        mode,
      });
      setConversation(data.conversation);
      setInput("");
      setStatus("idle");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("idle");
    }
  }

  async function handleReset() {
    setStatus("resetting");
    setError("");

    try {
      await resetMaluSimulatorConversation({
        ...getSimulatorAuth(),
        sessionId,
      });
      setConversation(null);
      setInput("");
      setStatus("idle");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("idle");
    }
  }

  return (
    <main className="malu-sim-page">
      <section className="malu-sim-shell">
        <header className="malu-sim-header">
          <div>
            <p>PANEL QA MALU - NO ENVIA WHATSAPP</p>
            <h1>Malu QA</h1>
            <span>Usa el flujo real de Malu sin Meta ni WhatsApp reales.</span>
          </div>
          <div className="malu-sim-actions">
            {authMode === "broadcast" && broadcastSession ? (
              <button type="button" onClick={handleLogout} disabled={status !== "idle"}>
                Cerrar sesion
              </button>
            ) : null}
            <button type="button" onClick={handleStart} disabled={!isAuthorized || status !== "idle"}>
              Iniciar
            </button>
            <button type="button" onClick={handleNewConversation} disabled={!isAuthorized || status !== "idle"}>
              Nueva conversacion
            </button>
            <button type="button" onClick={handleReset} disabled={!conversation || status !== "idle"}>
              Reset
            </button>
          </div>
        </header>

        {authMode === "broadcast" && !broadcastSession ? (
          <form className="malu-sim-config" onSubmit={handleLogin}>
            <label>
              Telefono admin
              <input
                value={loginForm.phone}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, phone: event.target.value }))
                }
                autoComplete="username"
                placeholder="Telefono registrado"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                autoComplete="current-password"
                placeholder="Password"
              />
            </label>
            <button type="submit" disabled={status === "logging-in"}>
              {status === "logging-in" ? "Validando..." : "Entrar"}
            </button>
          </form>
        ) : null}

        {authMode === "manual" ? (
          <section className="malu-sim-config">
            <label>
              Clave admin backend
              <input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                autoComplete="off"
                placeholder="x-admin-key"
              />
            </label>
          </section>
        ) : null}

        <section className="malu-sim-config">
          <label>
            Modo
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="MOCK">MOCK - sin OpenAI</option>
              <option value="LIVE_AI">LIVE_AI - usa OpenAI configurado</option>
            </select>
          </label>
          <label>
            Session ID
            <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
          </label>
        </section>

        {error ? <p className="malu-sim-error">{error}</p> : null}

        <section className="malu-sim-grid">
          <section className="malu-sim-chat">
            <div className="malu-sim-messages">
              {messages.length ? (
                messages.map((message) => <MessageBubble key={message.id} message={message} />)
              ) : (
                <div className="malu-sim-empty">Inicia una conversacion y escribe como prospecto.</div>
              )}
            </div>
            <form className="malu-sim-composer" onSubmit={handleSend}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribe un mensaje inbound simulado para Malu..."
                rows={3}
                maxLength={2000}
              />
              <button type="submit" disabled={!canSend}>
                {status === "sending" ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </section>

          <aside className="malu-sim-state">
            <h2>Estado comercial</h2>
            <StateRow label="Owner" value={conversation?.conversation?.owner} />
            <StateRow label="AI enabled" value={String(conversation?.lead?.aiEnabled ?? "Sin dato")} />
            <StateRow label="Human takeover" value={String(conversation?.conversation?.humanTakeover ?? "Sin dato")} />
            <StateRow label="AI response count" value={conversation?.lead?.aiResponseCount} />
            <StateRow
              label="Post-handoff count"
              value={conversation?.conversation?.postHandoffInteractionCount}
            />
            <StateRow label="Handoff finalized" value={formatDate(conversation?.conversation?.handoffFinalizedAt)} />
            <StateRow
              label="Contact requested"
              value={formatDate(conversation?.conversation?.handoffContactRequestedAt)}
            />
            <StateRow label="Ultimo envio" value={latestResult || "Sin salida"} />
            <StateRow label="LIVE_AI disponible" value={String(conversation?.liveAiAvailable ?? false)} />

            <h2>Scope / consumo</h2>
            <StateRow label="Scope status" value={scope?.status || "COMMERCIAL_ACTIVE"} />
            <StateRow label="Off-topic count" value={scope?.offTopicCount ?? 0} />
            <StateRow label="Inbound total" value={scope?.inboundTotal ?? 0} />
            <StateRow label="OpenAI calls" value={scope?.openAiCalls ?? 0} />
            <StateRow label="Deterministicas" value={scope?.deterministicResponses ?? 0} />
            <StateRow label="Bloqueos" value={scope?.nonCommercialBlocked ?? 0} />
            <StateRow label="Reactivaciones" value={scope?.commercialReactivations ?? 0} />
            <StateRow label="OpenAI evitadas" value={scope?.openAiCallsAvoided ?? 0} />
            <StateRow label="Avoidance rate" value={scope ? `${Math.round(scope.openAiAvoidanceRate * 100)}%` : "0%"} />

            <h2>Agenda</h2>
            <StateRow label="Calendar Provider" value={conversation?.calendarProvider || "MOCK"} />
            <StateRow label="Scheduling status" value={scheduling?.status || "PROFILING"} />
            <StateRow label="Modalidad" value={scheduling?.modality || "Sin modalidad"} />
            <StateRow label="Timezone" value={scheduling?.timeZone || "Sin timezone"} />
            <StateRow label="Google Event ID" value={scheduling?.googleCalendarEventId ? "PRESENT" : "MISSING"} />
            <StateRow label="Slot seleccionado" value={scheduling?.selectedSlot?.startsAt || "Sin slot"} />
            <StateRow
              label="Cita confirmada"
              value={scheduling?.appointment?.status === "confirmed" ? "Si" : "No"}
            />
            <div className="malu-sim-ids">
              {(scheduling?.slots || []).map((slot) => (
                <span key={slot.id}>{`${slot.label}: ${formatDate(slot.startsAt)}`}</span>
              ))}
            </div>

            <h2>Message IDs</h2>
            <div className="malu-sim-ids">
              {messages.map((message) => (
                <span key={`${message.id}-id`}>{message.providerMessageId || "sin-id"}</span>
              ))}
            </div>

            <h2>Actividad</h2>
            <div className="malu-sim-activity">
              {(conversation?.activities || []).map((activity) => (
                <span key={activity.id}>{activity.action}</span>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
