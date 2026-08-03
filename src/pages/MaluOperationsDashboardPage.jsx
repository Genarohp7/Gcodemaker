import { useCallback, useEffect, useMemo, useState } from "react";
import { loginBroadcastUser } from "../lib/gcBroadcastApi";
import {
  getMaluDashboardAppointments,
  getMaluDashboardConversation,
  getMaluDashboardConversations,
  getMaluDashboardLeads,
  getMaluDashboardOverview,
  getMaluDashboardStatus,
  getMaluDashboardUsage,
} from "../lib/maluDashboardApi";
import MaluSimulatorPage from "./MaluSimulatorPage";

const BROADCAST_SESSION_STORAGE_KEY = "gc_broadcast_local_session";
const PERIODS = [
  { value: "today", label: "Hoy" },
  { value: "last_7_days", label: "Ultimos 7 dias" },
  { value: "last_30_days", label: "Ultimos 30 dias" },
  { value: "current_month", label: "Mes actual" },
  { value: "previous_month", label: "Mes anterior" },
  { value: "custom", label: "Rango personalizado" },
];
const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "conversations", label: "Conversaciones" },
  { id: "leads", label: "Leads" },
  { id: "agenda", label: "Agenda" },
  { id: "analytics", label: "Analytics" },
  { id: "usage", label: "Consumo" },
  { id: "status", label: "Estado" },
  { id: "qa", label: "QA de Malu", group: "Herramientas" },
  { id: "settings", label: "Configuracion", group: "Herramientas" },
];

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

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function formatMoney(value) {
  const amount = Number(value || 0);
  const maximumFractionDigits = amount > 0 && amount < 0.01 ? 4 : 2;

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) {
    return "Sin hora";
  }

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

function StatusDot({ status }) {
  return <span className={`malu-dash-dot malu-dash-dot--${status || "attention"}`} />;
}

function InfoTooltip({ text }) {
  return (
    <span className="malu-dash-info" tabIndex={0} aria-label={text}>
      i
      <span role="tooltip">{text}</span>
    </span>
  );
}

function LoginScreen({ onLogin, status, error }) {
  const [loginForm, setLoginForm] = useState({
    phone: "",
    password: "",
  });

  function handleSubmit(event) {
    event.preventDefault();
    onLogin(loginForm);
  }

  return (
    <main className="malu-dash-login">
      <section className="malu-dash-login__panel">
        <p className="malu-dash-eyebrow">Malu Operations</p>
        <h1>Panel administrativo</h1>
        <p>Acceso privado para operar Malu, revisar conversaciones y medir resultados.</p>
        <form onSubmit={handleSubmit} className="malu-dash-login__form">
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
          {error ? <p className="malu-dash-error">{error}</p> : null}
          <button type="submit" disabled={status === "logging-in"}>
            {status === "logging-in" ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PeriodSelector({ value, customRange, onChange, onCustomRangeChange }) {
  return (
    <div className="malu-dash-period">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {PERIODS.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      {value === "custom" ? (
        <div className="malu-dash-period__custom">
          <input
            type="date"
            value={customRange.from}
            onChange={(event) =>
              onCustomRangeChange((current) => ({ ...current, from: event.target.value }))
            }
          />
          <input
            type="date"
            value={customRange.to}
            onChange={(event) =>
              onCustomRangeChange((current) => ({ ...current, to: event.target.value }))
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function getVariationLabel({ current, variation }) {
  const numericCurrent = Number(current || 0);

  if (numericCurrent === 0 && Number(variation || 0) === 0) {
    return {
      text: "Sin cambios",
      tone: "neutral",
    };
  }

  if (Number(variation) === 100 && numericCurrent > 0) {
    return {
      text: `+${formatNumber(numericCurrent)} vs periodo anterior`,
      tone: "positive",
    };
  }

  return {
    text: `${Number(variation) >= 0 ? "+" : ""}${variation}% vs periodo anterior`,
    tone: Number(variation || 0) >= 0 ? "positive" : "negative",
  };
}

function KpiCard({ label, value, detail, variation, rawValue, compact = false, tooltip }) {
  const variationLabel =
    variation !== undefined
      ? getVariationLabel({ current: rawValue, variation })
      : null;
  const variationClass = Number(variation || 0) >= 0 ? "positive" : "negative";

  return (
    <article className={`malu-dash-kpi ${compact ? "malu-dash-kpi--compact" : ""}`}>
      <span>
        {label}
        {tooltip ? <InfoTooltip text={tooltip} /> : null}
      </span>
      <strong>{value}</strong>
      <div>
        {variation !== undefined ? (
          <small className={`malu-dash-kpi__trend malu-dash-kpi__trend--${variationLabel?.tone || variationClass}`}>
            {variationLabel.text}
          </small>
        ) : (
          <small>{detail}</small>
        )}
      </div>
    </article>
  );
}

function TimelineChart({ data = [] }) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.conversations, item.interested, item.appointments])
  );

  return (
    <div className="malu-dash-chart">
      {data.map((item) => (
        <div className="malu-dash-chart__day" key={item.date}>
          <div className="malu-dash-chart__bars">
            <span
              style={{ height: `${(item.conversations / maxValue) * 100}%` }}
              title={`Conversaciones: ${item.conversations}`}
            />
            <span
              style={{ height: `${(item.interested / maxValue) * 100}%` }}
              title={`Interes: ${item.interested}`}
            />
            <span
              style={{ height: `${(item.appointments / maxValue) * 100}%` }}
              title={`Citas: ${item.appointments}`}
            />
          </div>
          <small>{item.date.slice(5)}</small>
        </div>
      ))}
    </div>
  );
}

function TimelineState({ overview }) {
  const timeline = overview?.timeline || [];
  const totalConversations = overview?.metrics?.conversationsStarted || 0;
  const activeDays = timeline.filter(
    (item) => item.conversations || item.interested || item.appointments
  ).length;

  if (!totalConversations) {
    return (
      <EmptyState
        title="Sin actividad todavia"
        text="Aun no hay conversaciones comerciales en este periodo."
      />
    );
  }

  return (
    <>
      {totalConversations < 8 || activeDays < 3 ? (
        <div className="malu-dash-chart-note">
          <strong>Datos en formacion</strong>
          <span>
            Los datos comenzaran a formar una tendencia conforme Malu atienda mas conversaciones.
          </span>
        </div>
      ) : null}
      <TimelineChart data={timeline} />
    </>
  );
}

function Funnel({ funnel = [] }) {
  const first = Math.max(funnel[0]?.value || 1, 1);

  return (
    <div className="malu-dash-funnel">
      {funnel.map((step) => (
        <article className="malu-dash-funnel__step" key={step.label}>
          <div>
            <span>{step.label}</span>
            <strong>{formatNumber(step.value)}</strong>
          </div>
          <div className="malu-dash-funnel__track">
            <span style={{ width: `${Math.max((step.value / first) * 100, 4)}%` }} />
          </div>
          <small>{formatPercent(step.previousConversionRate)} del paso previo</small>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="malu-dash-empty">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Overview({ overview, services }) {
  if (!overview) {
    return <DashboardSkeleton />;
  }

  const metrics = overview.metrics;
  const essentials = ["malu", "whatsapp", "openAi", "calendar", "backend"].map(
    (key) => services?.[key]?.status
  );
  const operationalStatus = !services
    ? { label: "Estado no disponible", status: "attention" }
    : essentials.every((status) => status === "operational")
      ? { label: "Operativa", status: "operational" }
      : { label: "Revisar servicios", status: "attention" };

  return (
    <div className="malu-dash-view">
      <section className="malu-dash-overview-head">
        <div>
          <p className="malu-dash-eyebrow">Overview</p>
          <h2>Indicadores comerciales del periodo</h2>
        </div>
        <div
          className={`malu-dash-status-pill malu-dash-status-pill--${operationalStatus.status}`}
          title="El detalle completo esta disponible en la seccion Estado."
        >
          <StatusDot status={operationalStatus.status} />
          <span>{operationalStatus.label}</span>
        </div>
      </section>

      <section className="malu-dash-kpis malu-dash-kpis--primary">
        <KpiCard label="Conversaciones iniciadas" value={formatNumber(metrics.conversationsStarted)} rawValue={metrics.conversationsStarted} variation={overview.variations.conversationsStarted} />
        <KpiCard label="Leads perfilados" value={formatNumber(metrics.profiledLeads)} rawValue={metrics.profiledLeads} variation={overview.variations.profiledLeads} />
        <KpiCard label="Leads con interes" value={formatNumber(metrics.interestedLeads)} rawValue={metrics.interestedLeads} variation={overview.variations.interestedLeads} />
        <KpiCard label="Transferidos" value={formatNumber(metrics.transferredLeads)} rawValue={metrics.transferredLeads} variation={overview.variations.transferredLeads} />
        <KpiCard label="Citas confirmadas" value={formatNumber(metrics.confirmedAppointments)} rawValue={metrics.confirmedAppointments} variation={overview.variations.confirmedAppointments} />
        <KpiCard
          label="Abandonos"
          value={formatNumber(metrics.abandonments)}
          detail="Sin cita ni transferencia"
          tooltip="Conversaciones comerciales clasificadas sin cita confirmada ni transferencia al ingeniero. Se excluyen OWNER, QA y simulador."
        />
        <KpiCard label="Mensajes recibidos" value={formatNumber(metrics.messagesReceived)} detail="Inbound comercial" />
        <KpiCard label="Mensajes enviados" value={formatNumber(metrics.messagesSent)} detail="Respuestas Malu" />
      </section>

      <section className="malu-dash-secondary-metrics" aria-label="Metricas secundarias">
        <KpiCard compact label="Conv. a interes" value={formatPercent(metrics.conversationToInterestRate)} detail="Tasa del periodo" />
        <KpiCard compact label="Conv. a cita" value={formatPercent(metrics.conversationToAppointmentRate)} detail="Tasa del periodo" />
        <KpiCard compact label="Conv. a handoff" value={formatPercent(metrics.conversationToHandoffRate)} detail="Tasa del periodo" />
        <KpiCard compact label="Costo OpenAI" value={formatMoney(metrics.estimatedOpenAiCost)} detail={`${formatNumber(metrics.totalTokens)} tokens`} />
      </section>

      <section className="malu-dash-grid malu-dash-grid--main">
        <article className="malu-dash-panel">
          <div className="malu-dash-panel__header">
            <div>
              <p className="malu-dash-eyebrow">Actividad</p>
              <h2>Conversaciones, interes y citas</h2>
            </div>
            <div className="malu-dash-legend">
              <span>Conversaciones</span>
              <span>Interes</span>
              <span>Citas</span>
            </div>
          </div>
          <TimelineState overview={overview} />
        </article>

        <article className="malu-dash-panel">
          <div className="malu-dash-panel__header">
            <div>
              <p className="malu-dash-eyebrow">Embudo</p>
              <h2>Conversion comercial</h2>
            </div>
          </div>
          <Funnel funnel={overview.funnel} />
        </article>
      </section>

      <section className="malu-dash-grid malu-dash-grid--secondary">
        <article className="malu-dash-panel">
          <p className="malu-dash-eyebrow">Resumen del periodo</p>
          <p className="malu-dash-summary">{overview.executiveSummary}</p>
        </article>
        <article className="malu-dash-panel">
          <p className="malu-dash-eyebrow">Servicios</p>
          <ServiceList services={services} />
        </article>
        <article className="malu-dash-panel">
          <p className="malu-dash-eyebrow">Actividad reciente</p>
          <ActivityFeed items={overview.recentActivity} />
        </article>
      </section>
    </div>
  );
}

function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return <EmptyState title="Sin eventos recientes" text="La actividad relevante aparecera aqui." />;
  }

  return (
    <div className="malu-dash-feed">
      {items.map((item) => (
        <article key={item.id}>
          <span>{item.label}</span>
          <strong>{item.detail}</strong>
          <small>{formatDateTime(item.createdAt)}</small>
        </article>
      ))}
    </div>
  );
}

function ServiceList({ services }) {
  if (!services) {
    return <DashboardSkeleton compact />;
  }

  return (
    <div className="malu-dash-services">
      {Object.values(services).map((service) => (
        <div key={service.label}>
          <StatusDot status={service.status} />
          <span>{service.label}</span>
          <strong>{service.detail}</strong>
        </div>
      ))}
    </div>
  );
}

function AbandonmentPanel({ items = [] }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  if (!items.length) {
    return <EmptyState title="Sin abandonos clasificados" text="No hay perdidas detectables en el periodo." />;
  }

  return (
    <div className="malu-dash-abandonment">
      {items.map((item) => (
        <article key={item.key}>
          <div>
            <span>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </div>
          <div>
            <span style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }} />
          </div>
          <small>{formatPercent(item.percentage)}</small>
        </article>
      ))}
    </div>
  );
}

function ConversationsTable({ conversations, onSelect }) {
  if (!conversations?.length) {
    return <EmptyState title="Sin conversaciones" text="No hay conversaciones para este filtro." />;
  }

  return (
    <div className="malu-dash-table">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Prospecto</th>
            <th>Negocio</th>
            <th>Servicio</th>
            <th>Etapa</th>
            <th>Owner</th>
            <th>Mensajes</th>
            <th>Cita</th>
            <th>Ultima actividad</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conversation) => (
            <tr key={conversation.id} onClick={() => onSelect(conversation.id)}>
              <td>{formatDateTime(conversation.createdAt)}</td>
              <td>
                <strong>{conversation.prospect}</strong>
                <span>{conversation.phone}</span>
              </td>
              <td>{conversation.businessName}</td>
              <td>{conversation.serviceInterest}</td>
              <td><Badge>{conversation.stage}</Badge></td>
              <td>{conversation.owner}</td>
              <td>{conversation.messageCount}</td>
              <td>{conversation.hasAppointment ? "Si" : "No"}</td>
              <td>{formatDateTime(conversation.lastActivityAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children }) {
  return <span className="malu-dash-badge">{children}</span>;
}

function ConversationDrawer({ detail, loading, onClose }) {
  return (
    <aside className="malu-dash-drawer">
      <div className="malu-dash-drawer__header">
        <div>
          <p className="malu-dash-eyebrow">Detalle</p>
          <h2>{detail?.conversation?.prospect || "Conversacion"}</h2>
        </div>
        <button type="button" onClick={onClose}>Cerrar</button>
      </div>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="malu-dash-drawer__meta">
            <span>Etapa <strong>{detail?.conversation?.stage}</strong></span>
            <span>Owner <strong>{detail?.conversation?.owner}</strong></span>
            <span>Cita <strong>{detail?.conversation?.hasAppointment ? "Si" : "No"}</strong></span>
            <span>OpenAI <strong>{detail?.conversation?.openAiCalls || 0} calls</strong></span>
          </section>
          <section className="malu-dash-timeline">
            {(detail?.messages || []).map((message) => (
              <article key={message.id} className={message.role === "ai" ? "is-ai" : ""}>
                <small>{message.role === "ai" ? "Malu" : "Prospecto"} · {formatDateTime(message.createdAt)}</small>
                <p>{message.text}</p>
              </article>
            ))}
          </section>
        </>
      )}
    </aside>
  );
}

function LeadsView({ leads }) {
  if (!leads?.length) {
    return <EmptyState title="Sin leads" text="Los leads comerciales apareceran cuando Malu perfile prospectos reales." />;
  }

  return (
    <div className="malu-dash-cards-list">
      {leads.map((lead) => (
        <article key={lead.id}>
          <div>
            <strong>{lead.name}</strong>
            <span>{lead.businessName}</span>
          </div>
          <Badge>{lead.stage}</Badge>
          <p>{lead.need}</p>
          <small>{lead.recommendedProduct} · {lead.owner} · {formatDateTime(lead.lastActivityAt)}</small>
        </article>
      ))}
    </div>
  );
}

function AgendaView({ appointments }) {
  if (!appointments?.appointments?.length) {
    return <EmptyState title="Sin citas en el periodo" text="Las citas confirmadas o canceladas apareceran aqui." />;
  }

  return (
    <div className="malu-dash-agenda">
      <div className="malu-dash-mini-kpis">
        <KpiCard label="Proximas" value={formatNumber(appointments.metrics.upcoming)} />
        <KpiCard label="Confirmadas" value={formatNumber(appointments.metrics.confirmed)} />
        <KpiCard label="Canceladas" value={formatNumber(appointments.metrics.cancelled)} />
      </div>
      <div className="malu-dash-cards-list">
        {appointments.appointments.map((appointment) => (
          <article key={appointment.id}>
            <div>
              <strong>{formatTime(appointment.startsAt)}</strong>
              <span>{appointment.prospect}</span>
            </div>
            <Badge>{appointment.status}</Badge>
            <p>{appointment.businessName} · {appointment.serviceInterest}</p>
            <small>{appointment.modality} · Google Event {appointment.googleEventPresent ? "PRESENT" : "MISSING"}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function UsageView({ usage }) {
  if (!usage) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="malu-dash-kpis">
      <KpiCard label="OpenAI calls" value={formatNumber(usage.usage.openAiCalls)} />
      <KpiCard label="Input tokens" value={formatNumber(usage.usage.inputTokens)} />
      <KpiCard label="Output tokens" value={formatNumber(usage.usage.outputTokens)} />
      <KpiCard label="Tokens totales" value={formatNumber(usage.usage.totalTokens)} />
      <KpiCard label="Costo estimado" value={formatMoney(usage.usage.estimatedOpenAiCost)} />
      <KpiCard label="Costo por conversacion" value={formatMoney(usage.usage.averageCostPerConversation)} />
      <KpiCard label="Costo por lead" value={formatMoney(usage.usage.averageCostPerLead)} />
      <KpiCard label="WhatsApp inbound/outbound" value={`${formatNumber(usage.usage.messagesReceived)} / ${formatNumber(usage.usage.messagesSent)}`} />
    </section>
  );
}

function DashboardSkeleton({ compact = false }) {
  return (
    <div className={`malu-dash-skeleton ${compact ? "malu-dash-skeleton--compact" : ""}`}>
      <span />
      <span />
      <span />
    </div>
  );
}

export default function MaluOperationsDashboardPage() {
  const [session, setSession] = useState(loadStoredBroadcastSession);
  const [authStatus, setAuthStatus] = useState("idle");
  const [authError, setAuthError] = useState("");
  const [activeView, setActiveView] = useState("overview");
  const [period, setPeriod] = useState("last_30_days");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [overview, setOverview] = useState(null);
  const [services, setServices] = useState(null);
  const [conversations, setConversations] = useState(null);
  const [leads, setLeads] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [usage, setUsage] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversationDetail, setConversationDetail] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [search, setSearch] = useState("");
  const [conversationFilter, setConversationFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sessionToken = session?.sessionToken;
  const isAdmin = session?.role === "admin_cliente" && sessionToken;
  const periodParams = useMemo(
    () => ({
      period,
      from: customRange.from,
      to: customRange.to,
    }),
    [customRange.from, customRange.to, period]
  );

  async function handleLogin(credentials) {
    setAuthStatus("logging-in");
    setAuthError("");

    try {
      const nextSession = await loginBroadcastUser({
        username: credentials.phone,
        password: credentials.password,
      });

      if (nextSession.role !== "admin_cliente") {
        throw new Error("Esta pantalla requiere una sesion admin.");
      }

      storeBroadcastSession(nextSession);
      setSession(nextSession);
      setAuthStatus("idle");
    } catch (error) {
      clearBroadcastSession();
      setSession(null);
      setAuthError(error.message);
      setAuthStatus("idle");
    }
  }

  const loadDashboard = useCallback(async () => {
    if (!sessionToken) {
      return;
    }

    setDashboardError("");
    setIsRefreshing(true);

    try {
      const [overviewData, statusData] = await Promise.all([
        getMaluDashboardOverview(sessionToken, periodParams),
        getMaluDashboardStatus(sessionToken),
      ]);
      setOverview(overviewData);
      setServices(statusData);
    } catch (error) {
      setDashboardError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [periodParams, sessionToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!sessionToken) return;

    async function loadViewData() {
      try {
        if (activeView === "conversations") {
          setConversations(
            await getMaluDashboardConversations(sessionToken, {
              ...periodParams,
              filter: conversationFilter,
              search,
            })
          );
        }

        if (activeView === "leads") {
          setLeads(await getMaluDashboardLeads(sessionToken, periodParams));
        }

        if (activeView === "agenda") {
          setAppointments(await getMaluDashboardAppointments(sessionToken, periodParams));
        }

        if (activeView === "usage") {
          setUsage(await getMaluDashboardUsage(sessionToken, periodParams));
        }
      } catch (error) {
        setDashboardError(error.message);
      }
    }

    loadViewData();
  }, [activeView, conversationFilter, periodParams, search, sessionToken]);

  useEffect(() => {
    if (!selectedConversationId || !sessionToken) {
      return;
    }

    async function loadConversationDetail() {
      setDrawerLoading(true);
      try {
        setConversationDetail(
          await getMaluDashboardConversation(sessionToken, selectedConversationId)
        );
      } catch (error) {
        setDashboardError(error.message);
      } finally {
        setDrawerLoading(false);
      }
    }

    loadConversationDetail();
  }, [selectedConversationId, sessionToken]);

  if (!isAdmin) {
    return <LoginScreen onLogin={handleLogin} status={authStatus} error={authError} />;
  }

  function handleLogout() {
    clearBroadcastSession();
    setSession(null);
  }

  return (
    <main className="malu-dash-page">
      <aside className="malu-dash-sidebar">
        <div className="malu-dash-brand">
          <span>GC</span>
          <div>
            <strong>Malu Ops</strong>
            <small>Operations Dashboard V1</small>
          </div>
        </div>
        <nav>
          {NAV_ITEMS.map((item, index) => (
            <div key={item.id}>
              {item.group && NAV_ITEMS[index - 1]?.group !== item.group ? (
                <p className="malu-dash-nav-group">{item.group}</p>
              ) : null}
              <button
                type="button"
                className={activeView === item.id ? "is-active" : ""}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <section className="malu-dash-main">
        <header className="malu-dash-topbar">
          <div>
            <p className="malu-dash-eyebrow">GCodemaker Malu</p>
            <h1>Operaciones comerciales</h1>
          </div>
          <div className="malu-dash-topbar__actions">
            <PeriodSelector
              value={period}
              customRange={customRange}
              onChange={setPeriod}
              onCustomRangeChange={setCustomRange}
            />
            <button
              type="button"
              className={isRefreshing ? "is-loading" : ""}
              onClick={loadDashboard}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </button>
            <button type="button" onClick={handleLogout}>Salir</button>
          </div>
        </header>

        {dashboardError ? <p className="malu-dash-error">{dashboardError}</p> : null}

        {activeView === "overview" ? <Overview overview={overview} services={services} /> : null}

        {activeView === "conversations" ? (
          <section className="malu-dash-panel">
            <div className="malu-dash-panel__header">
              <div>
                <p className="malu-dash-eyebrow">Conversaciones</p>
                <h2>Pipeline operativo</h2>
              </div>
              <div className="malu-dash-filters">
                <select value={conversationFilter} onChange={(event) => setConversationFilter(event.target.value)}>
                  <option value="all">Todas</option>
                  <option value="active">Activas</option>
                  <option value="profiled">Perfiladas</option>
                  <option value="interested">Interesadas</option>
                  <option value="appointment">Con cita</option>
                  <option value="handoff">Handoff</option>
                  <option value="abandoned">Abandonadas</option>
                </select>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar negocio, nombre o telefono"
                />
              </div>
            </div>
            <ConversationsTable
              conversations={conversations?.conversations}
              onSelect={setSelectedConversationId}
            />
          </section>
        ) : null}

        {activeView === "leads" ? (
          <section className="malu-dash-panel">
            <div className="malu-dash-panel__header">
              <div>
                <p className="malu-dash-eyebrow">Leads</p>
                <h2>Prospectos perfilados</h2>
              </div>
            </div>
            <LeadsView leads={leads?.leads} />
          </section>
        ) : null}

        {activeView === "agenda" ? (
          <section className="malu-dash-panel">
            <div className="malu-dash-panel__header">
              <div>
                <p className="malu-dash-eyebrow">Agenda</p>
                <h2>Citas registradas</h2>
              </div>
            </div>
            <AgendaView appointments={appointments} />
          </section>
        ) : null}

        {activeView === "analytics" ? (
          <section className="malu-dash-grid malu-dash-grid--main">
            <article className="malu-dash-panel">
              <p className="malu-dash-eyebrow">Embudo</p>
              <Funnel funnel={overview?.funnel || []} />
            </article>
            <article className="malu-dash-panel">
              <p className="malu-dash-eyebrow">Donde se pierden los prospectos</p>
              <AbandonmentPanel items={overview?.abandonment || []} />
            </article>
          </section>
        ) : null}

        {activeView === "usage" ? <UsageView usage={usage} /> : null}

        {activeView === "status" ? (
          <section className="malu-dash-panel">
            <p className="malu-dash-eyebrow">Estado de servicios</p>
            <ServiceList services={services} />
          </section>
        ) : null}

        {activeView === "qa" ? (
          <section className="malu-dash-qa">
            <MaluSimulatorPage authMode="broadcast" embedded />
          </section>
        ) : null}

        {activeView === "settings" ? (
          <section className="malu-dash-panel">
            <p className="malu-dash-eyebrow">Configuracion</p>
            <EmptyState
              title="Solo lectura en V1"
              text="Las acciones administrativas se agregaran en una fase posterior."
            />
          </section>
        ) : null}
      </section>

      {selectedConversationId ? (
        <ConversationDrawer
          detail={conversationDetail}
          loading={drawerLoading}
          onClose={() => {
            setSelectedConversationId(null);
            setConversationDetail(null);
          }}
        />
      ) : null}
    </main>
  );
}
