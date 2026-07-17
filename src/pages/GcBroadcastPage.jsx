import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  broadcastClient as mockBroadcastClient,
  broadcastLines as mockBroadcastLines,
  broadcastUsers as mockBroadcastUsers,
  campaigns as mockCampaigns,
  internalClients,
  sampleRecipients,
} from "../data/gcBroadcastMock";
import {
  createManualWhatsAppConnection,
  createBroadcastUser,
  exchangeEmbeddedSignupCode,
  getBroadcastCampaigns,
  getBroadcastCampaignDeliveryReports,
  getBroadcastAllowedTemplates,
  getBroadcastOverview,
  getWhatsAppConnections,
  getWhatsAppInboundMessages,
  loginBroadcastUser,
  sendBroadcastCampaign,
  sendWhatsAppTemplateTest,
  sendWhatsAppTextTest,
  updateBroadcastUserAccess,
  updateBroadcastUserMessages,
  updateBroadcastUserStatus,
} from "../lib/gcBroadcastApi";
import { startWhatsAppBusinessEmbeddedSignup } from "../lib/metaEmbeddedSignup";
import {
  getWebChatConversationMessages,
  getWebChatConversations,
  getWebChatMessageMediaBlob,
  markWebChatConversationAsRead,
  sendWebChatMessage,
  uploadWebChatAttachment,
} from "../lib/webChatApi";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Usuarios" },
  { id: "lines", label: "Lineas" },
  { id: "web-chat", label: "Web chat" },
  { id: "campaigns", label: "Campañas" },
  { id: "new", label: "Nueva campaña" },
  { id: "delivery", label: "Resultados" },
  { id: "history", label: "Historial" },
  { id: "usage", label: "Consumo" },
  { id: "admin", label: "Admin GCodemaker" },
];

const MENU_ACCESS_OPTIONS = tabs.map((tab) => ({
  id: tab.id,
  label: tab.label,
}));

const campaignTypes = [
  {
    id: "bienvenida",
    label: "Bienvenida",
    officialTemplateName: "bienvenida_curso_cacp",
    languageCode: "es_MX",
    template:
      "MUY BUEN DIA APRECIABLE {{nombre_alumno}}\n\nBienvenido(a) a su curso en {{nombre_curso}}.\n\nLe saluda la Lic. {{nombre_tutora}}. Sere su tutora academica y le doy la mas cordial bienvenida a esta experiencia educativa.\n\nFecha de inicio:\n{{fecha_inicio}}\n\nHora:\n{{hora_inicio}}\n\nDurante el programa contara con mi apoyo y con los recursos necesarios para su formacion.\n\nLe recomendamos guardar este numero en sus contactos para facilitar la comunicacion durante el curso.\n\nLe deseamos mucho exito.\n\nCACP",
    variables: ["nombre_alumno", "nombre_curso", "nombre_tutora", "fecha_inicio", "hora_inicio"],
    columns: ["telefono", "nombre_alumno", "nombre_curso", "nombre_tutora", "fecha_inicio", "hora_inicio"],
  },
  {
    id: "solicitud_contacto",
    label: "Solicitud de contacto",
    officialTemplateName: "confirmacion_envio_info_acad_cacp",
    languageCode: "es_MX",
    template:
      "Hola {{nombre_alumno}}, soy Mtra. {{nombre_tutora}} de Coordinacion Tutoria Academica.\n\nTenemos informacion importante relacionada con tu diplomado.\n\nNos confirmas si podemos enviartela por este medio?",
    variables: ["nombre_alumno", "nombre_tutora"],
    columns: ["telefono", "nombre_alumno", "nombre_tutora"],
  },
  {
    id: "calendario",
    label: "Calendario",
    officialTemplateName: "calendario_clases_cacp",
    languageCode: "es_MX",
    template:
      "Estimado profesional.\n\nPara que pueda organizar sus tiempos, le comparto el calendario de clases de su curso.\n\nComo parte de nuestro acompanamiento, podria indicarme si usted tomara sus clases de manera sincronica o sera mediante grabaciones?",
    variables: [],
    columns: ["telefono"],
  },
  {
    id: "aviso_general",
    label: "Validacion de datos",
    officialTemplateName: "verificacion_datos_egreso_cacp",
    languageCode: "es_MX",
    template:
      "Estimado profesional\n\nComo parte de su proceso academico y para la entrega del paquete de egreso del programa, es necesario realizar la verificacion de sus datos, por lo que le pido, escriba su nombre completo, con acentos y sin errores ortograficos, y el correo electronico al que seran enviados dicho paquete de egreso.\n\nDe esta manera aseguramos el envio correcto de sus documentos, por favor lea el archivo adjunto y confirme de enterad@.\n\nGracias!",
    variables: [],
    columns: ["telefono"],
  },
  {
    id: "usuarios_contrasenas",
    label: "Usuarios y contrasenas",
    template:
      "Estimado alumno\n\nLe hago entrega de sus credenciales personales para el acceso a la plataforma educativa https://cacp.online/\n\nUsuario: {{usuario}}\nContrasena: {{contrasena}}\n\nPor favor, ingrese con estos datos y consulte el archivo tutorial enviado para guiar su navegacion. Estare atenta a sus comentarios o dudas durante el proceso.\n\nFavor de confirmar de recibido.\n\n{{tutora}}\nCoordinacion Tutoria Academica\n\nCACP",
    variables: ["usuario", "contrasena", "tutora"],
    columns: ["telefono", "usuario", "contrasena"],
  },
  {
    id: "horarios",
    label: "Horarios",
    template:
      "Hola {{nombre}}, te compartimos el horario de tu grupo {{grupo}}.\n\nHorario: {{horario}}\nDiplomado: {{diplomado}}",
    variables: ["nombre", "grupo", "horario", "diplomado"],
    columns: ["nombre", "telefono", "diplomado", "horario", "grupo"],
  },
  {
    id: "recordatorio",
    label: "Avisos",
    template:
      "Aprovecha esta semana para inscribirte a nuestro CURSO!\n\n- {{nombre_curso}}\n\nPrecio regular:\nInscripcion $500 + Curso $2,000\n\nClases: {{dia}} de {{horario}}.\n\nPromocion limitada\n\nCon la docente: {{docente}}.\n\nFactura disponible (IVA adicional).\n\nPide informes!!",
    variables: ["nombre_curso", "dia", "horario", "docente"],
    columns: ["telefono", "nombre_curso", "dia", "horario", "docente"],
  },
  {
    id: "otro",
    label: "Otro",
    template: "Hola {{nombre}}, te compartimos la siguiente informacion:\n\n{{observaciones}}",
    variables: ["nombre", "observaciones"],
    columns: ["nombre", "telefono", "observaciones"],
  },
];
const LOCAL_ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_GC_BROADCAST_LOCAL_USER || "",
  password: import.meta.env.VITE_GC_BROADCAST_LOCAL_PASSWORD || "",
};
const ENABLE_LOCAL_LOGIN_FALLBACK =
  import.meta.env.DEV &&
  Boolean(LOCAL_ADMIN_CREDENTIALS.username && LOCAL_ADMIN_CREDENTIALS.password);

const LOCAL_SESSION_KEY = "gc_broadcast_local_session";
const USER_STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "invitation_pending", label: "Invitacion pendiente" },
  { value: "suspended", label: "Suspendido" },
];

const MESSAGE_ASSIGNMENT_OPTIONS = Array.from({ length: 10 }, (_, index) => (index + 1) * 100);
const PRIMARY_WHATSAPP_PHONE_NUMBER_ID = "1330058020181653";
const PRIMARY_WHATSAPP_DISPLAY_PHONE = "15549110102";

const RECIPIENT_FIELD_MAP = {
  nombre: "nombre",
  nombre_alumno: "nombre",
  telefono: "telefono",
  usuario: "usuario",
  contrasena: "contrasena",
  diplomado: "diplomado",
  nombre_diplomado: "diplomado",
  nombre_curso: "diplomado",
  tutora: "tutora",
  nombre_tutora: "tutora",
  fecha_inicio: "fecha_inicio",
  fecha: "fecha_inicio",
  dia: "fecha_inicio",
  horario: "horario",
  hora: "horario",
  hora_inicio: "horario",
  docente: "observaciones",
  grupo: "grupo",
  observaciones: "observaciones",
  archivo_personalizado: "archivo_personalizado",
};

function normalizeExcelCell(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function looksLikeHeaderRow(row, expectedColumns) {
  const normalizedRow = row.map((cell) =>
    normalizeExcelCell(cell).toLowerCase().replaceAll(" ", "_")
  );

  return expectedColumns.some((column) => normalizedRow.includes(column.toLowerCase()));
}

async function parseCampaignExcel(file, selectedCampaign) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const dataRows = looksLikeHeaderRow(rows[0] || [], selectedCampaign.columns)
    ? rows.slice(1)
    : rows;

  return dataRows
    .filter((row) => row.some((cell) => normalizeExcelCell(cell)))
    .map((row) => {
      const recipient = {};

      selectedCampaign.columns.forEach((columnName, index) => {
        const value = normalizeExcelCell(row[index]);
        const fieldName = RECIPIENT_FIELD_MAP[columnName] || columnName;

        recipient[columnName] = value;
        recipient[fieldName] = value;
      });

      if (recipient.nombre_curso && !recipient.diplomado) {
        recipient.diplomado = recipient.nombre_curso;
      }

      if (recipient.diplomado && !recipient.nombre_curso) {
        recipient.nombre_curso = recipient.diplomado;
      }

      if (recipient.nombre_alumno && !recipient.nombre) {
        recipient.nombre = recipient.nombre_alumno;
      }

      if (recipient.nombre && !recipient.nombre_alumno) {
        recipient.nombre_alumno = recipient.nombre;
      }

      if (recipient.nombre_tutora && !recipient.tutora) {
        recipient.tutora = recipient.nombre_tutora;
      }

      if (recipient.tutora && !recipient.nombre_tutora) {
        recipient.nombre_tutora = recipient.tutora;
      }

      if (recipient.hora_inicio && !recipient.horario) {
        recipient.horario = recipient.hora_inicio;
      }

      if (recipient.horario && !recipient.hora_inicio) {
        recipient.hora_inicio = recipient.horario;
      }

      if (recipient.docente && !recipient.observaciones) {
        recipient.observaciones = recipient.docente;
      }

      return recipient;
    });
}

function readAttachmentFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64 = ""] = result.split(",");

      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        base64,
      });
    };
    reader.onerror = () => reject(new Error("No se pudo leer el adjunto"));
    reader.readAsDataURL(file);
  });
}

function getLocalSession() {
  try {
    const storedSession = window.localStorage.getItem(LOCAL_SESSION_KEY);

    return storedSession ? JSON.parse(storedSession) : null;
  } catch {
    return null;
  }
}

function canChooseCampaignLine() {
  return false;
}

function getPrimaryWhatsAppConnection(connections) {
  return (
    connections.find((connection) => connection.phoneNumberId === PRIMARY_WHATSAPP_PHONE_NUMBER_ID) ||
    connections.find((connection) =>
      String(connection.displayPhoneNumber || connection.connectedPhone || "").includes(
        PRIMARY_WHATSAPP_DISPLAY_PHONE
      )
    ) ||
    connections[0] ||
    null
  );
}

function getCampaignSenderName(session) {
  if (session?.role === "admin_cliente") {
    return "Administrador";
  }

  return session?.name || session?.username || "Tutora Academica";
}

function formatPercent(value, total) {
  return Math.round((value / total) * 100);
}

function getUsageTone(percent) {
  if (percent >= 100) return "danger";
  if (percent >= 95) return "orange";
  if (percent >= 80) return "warning";
  return "good";
}

function ProgressBar({ value, total }) {
  const percent = Math.min(formatPercent(value, total), 100);
  const tone = getUsageTone(percent);

  return (
    <div className="broadcast-progress" aria-label={`${percent}% usado`}>
      <span
        className={`broadcast-progress__bar broadcast-progress__bar--${tone}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function StatusPill({ children }) {
  const normalized = String(children).toLowerCase();
  const tone = normalized.includes("error")
    ? "danger"
    : normalized.includes("parcial")
      ? "warning"
      : normalized.includes("enviada")
        ? "good"
        : normalized.includes("lista")
          ? "info"
          : "neutral";

  return <span className={`broadcast-pill broadcast-pill--${tone}`}>{children}</span>;
}

function Metric({ label, value, helper, tone = "neutral" }) {
  return (
    <article className={`broadcast-metric broadcast-metric--${tone}`}>
      <span className="broadcast-metric__label">{label}</span>
      <strong className="broadcast-metric__value">{value}</strong>
      <span className="broadcast-metric__helper">{helper}</span>
    </article>
  );
}

function normalizeLine(apiLine) {
  return {
    id: apiLine.id,
    owner: apiLine.ownerName || apiLine.owner,
    phone: apiLine.phone,
    status:
      apiLine.status === "pending_configuration"
        ? "Pendiente de configurar"
        : apiLine.status || "En preparacion",
    limit: apiLine.monthlyLimit || apiLine.limit,
    used: apiLine.used || 0,
    campaigns: apiLine.campaigns || 0,
    lastSent: apiLine.lastSent || "Sin envios",
  };
}

function normalizeUser(apiUser) {
  const roleLabels = {
    admin_cliente: "Admin cliente",
    operador_cliente: "Operador cliente",
    lectura_cliente: "Solo lectura",
  };

  return {
    id: apiUser.id,
    name: apiUser.name,
    phone: apiUser.phone || "Pendiente",
    whatsappConnectionId: apiUser.whatsappConnectionId || apiUser.whatsapp_connection_id || "",
    whatsappLineName: apiUser.whatsappLineName || apiUser.whatsapp_line_name || "",
    whatsappDisplayPhoneNumber:
      apiUser.whatsappDisplayPhoneNumber || apiUser.whatsapp_display_phone_number || "",
    whatsappPhoneNumberId: apiUser.whatsappPhoneNumberId || apiUser.whatsapp_phone_number_id || "",
    role: roleLabels[apiUser.role] || apiUser.role,
    assignedMessages: apiUser.assignedMessages || 0,
    menuAccess: apiUser.menuAccess || [],
    status: apiUser.status || "invitation_pending",
    signatureCode: apiUser.signatureCode || apiUser.signature_code || "",
    signatureName: apiUser.signatureName || apiUser.signature_name || "",
    signatureText: apiUser.signatureText || apiUser.signature_text || "",
    lastAccess: apiUser.lastAccess || "Sin acceso",
  };
}

function normalizeSession(apiSession) {
  return {
    id: apiSession.id,
    companyId: apiSession.companyId,
    username: apiSession.username || apiSession.phone || apiSession.name,
    name: apiSession.name,
    phone: apiSession.phone,
    whatsappConnectionId:
      apiSession.whatsappConnectionId || apiSession.whatsapp_connection_id || "",
    whatsappLineName: apiSession.whatsappLineName || apiSession.whatsapp_line_name || "",
    whatsappDisplayPhoneNumber:
      apiSession.whatsappDisplayPhoneNumber || apiSession.whatsapp_display_phone_number || "",
    whatsappPhoneNumberId: apiSession.whatsappPhoneNumberId || apiSession.whatsapp_phone_number_id || "",
    role: apiSession.role,
    assignedMessages: apiSession.assignedMessages || 0,
    menuAccess: apiSession.menuAccess || [],
    status: apiSession.status,
    signatureCode: apiSession.signatureCode || apiSession.signature_code || "",
    signatureName: apiSession.signatureName || apiSession.signature_name || "",
    signatureText: apiSession.signatureText || apiSession.signature_text || "",
    lastAccess: apiSession.lastAccess || "Sin acceso",
    sessionToken: apiSession.sessionToken,
    createdAt: new Date().toISOString(),
  };
}

function isLastDayOfMonth(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);

  return tomorrow.getDate() === 1;
}

function normalizeCampaign(apiCampaign, lines) {
  const line = lines.find((item) => item.id === apiCampaign.lineId);

  return {
    id: apiCampaign.id,
    name: apiCampaign.name,
    type: apiCampaign.type,
    line: line?.owner || apiCampaign.lineId || "Sin linea",
    recipients: apiCampaign.recipientCount || apiCampaign.recipients || 0,
    status: apiCampaign.status === "draft" ? "Borrador" : apiCampaign.status,
    createdAt: apiCampaign.createdAt || "Pendiente",
    sendAt: apiCampaign.sendAt || "Pendiente",
    owner: apiCampaign.owner || line?.owner || "Pendiente",
    attachments: apiCampaign.attachments || "Sin adjuntos",
  };
}

function normalizeWhatsAppConnection(apiConnection) {
  return {
    id: apiConnection.id,
    companyId: apiConnection.companyId || apiConnection.company_id,
    lineId: apiConnection.lineId || apiConnection.line_id,
    lineName: apiConnection.lineName || apiConnection.line_name,
    businessId: apiConnection.businessId || apiConnection.business_id,
    wabaId: apiConnection.wabaId || apiConnection.waba_id,
    phoneNumberId: apiConnection.phoneNumberId || apiConnection.phone_number_id,
    displayPhoneNumber: apiConnection.displayPhoneNumber || apiConnection.display_phone_number,
    connectedPhone: apiConnection.connectedPhone || apiConnection.connected_phone,
    provider: apiConnection.provider || "meta_embedded_signup",
    accessTokenLast4: apiConnection.accessTokenLast4 || apiConnection.access_token_last4,
    connectionStatus:
      apiConnection.connectionStatus || apiConnection.connection_status || "pending_assets",
    createdAt: apiConnection.createdAt || apiConnection.created_at,
    updatedAt: apiConnection.updatedAt || apiConnection.updated_at,
  };
}

function normalizeWhatsAppInboundMessage(apiMessage) {
  return {
    id: apiMessage.id,
    whatsappMessageId: apiMessage.whatsappMessageId || apiMessage.whatsapp_message_id,
    fromPhone: apiMessage.fromPhone || apiMessage.from_phone,
    phoneNumberId: apiMessage.phoneNumberId || apiMessage.phone_number_id,
    messageType: apiMessage.messageType || apiMessage.message_type || "unknown",
    textBody: apiMessage.textBody || apiMessage.text_body || "",
    createdAt: apiMessage.createdAt || apiMessage.created_at,
  };
}

function buildBroadcastStateFromApi(overview, apiCampaigns = []) {
  const lines = (overview.lines || []).map(normalizeLine);
  const users = (overview.users || []).map((user) => normalizeUser(user, lines));
  const campaigns = apiCampaigns.map((campaign) => normalizeCampaign(campaign, lines));
  const client = {
    ...mockBroadcastClient,
    id: overview.company.id,
    name: overview.company.name,
    alias: overview.company.alias,
    plan: overview.company.planLimit,
    protection: overview.company.operationalProtection,
    totalCapacity: overview.company.operationalCapacity,
    monthlyFee: `$${overview.company.monthlyFee} MXN`,
    extraBlockSize: overview.company.extraBlockSize,
    extraBlockPrice: `$${overview.company.extraBlockPrice} MXN`,
    used: overview.usage?.used || 0,
  };

  return { client, lines, users, campaigns };
}

function Dashboard({ client, lines, sourceStatus, session }) {
  const usedPercent = formatPercent(client.used, client.totalCapacity);
  const [testStatus, setTestStatus] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testRecipientPhone, setTestRecipientPhone] = useState("");
  const canSendWhatsAppTest = session?.role === "admin_cliente" && session?.sessionToken;

  async function handleSendWhatsAppTest() {
    const normalizedRecipientPhone = testRecipientPhone.replace(/\D/g, "");

    if (!normalizedRecipientPhone) {
      setTestStatus({
        ok: false,
        message: "Escribe un numero de WhatsApp para la prueba.",
        status: "error",
        whatsappMessageId: null,
        date: new Date().toLocaleString("es-MX"),
      });
      return;
    }

    setIsSendingTest(true);
    setTestStatus(null);

    try {
      const result = await sendWhatsAppTemplateTest(
        session.sessionToken,
        normalizedRecipientPhone
      );

      setTestStatus({
        ok: true,
        message: "Enviado",
        status: result.status,
        whatsappMessageId: result.whatsappMessageId,
        date: new Date().toLocaleString("es-MX"),
      });
    } catch (error) {
      setTestStatus({
        ok: false,
        message: error.message || "No se pudo enviar",
        status: "error",
        whatsappMessageId: null,
        date: new Date().toLocaleString("es-MX"),
      });
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="broadcast-view">
      <section className="broadcast-hero">
        <div>
          <span className="broadcast-tag">Acceso privado</span>
          <h1>GC Broadcast</h1>
          <p>
            Panel inicial para operar campañas de WhatsApp de {client.alias}
            con datos mock y estructura preparada para la siguiente etapa.
          </p>
        </div>
        <div className="broadcast-hero__summary">
          <span>{client.period}</span>
          <strong>
            {client.used} / {client.totalCapacity}
          </strong>
          <small>envios usados</small>
          <ProgressBar value={client.used} total={client.totalCapacity} />
          <small>{sourceStatus}</small>
        </div>
      </section>

      <section className="broadcast-metrics-grid">
        <Metric label="Plan contratado" value="1,000" helper="envios mensuales" />
        <Metric label="Proteccion" value="300" helper="envios operativos" tone="info" />
        <Metric label="Capacidad total" value="1,300" helper={`${100 - usedPercent}% disponible`} tone="good" />
        <Metric label="Bloque adicional" value="$75" helper="+50 envios al rebasar capacidad" tone="warning" />
      </section>

      {canSendWhatsAppTest ? (
        <section className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Prueba WhatsApp</h2>
              <p>Envia la plantilla hello_world al destinatario autorizado.</p>
            </div>
            <button
              type="button"
              className="broadcast-button broadcast-button--primary"
              onClick={handleSendWhatsAppTest}
              disabled={isSendingTest}
            >
              {isSendingTest ? "Enviando..." : "Enviar prueba WhatsApp"}
            </button>
          </div>
          <div className="broadcast-line-stack">
            <article className="broadcast-line-row">
              <div>
                <strong>Destinatario</strong>
                <input
                  type="tel"
                  value={testRecipientPhone}
                  onChange={(event) => setTestRecipientPhone(event.target.value)}
                  placeholder="Ej. 525512345678"
                  aria-label="Destinatario de prueba WhatsApp"
                />
              </div>
              <div>
                <strong>Plantilla</strong>
                <span>hello_world / en_US</span>
              </div>
            </article>
            {testStatus ? (
              <article className="broadcast-line-row">
                <div>
                  <strong>{testStatus.message}</strong>
                  <span>{testStatus.date}</span>
                </div>
                <div className="broadcast-line-row__usage">
                  <StatusPill>{testStatus.ok ? testStatus.status : "error"}</StatusPill>
                  <span>{testStatus.whatsappMessageId || "Sin message id"}</span>
                </div>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="broadcast-grid broadcast-grid--two">
        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Consumo por linea</h2>
              <p>Solo se cuentan envios realizados desde GC Broadcast.</p>
            </div>
          </div>
          <div className="broadcast-line-stack">
            {lines.map((line) => (
              <article className="broadcast-line-row" key={line.id}>
                <div>
                  <strong>{line.owner}</strong>
                  <span>{line.phone}</span>
                </div>
                <div className="broadcast-line-row__usage">
                  <span>
                    {line.used} / {line.limit}
                  </span>
                  <ProgressBar value={line.used} total={line.limit} />
                </div>
              </article>
            ))}
            {!lines.length ? (
              <div className="broadcast-empty-state">
                Aun no hay usuarios o lineas cargadas para mostrar consumo individual.
              </div>
            ) : null}
          </div>
        </div>

        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Alertas de capacidad</h2>
              <p>Estados visuales listos para conectar a consumo real.</p>
            </div>
          </div>
          <div className="broadcast-alert-list">
            <div className="broadcast-alert broadcast-alert--good">Verde: consumo normal</div>
            <div className="broadcast-alert broadcast-alert--warning">Amarillo: alerta al 80%</div>
            <div className="broadcast-alert broadcast-alert--orange">Naranja: alerta al 95%</div>
            <div className="broadcast-alert broadcast-alert--danger">Rojo: capacidad agotada</div>
            <div className="broadcast-alert broadcast-alert--info">Azul: bloque adicional activado</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Lines({ lines, session }) {
  const [connections, setConnections] = useState([]);
  const [inboundMessages, setInboundMessages] = useState([]);
  const [inboundStatus, setInboundStatus] = useState({
    type: "idle",
    message: "",
  });
  const [connectionStatus, setConnectionStatus] = useState({
    type: "idle",
    message: "",
  });
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [manualConnectionForm, setManualConnectionForm] = useState({
    lineName: "Departamento de tutoría",
    displayPhoneNumber: "+52 15549110102",
    wabaId: "1333554915020468",
    phoneNumberId: "1330058020181653",
    accessToken: "",
  });
  const [manualConnectionStatus, setManualConnectionStatus] = useState({
    type: "idle",
    message: "",
  });
  const [isSavingManualConnection, setIsSavingManualConnection] = useState(false);
  const [testConnectionId, setTestConnectionId] = useState("");
  const [manualTestRecipientPhone, setManualTestRecipientPhone] = useState("");
  const [manualTestMessage, setManualTestMessage] = useState(
    "Prueba real desde GC Broadcast."
  );
  const [manualTestStatus, setManualTestStatus] = useState(null);
  const [isSendingManualTest, setIsSendingManualTest] = useState(false);
  const canLoadConnections = session?.role === "admin_cliente" && session?.sessionToken;

  async function loadWhatsAppConnections() {
    const items = await getWhatsAppConnections(session.sessionToken);
    setConnections(items.map(normalizeWhatsAppConnection));
  }

  async function loadWhatsAppInboundMessages() {
    const items = await getWhatsAppInboundMessages(session.sessionToken);
    setInboundMessages(items.map(normalizeWhatsAppInboundMessage));
  }

  useEffect(() => {
    let isMounted = true;

    if (!canLoadConnections) {
      setConnections([]);
      setInboundMessages([]);
      return () => {
        isMounted = false;
      };
    }

    setConnectionStatus({
      type: "loading",
      message: "Consultando conexiones de WhatsApp...",
    });

    getWhatsAppConnections(session.sessionToken)
      .then((items) => {
        if (!isMounted) return;

        setConnections(items.map(normalizeWhatsAppConnection));
        setConnectionStatus({ type: "idle", message: "" });
      })
      .catch((error) => {
        if (!isMounted) return;

        setConnectionStatus({
          type: "error",
          message: error.message || "No se pudieron cargar las conexiones.",
        });
      });

    getWhatsAppInboundMessages(session.sessionToken)
      .then((items) => {
        if (!isMounted) return;

        setInboundMessages(items.map(normalizeWhatsAppInboundMessage));
      })
      .catch(() => {
        if (!isMounted) return;

        setInboundMessages([]);
      });

    return () => {
      isMounted = false;
    };
  }, [canLoadConnections, session?.sessionToken]);

  async function handleRefreshInboundMessages() {
    if (!canLoadConnections) {
      return;
    }

    setInboundStatus({
      type: "loading",
      message: "Consultando respuestas recibidas...",
    });

    try {
      await loadWhatsAppInboundMessages();
      setInboundStatus({
        type: "success",
        message: "Respuestas actualizadas.",
      });
    } catch (error) {
      setInboundStatus({
        type: "error",
        message: error.message || "No se pudieron cargar las respuestas.",
      });
    }
  }

  async function handleConnectWhatsAppBusiness() {
    if (!canLoadConnections) {
      setConnectionStatus({
        type: "error",
        message: "Solo el administrador puede conectar líneas de WhatsApp.",
      });
      return;
    }

    setIsConnectingWhatsApp(true);
    setConnectionStatus({
      type: "loading",
      message: "Abriendo conexión con Meta...",
    });

    try {
      const { code, embeddedSignup } = await startWhatsAppBusinessEmbeddedSignup();

      setConnectionStatus({
        type: "loading",
        message: "Guardando conexión en GC Broadcast...",
      });

      await exchangeEmbeddedSignupCode(session.sessionToken, code, embeddedSignup);
      await loadWhatsAppConnections();

      setConnectionStatus({
        type: "success",
        message: "Conexión recibida correctamente. Revisa el estado de la línea.",
      });
    } catch (error) {
      setConnectionStatus({
        type: "error",
        message: error.message || "No se pudo completar la conexión con Meta.",
      });
    } finally {
      setIsConnectingWhatsApp(false);
    }
  }

  function updateManualConnectionForm(event) {
    const { name, value } = event.target;

    setManualConnectionForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleCreateManualConnection(event) {
    event.preventDefault();

    if (!canLoadConnections) {
      setManualConnectionStatus({
        type: "error",
        message: "Solo el administrador puede guardar conexiones manuales.",
      });
      return;
    }

    setIsSavingManualConnection(true);
    setManualConnectionStatus({
      type: "loading",
      message: "Guardando conexion Cloud API...",
    });

    try {
      const connection = await createManualWhatsAppConnection(
        session.sessionToken,
        manualConnectionForm
      );

      await loadWhatsAppConnections();
      setTestConnectionId(connection.id);
      setManualConnectionForm((currentForm) => ({
        ...currentForm,
        accessToken: "",
      }));
      setManualConnectionStatus({
        type: "success",
        message: "Linea Cloud API conectada correctamente.",
      });
    } catch (error) {
      setManualConnectionStatus({
        type: "error",
        message: error.message || "No se pudo guardar la conexion manual.",
      });
    } finally {
      setIsSavingManualConnection(false);
    }
  }

  async function handleSendManualConnectionTest(event) {
    event.preventDefault();

    const recipientPhone = manualTestRecipientPhone.replace(/\D/g, "");

    if (!testConnectionId || !recipientPhone || !manualTestMessage.trim()) {
      setManualTestStatus({
        type: "error",
        message: "Selecciona una linea, escribe un destinatario y agrega un mensaje.",
      });
      return;
    }

    setIsSendingManualTest(true);
    setManualTestStatus({
      type: "loading",
      message: "Enviando mensaje de texto con la linea seleccionada...",
    });

    try {
      const result = await sendWhatsAppTextTest(
        session.sessionToken,
        recipientPhone,
        manualTestMessage.trim(),
        testConnectionId
      );

      setManualTestStatus({
        type: "success",
        message: "Mensaje enviado a Meta.",
        whatsappMessageId: result.whatsappMessageId,
        status: result.status,
        createdAt: new Date().toLocaleString("es-MX"),
      });
    } catch (error) {
      setManualTestStatus({
        type: "error",
        message: error.message || "Meta rechazo el mensaje de prueba.",
      });
    } finally {
      setIsSendingManualTest(false);
    }
  }

  const connectedOptions = connections.filter(
    (connection) => connection.connectionStatus === "connected"
  );

  return (
    <div className="broadcast-view">
      <PageHeading
        title="Lineas de WhatsApp"
        description="Estado operativo de las tres lineas iniciales de CACP."
      />

      <section className="broadcast-panel broadcast-whatsapp-connection-panel">
        <div className="broadcast-panel__header">
          <div>
            <h2>Conexión WhatsApp Business</h2>
            <p>Conecta una línea de WhatsApp Business App para usarla con GC Broadcast.</p>
          </div>
          <button
            type="button"
            className="broadcast-button broadcast-button--primary"
            onClick={handleConnectWhatsAppBusiness}
            disabled={!canLoadConnections || isConnectingWhatsApp}
          >
            {isConnectingWhatsApp ? "Conectando..." : "Conectar WhatsApp Business App"}
          </button>
        </div>

        {connectionStatus.message ? (
          <p className={`broadcast-form-status broadcast-form-status--${connectionStatus.type}`}>
            {connectionStatus.message}
          </p>
        ) : null}

        <div className="broadcast-line-stack">
          {connections.map((connection) => (
            <article className="broadcast-line-row broadcast-line-row--connection" key={connection.id}>
              <div>
                <strong>{connection.connectedPhone || "Número pendiente"}</strong>
                <span>phone_number_id: {connection.phoneNumberId || "Pendiente"}</span>
                <span>WABA: {connection.wabaId || "Pendiente"}</span>
              </div>
              <div className="broadcast-line-row__usage">
                <StatusPill>{connection.connectionStatus}</StatusPill>
                <span>
                  {connection.createdAt
                    ? new Date(connection.createdAt).toLocaleString("es-MX")
                    : "Sin fecha"}
                </span>
              </div>
            </article>
          ))}

          {!connections.length && connectionStatus.type !== "loading" ? (
            <div className="broadcast-empty-state">
              No hay líneas conectadas todavía.
            </div>
          ) : null}
        </div>
      </section>

      <section className="broadcast-panel">
        <div className="broadcast-panel__header">
          <div>
            <h2>Conexion manual Cloud API</h2>
            <p>Registra una linea real de WhatsApp Cloud API para usarla en pruebas de GC Broadcast.</p>
          </div>
        </div>

        <form className="broadcast-form" onSubmit={handleCreateManualConnection}>
          <label>
            Nombre de linea
            <input
              type="text"
              name="lineName"
              value={manualConnectionForm.lineName}
              onChange={updateManualConnectionForm}
              placeholder="Ej. Linea Gabriela"
              required
            />
          </label>

          <label>
            Numero visible
            <input
              type="text"
              name="displayPhoneNumber"
              value={manualConnectionForm.displayPhoneNumber}
              onChange={updateManualConnectionForm}
              placeholder="+52 15549110102"
              required
            />
          </label>

          <label>
            WABA ID
            <input
              type="text"
              name="wabaId"
              value={manualConnectionForm.wabaId}
              onChange={updateManualConnectionForm}
              placeholder="1333554915020468"
              required
            />
          </label>

          <label>
            Phone Number ID
            <input
              type="text"
              name="phoneNumberId"
              value={manualConnectionForm.phoneNumberId}
              onChange={updateManualConnectionForm}
              placeholder="1330058020181653"
              required
            />
          </label>

          <label className="broadcast-form__wide">
            Access token
            <input
              type="password"
              name="accessToken"
              value={manualConnectionForm.accessToken}
              onChange={updateManualConnectionForm}
              placeholder="Pega aqui el access token de Meta"
              autoComplete="off"
              required
            />
          </label>

          <div className="broadcast-form__wide broadcast-form-actions">
            <button
              type="submit"
              className="broadcast-button broadcast-button--primary"
              disabled={!canLoadConnections || isSavingManualConnection}
            >
              {isSavingManualConnection ? "Guardando..." : "Guardar conexion manual"}
            </button>
          </div>

          {manualConnectionStatus.message ? (
            <p
              className={`broadcast-form-status broadcast-form-status--${manualConnectionStatus.type} broadcast-form__wide`}
            >
              {manualConnectionStatus.message}
            </p>
          ) : null}
        </form>

        <form className="broadcast-form broadcast-test-form" onSubmit={handleSendManualConnectionTest}>
          <label>
            Linea para prueba
            <select
              value={testConnectionId}
              onChange={(event) => setTestConnectionId(event.target.value)}
              disabled={!connectedOptions.length}
              required
            >
              <option value="">Selecciona una linea conectada</option>
              {connectedOptions.map((connection) => (
                <option value={connection.id} key={connection.id}>
                  {connection.lineName || connection.displayPhoneNumber || connection.connectedPhone || connection.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destinatario de prueba
            <input
              type="tel"
              value={manualTestRecipientPhone}
              onChange={(event) => setManualTestRecipientPhone(event.target.value)}
              placeholder="Ej. 525567359470"
              required
            />
          </label>

          <label className="broadcast-form__wide">
            Mensaje de prueba
            <textarea
              value={manualTestMessage}
              onChange={(event) => setManualTestMessage(event.target.value)}
              placeholder="Escribe el mensaje de prueba"
              required
            />
          </label>

          <div className="broadcast-form__wide broadcast-form-actions">
            <button
              type="submit"
              className="broadcast-button broadcast-button--primary"
              disabled={!canLoadConnections || !connectedOptions.length || isSendingManualTest}
            >
              {isSendingManualTest ? "Enviando..." : "Enviar prueba con linea"}
            </button>
          </div>

          {manualTestStatus?.message ? (
            <div
              className={`broadcast-form-status broadcast-form-status--${manualTestStatus.type} broadcast-form__wide`}
            >
              <strong>{manualTestStatus.message}</strong>
              {manualTestStatus.whatsappMessageId ? (
                <span>message_id: {manualTestStatus.whatsappMessageId}</span>
              ) : null}
              {manualTestStatus.status ? <span>status: {manualTestStatus.status}</span> : null}
              {manualTestStatus.createdAt ? <span>{manualTestStatus.createdAt}</span> : null}
            </div>
          ) : null}
        </form>
      </section>

      <DataTable
        columns={["Responsable", "Telefono", "Estado", "Limite", "Consumo", "Campañas", "Ultimo envio"]}
        rows={lines.map((line) => [
          line.owner,
          line.phone,
          <StatusPill key="status">{line.status}</StatusPill>,
          line.limit,
          <span key="usage" className="broadcast-table-usage">
            {line.used} / {line.limit}
            <ProgressBar value={line.used} total={line.limit} />
          </span>,
          line.campaigns,
          line.lastSent,
        ])}
      />

      <section className="broadcast-panel">
        <div className="broadcast-panel__header">
          <div>
            <h2>Respuestas recibidas</h2>
            <p>Mensajes que llegan por el webhook de WhatsApp Cloud API.</p>
          </div>
          <button
            type="button"
            className="broadcast-button"
            onClick={handleRefreshInboundMessages}
            disabled={!canLoadConnections || inboundStatus.type === "loading"}
          >
            {inboundStatus.type === "loading" ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {inboundStatus.message ? (
          <p className={`broadcast-form-status broadcast-form-status--${inboundStatus.type}`}>
            {inboundStatus.message}
          </p>
        ) : null}

        <div className="broadcast-line-stack">
          {inboundMessages.map((message) => (
            <article className="broadcast-line-row" key={message.id}>
              <div>
                <strong>{message.fromPhone || "Remitente pendiente"}</strong>
                <span>{message.textBody || `Mensaje tipo ${message.messageType}`}</span>
                <span>phone_number_id: {message.phoneNumberId || "Pendiente"}</span>
              </div>
              <div className="broadcast-line-row__usage">
                <StatusPill>{message.messageType}</StatusPill>
                <span>
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleString("es-MX")
                    : "Sin fecha"}
                </span>
              </div>
            </article>
          ))}

          {!inboundMessages.length ? (
            <div className="broadcast-empty-state">
              Aun no hay respuestas recibidas por webhook.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Users({ users, session, onUserCreated, onUserUpdated }) {
  const canEditMonthlyAssignments = isLastDayOfMonth();
  const safeUsers = users.map((user) => ({
    ...user,
    assignedMessages: user.assignedMessages || 100,
    menuAccess: Array.isArray(user.menuAccess) ? user.menuAccess : [],
    status: user.status || "invitation_pending",
    lastAccess: user.lastAccess || "Sin acceso",
  }));
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "operador_cliente",
    assignedMessages: "400",
    whatsappConnectionId: "",
    menuAccess: ["dashboard", "new", "history"],
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    let isMounted = true;

    if (!session?.sessionToken) {
      return () => {
        isMounted = false;
      };
    }

    getWhatsAppConnections(session.sessionToken)
      .then((items) => {
        if (!isMounted) return;

        const connectedItems = items
          .map(normalizeWhatsAppConnection)
          .filter((connection) => connection.connectionStatus === "connected");

        setConnections(connectedItems);
        const primaryConnection = getPrimaryWhatsAppConnection(connectedItems);
        setForm((currentForm) => ({
          ...currentForm,
          whatsappConnectionId: primaryConnection?.id || "",
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setConnections([]);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.sessionToken]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Creando usuario local..." });

    try {
      const createdUser = await createBroadcastUser(session.sessionToken, {
        ...form,
        assignedMessages: Number(form.assignedMessages),
      });

      onUserCreated(normalizeUser(createdUser));
      setForm({
        name: "",
        phone: "",
        password: "",
        role: "operador_cliente",
        assignedMessages: "400",
        whatsappConnectionId: getPrimaryWhatsAppConnection(connections)?.id || "",
        menuAccess: ["dashboard", "new", "history"],
      });
      setStatus({
        type: "success",
        message: "Usuario creado localmente. Se mantendra mientras el backend local siga activo.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "No se pudo crear el usuario local.",
      });
    }
  }

  async function handleStatusChange(userId, status) {
    setStatus({ type: "loading", message: "Actualizando estado del usuario..." });

    try {
      const updatedUser = await updateBroadcastUserStatus(userId, status);
      onUserUpdated(normalizeUser(updatedUser));
      setStatus({ type: "success", message: "Estado actualizado localmente." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "No se pudo actualizar el estado.",
      });
    }
  }

  async function handleMessagesChange(userId, assignedMessages) {
    setStatus({ type: "loading", message: "Actualizando mensajes asignados..." });

    try {
      const updatedUser = await updateBroadcastUserMessages(userId, Number(assignedMessages));
      onUserUpdated(normalizeUser(updatedUser));
      setStatus({ type: "success", message: "Mensajes actualizados para el siguiente periodo." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "No se pudieron actualizar los mensajes asignados.",
      });
    }
  }

  async function handleAccessChange(userId, selectedOptions) {
    const menuAccess = Array.isArray(selectedOptions)
      ? selectedOptions
      : Array.from(selectedOptions, (option) => option.value);
    setStatus({ type: "loading", message: "Actualizando accesos del usuario..." });

    try {
      const updatedUser = await updateBroadcastUserAccess(userId, menuAccess);
      onUserUpdated(normalizeUser(updatedUser));
      setStatus({ type: "success", message: "Accesos actualizados localmente." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "No se pudieron actualizar los accesos.",
      });
    }
  }

  function toggleFormMenuAccess(menuId) {
    setForm((currentForm) => {
      const hasAccess = currentForm.menuAccess.includes(menuId);

      return {
        ...currentForm,
        menuAccess: hasAccess
          ? currentForm.menuAccess.filter((item) => item !== menuId)
          : [...currentForm.menuAccess, menuId],
      };
    });
  }

  function toggleUserMenuAccess(user, menuId) {
    const currentMenuAccess = Array.isArray(user.menuAccess) ? user.menuAccess : [];
    const hasAccess = currentMenuAccess.includes(menuId);
    const nextMenuAccess = hasAccess
      ? currentMenuAccess.filter((item) => item !== menuId)
      : [...currentMenuAccess, menuId];

    handleAccessChange(user.id, nextMenuAccess);
  }

  return (
    <div className="broadcast-view">
      <PageHeading
        title="Usuarios"
        description="Administracion visual de accesos para el equipo de CACP. El admin podra crear usuarios y asignar capacidad de mensajes cuando conectemos el backend."
      />
      <div className="broadcast-period-note">
        <strong>Regla de mensajes asignados</strong>
        <span>
          La reasignacion de mensajes solo se puede modificar el ultimo dia del mes y aplica
          para el siguiente periodo.
        </span>
      </div>

      <section className="broadcast-grid broadcast-grid--two">
        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Crear usuario</h2>
              <p>Formulario local para preparar accesos y capacidad mensual por usuario.</p>
            </div>
          </div>
          <form
            id="broadcast-create-user-form"
            className="broadcast-form broadcast-form--single"
            onSubmit={handleSubmit}
          >
            <label>
              Nombre completo
              <input
                type="text"
                name="name"
                value={form.name}
                placeholder="Ej. Nombre del usuario"
                onChange={updateForm}
                required
              />
            </label>
            <label>
              Telefono
              <input
                type="tel"
                name="phone"
                value={form.phone}
                placeholder="9610000000"
                onChange={updateForm}
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                name="password"
                value={form.password}
                placeholder="Asigna una contrasena provisional"
                autoComplete="new-password"
                onChange={updateForm}
                required
              />
            </label>
            <label>
              Rol
              <select name="role" value={form.role} onChange={updateForm}>
                <option value="admin_cliente">Admin cliente</option>
                <option value="operador_cliente">Operador cliente</option>
                <option value="lectura_cliente">Solo lectura</option>
              </select>
            </label>
            <label>
              Mensajes asignados
              <select
                name="assignedMessages"
                value={form.assignedMessages}
                onChange={updateForm}
              >
                {Array.from({ length: 10 }, (_, index) => (index + 1) * 100).map((amount) => (
                  <option key={amount} value={amount}>
                    {amount} mensajes
                  </option>
                ))}
              </select>
            </label>
            <div className="broadcast-form-note">
              Los envios de todos los usuarios usaran la linea principal:{" "}
              {getPrimaryWhatsAppConnection(connections)?.lineName || "Departamento de tutoría"}.
            </div>
            <label>
              Accesos del panel
              <div className="broadcast-checkbox-grid">
                {MENU_ACCESS_OPTIONS.map((option) => (
                  <label key={option.id} className="broadcast-checkbox">
                    <input
                      type="checkbox"
                      checked={form.menuAccess.includes(option.id)}
                      onChange={() => toggleFormMenuAccess(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </label>
            <button
              type="submit"
              className="broadcast-button broadcast-button--primary"
              disabled={status.type === "loading"}
            >
              Crear usuario
            </button>
            {status.message ? (
              <p className={`broadcast-form-status broadcast-form-status--${status.type}`}>
                {status.message}
              </p>
            ) : null}
          </form>
        </div>

        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Permisos previstos</h2>
              <p>Separacion lista para validar en backend por company_id y rol.</p>
            </div>
          </div>
          <div className="broadcast-permission-list">
            <article>
              <strong>Admin cliente</strong>
              <span>Crea usuarios, revisa consumo, administra campañas y lineas.</span>
            </article>
            <article>
              <strong>Operador cliente</strong>
              <span>Crea campañas, carga contactos y revisa envios de sus lineas.</span>
            </article>
            <article>
              <strong>Solo lectura</strong>
              <span>Consulta dashboard, historial, estados y consumo sin editar.</span>
            </article>
          </div>
        </div>
      </section>

      <DataTable
        columns={[
          "Usuario",
          "Telefono",
          "Rol",
          "Linea asignada",
          "Firma institucional",
          "Mensajes asignados",
          "Accesos",
          "Estado",
          "Ultimo acceso",
        ]}
        rows={safeUsers.map((user) => [
          user.name,
          user.phone,
          user.role,
          <div key="line" className="broadcast-access-tags">
            {user.whatsappLineName || user.whatsappDisplayPhoneNumber ? (
              <span>
                {user.whatsappLineName || user.whatsappDisplayPhoneNumber}
              </span>
            ) : (
              <span>Sin linea</span>
            )}
          </div>,
          <div key="signature" className="broadcast-access-tags">
            {user.signatureName ? (
              <span>{user.signatureName}</span>
            ) : (
              <span>Sin firma</span>
            )}
          </div>,
          <select
            key="messages"
            className="broadcast-table-select"
            value={user.assignedMessages}
            disabled={!canEditMonthlyAssignments}
            aria-label={`Mensajes asignados de ${user.name}`}
            onChange={(event) => handleMessagesChange(user.id, event.target.value)}
          >
            {MESSAGE_ASSIGNMENT_OPTIONS.map((amount) => (
              <option key={amount} value={amount}>
                {amount}
              </option>
            ))}
          </select>,
          <div key="access" className="broadcast-access-cell">
            <div className="broadcast-access-tags">
              {MENU_ACCESS_OPTIONS.filter((option) =>
                user.menuAccess.includes(option.id)
              ).map((option) => (
                <span key={option.id}>{option.label}</span>
              ))}
              {!user.menuAccess.length ? <span>Sin accesos</span> : null}
            </div>
            <select
              className="broadcast-table-select"
              aria-label={`Accesos de ${user.name}`}
              value=""
              onChange={(event) => {
                if (!event.target.value) return;
                toggleUserMenuAccess(user, event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Modificar accesos</option>
              {MENU_ACCESS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {user.menuAccess.includes(option.id) ? "[x] " : ""}{option.label}
                </option>
              ))}
            </select>
          </div>,
          <select
            key="status"
            className="broadcast-table-select"
            value={user.status}
            aria-label={`Estado de ${user.name}`}
            onChange={(event) => handleStatusChange(user.id, event.target.value)}
          >
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>,
          user.lastAccess,
        ])}
      />
    </div>
  );
}

function Campaigns({ campaignsData, history = false }) {
  return (
    <div className="broadcast-view">
      <PageHeading
        title={history ? "Historial de campañas" : "Campañas"}
        description={
          history
            ? "Consulta de campañas recientes, estado y responsable."
            : "Preparacion y seguimiento de campañas de CACP."
        }
        actionLabel={history ? "" : "Crear campaña"}
      />
      <DataTable
        columns={[
          "Nombre",
          "Tipo",
          "Linea",
          "Destinatarios",
          "Adjuntos",
          "Estado",
          "Creacion",
          "Envio",
          "Responsable",
        ]}
        rows={campaignsData.map((campaign) => [
          campaign.name,
          campaign.type,
          campaign.line,
          campaign.recipients,
          campaign.attachments,
          <StatusPill key="status">{campaign.status}</StatusPill>,
          campaign.createdAt,
          campaign.sendAt,
          campaign.owner,
        ])}
        emptyMessage="Aun no hay campañas creadas."
      />
    </div>
  );
}

const DELIVERY_STATUS_LABELS = {
  pending: "Pendiente",
  submitted: "Aceptado",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leido",
  failed: "Fallido",
};

const DELIVERY_STATUS_ORDER = ["read", "delivered", "sent", "submitted", "pending", "failed"];

function formatBroadcastDate(value) {
  if (!value) {
    return "Pendiente";
  }

  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function DeliveryStatusPill({ status }) {
  return (
    <span className={`delivery-status delivery-status--${status || "pending"}`}>
      {DELIVERY_STATUS_LABELS[status] || status || "Pendiente"}
    </span>
  );
}

function DeliverySummaryBar({ summary }) {
  const total = summary?.total || 0;

  if (!total) {
    return <div className="delivery-summary-bar delivery-summary-bar--empty" />;
  }

  return (
    <div className="delivery-summary-bar" aria-label="Resumen visual de entrega">
      {DELIVERY_STATUS_ORDER.map((status) => {
        const value = summary?.[status] || 0;

        if (!value) return null;

        return (
          <span
            key={status}
            className={`delivery-summary-bar__segment delivery-summary-bar__segment--${status}`}
            style={{ width: `${(value / total) * 100}%` }}
            title={`${DELIVERY_STATUS_LABELS[status]}: ${value}`}
          />
        );
      })}
    </div>
  );
}

function DeliveryReports({ session }) {
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [status, setStatus] = useState({ type: "loading", message: "Cargando resultados..." });

  const selectedReport = reports.find((report) => report.id === selectedReportId) || reports[0] || null;

  async function loadReports() {
    setStatus({ type: "loading", message: "Actualizando resultados..." });

    try {
      const items = await getBroadcastCampaignDeliveryReports(session.sessionToken);

      setReports(items);
      setSelectedReportId((currentValue) =>
        items.some((item) => item.id === currentValue) ? currentValue : items[0]?.id || ""
      );
      setStatus({ type: "success", message: "Resultados actualizados." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "No se pudieron cargar los resultados.",
      });
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialReports() {
      try {
        const items = await getBroadcastCampaignDeliveryReports(session.sessionToken);

        if (!isMounted) return;

        setReports(items);
        setSelectedReportId(items[0]?.id || "");
        setStatus({ type: "idle", message: "" });
      } catch (error) {
        if (!isMounted) return;

        setStatus({
          type: "error",
          message: error.message || "No se pudieron cargar los resultados.",
        });
      }
    }

    loadInitialReports();

    return () => {
      isMounted = false;
    };
  }, [session.sessionToken]);

  return (
    <div className="broadcast-view">
      <PageHeading
        title="Resultados de envios"
        description="Seguimiento por archivo cargado con estados de WhatsApp: enviado, entregado, leido y fallido."
        actionLabel="Actualizar"
        actionProps={{ onClick: loadReports }}
      />

      {status.message ? (
        <p className={`broadcast-form-status broadcast-form-status--${status.type}`}>
          {status.message}
        </p>
      ) : null}

      {!reports.length && status.type !== "loading" ? (
        <section className="broadcast-panel">
          <div className="broadcast-empty-state">
            Aun no hay paquetes de mensajes enviados.
          </div>
        </section>
      ) : null}

      {reports.length ? (
        <section className="delivery-layout">
          <aside className="delivery-package-list">
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                className={`delivery-package-card ${
                  selectedReport?.id === report.id ? "delivery-package-card--active" : ""
                }`}
                onClick={() => setSelectedReportId(report.id)}
              >
                <span>{report.name}</span>
                <strong>{report.summary?.total || 0} mensajes</strong>
                <DeliverySummaryBar summary={report.summary} />
                <small>{formatBroadcastDate(report.sentAt || report.createdAt)}</small>
              </button>
            ))}
          </aside>

          {selectedReport ? (
            <section className="delivery-detail-card">
              <div className="delivery-detail-card__header">
                <div>
                  <span className="broadcast-pill broadcast-pill--info">
                    {selectedReport.type}
                  </span>
                  <h2>{selectedReport.name}</h2>
                  <p>
                    {selectedReport.lineName}  ·  {formatBroadcastDate(selectedReport.sentAt)}
                  </p>
                </div>
                <StatusPill>{selectedReport.status}</StatusPill>
              </div>

              <div className="delivery-metrics">
                <Metric label="Total" value={selectedReport.summary?.total || 0} helper="mensajes del archivo" />
                <Metric label="Entregados" value={(selectedReport.summary?.delivered || 0) + (selectedReport.summary?.read || 0)} helper="incluye leidos" tone="good" />
                <Metric label="Leidos" value={selectedReport.summary?.read || 0} helper="confirmados por WhatsApp" tone="info" />
                <Metric label="Fallidos" value={selectedReport.summary?.failed || 0} helper="rechazados o no entregables" tone="danger" />
              </div>

              <DeliverySummaryBar summary={selectedReport.summary} />

              <DataTable
                columns={["Contacto", "Telefono", "Estado", "Historial", "Detalle"]}
                rows={(selectedReport.recipients || []).map((recipient) => [
                  recipient.name,
                  recipient.phone,
                  <DeliveryStatusPill key="status" status={recipient.deliveryStatus} />,
                  recipient.statusTimeline?.length
                    ? recipient.statusTimeline.map((item) => DELIVERY_STATUS_LABELS[item.status] || item.status).join(" -> ")
                    : "Sin webhook aun",
                  recipient.errorMessage || recipient.whatsappMessageId || "Sin detalle",
                ])}
                emptyMessage="Este paquete no tiene destinatarios registrados."
              />
            </section>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function WebChatPage({ session }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({ type: "loading", message: "Cargando conversaciones..." });
  const [messageStatus, setMessageStatus] = useState({ type: "idle", message: "" });

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) || null;

  async function loadConversations() {
    const items = await getWebChatConversations(session.sessionToken);

    setConversations(items);
    setStatus({ type: "idle", message: "" });

    if (!selectedConversationId && items[0]) {
      setSelectedConversationId(items[0].id);
    }
  }

  async function loadMessages(conversationId = selectedConversationId) {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const items = await getWebChatConversationMessages(session.sessionToken, conversationId);

    setMessages(items);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const items = await getWebChatConversations(session.sessionToken);

        if (!isMounted) return;

        setConversations(items);
        setSelectedConversationId((currentValue) => currentValue || items[0]?.id || "");
        setStatus({ type: "idle", message: "" });
      } catch (error) {
        if (!isMounted) return;

        setStatus({
          type: "error",
          message: error.message || "No se pudieron cargar las conversaciones.",
        });
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [session.sessionToken]);

  useEffect(() => {
    let isMounted = true;

    async function refresh() {
      try {
        const items = await getWebChatConversations(session.sessionToken);

        if (!isMounted) return;

        setConversations(items);

        const activeId = selectedConversationId || items[0]?.id || "";

        if (activeId) {
          const messageItems = await getWebChatConversationMessages(session.sessionToken, activeId);

          if (!isMounted) return;

          setMessages(messageItems);
        }
      } catch {
        if (!isMounted) return;
      }
    }

    refresh();
    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [session.sessionToken, selectedConversationId]);

  async function handleSelectConversation(conversationId) {
    setSelectedConversationId(conversationId);
    setMessageStatus({ type: "idle", message: "" });

    try {
      await markWebChatConversationAsRead(session.sessionToken, conversationId);
      await loadConversations();
      await loadMessages(conversationId);
    } catch (error) {
      setMessageStatus({
        type: "error",
        message: error.message || "No se pudo abrir la conversacion.",
      });
    }
  }

  async function handleSendMessage(content) {
    if (!selectedConversationId) {
      return;
    }

    setMessageStatus({ type: "loading", message: "Enviando..." });

    try {
      await sendWebChatMessage(session.sessionToken, selectedConversationId, { content });
      await loadConversations();
      await loadMessages(selectedConversationId);
      setMessageStatus({ type: "idle", message: "" });
    } catch (error) {
      setMessageStatus({
        type: "error",
        message: error.message || "No se pudo enviar el mensaje.",
      });
      throw error;
    }
  }

  async function handleUploadAttachment(file) {
    if (!selectedConversationId || !file) {
      return;
    }

    await uploadWebChatAttachment(session.sessionToken, selectedConversationId, file);
    setMessageStatus({
      type: "success",
      message: "Adjunto preparado. El envio real de archivos queda listo para conectar almacenamiento.",
    });
  }

  return (
    <div className="broadcast-view broadcast-web-chat-view">
      <PageHeading
        title="Web chat"
        description="Gestiona conversaciones individuales con contactos de WhatsApp."
      />

      {status.message ? (
        <p className={`broadcast-form-status broadcast-form-status--${status.type}`}>
          {status.message}
        </p>
      ) : null}

      <section className="web-chat-shell">
        <WebChatConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
        <WebChatWindow
          conversation={selectedConversation}
          messages={messages}
          messageStatus={messageStatus}
          sessionToken={session.sessionToken}
          onSendMessage={handleSendMessage}
          onUploadAttachment={handleUploadAttachment}
        />
      </section>
    </div>
  );
}

function WebChatConversationList({ conversations, selectedConversationId, onSelectConversation }) {
  return (
    <aside className="web-chat-list">
      <div className="web-chat-list__header">
        <strong>Conversaciones</strong>
        <span>{conversations.length}</span>
      </div>
      <div className="web-chat-list__items">
        {conversations.map((conversation) => (
          <WebChatConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === selectedConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
        {!conversations.length ? (
          <div className="broadcast-empty-state">No hay conversaciones todavia.</div>
        ) : null}
      </div>
    </aside>
  );
}

function WebChatConversationItem({ conversation, active, onClick }) {
  const hasUnread = Number(conversation.unreadCount || 0) > 0;

  return (
    <button
      type="button"
      className={`web-chat-conversation ${active ? "web-chat-conversation--active" : ""} ${
        hasUnread ? "web-chat-conversation--unread" : ""
      }`}
      onClick={onClick}
    >
      <div>
        <strong>{conversation.contactName || conversation.phoneNumber}</strong>
        <span>{conversation.lastMessage || "Sin mensajes"}</span>
      </div>
      <div className="web-chat-conversation__meta">
        {conversation.lastMessageAt ? (
          <span>{new Date(conversation.lastMessageAt).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}</span>
        ) : null}
        {hasUnread ? <em>{conversation.unreadCount}</em> : null}
      </div>
    </button>
  );
}

function WebChatWindow({
  conversation,
  messages,
  messageStatus,
  sessionToken,
  onSendMessage,
  onUploadAttachment,
}) {
  return (
    <section className="web-chat-window">
      {conversation ? (
        <>
          <header className="web-chat-window__header">
            <strong>{conversation.contactName || conversation.phoneNumber}</strong>
            <span>{conversation.phoneNumber}</span>
          </header>
          <div className="web-chat-messages">
            {messages.map((message) => (
              <WebChatMessageBubble message={message} sessionToken={sessionToken} key={message.id} />
            ))}
          </div>
          {messageStatus.message ? (
            <p className={`broadcast-form-status broadcast-form-status--${messageStatus.type}`}>
              {messageStatus.message}
            </p>
          ) : null}
          <WebChatComposer onSendMessage={onSendMessage} onUploadAttachment={onUploadAttachment} />
        </>
      ) : (
        <div className="web-chat-empty">Selecciona una conversacion para comenzar.</div>
      )}
    </section>
  );
}

function WebChatMessageBubble({ message, sessionToken }) {
  const isOutgoing = message.direction === "outgoing";

  return (
    <article className={`web-chat-bubble ${isOutgoing ? "web-chat-bubble--outgoing" : ""}`}>
      <WebChatMessageContent message={message} sessionToken={sessionToken} />
      <span>
        {message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""}
        {isOutgoing ? `  ·  ${message.status}` : ""}
      </span>
    </article>
  );
}

function formatFileSize(bytes) {
  const numericBytes = Number(bytes || 0);

  if (!numericBytes) {
    return "";
  }

  if (numericBytes < 1024 * 1024) {
    return `${Math.round(numericBytes / 1024)} KB`;
  }

  return `${(numericBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function WebChatMessageContent({ message, sessionToken }) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaError, setMediaError] = useState("");
  const type = String(message.type || "text").toLowerCase();
  const isMedia = ["image", "audio", "document", "file"].includes(type);

  useEffect(() => {
    let objectUrl = "";
    let isMounted = true;

    async function loadMedia() {
      if (!isMedia || !message.hasMedia) {
        return;
      }

      try {
        const { blob } = await getWebChatMessageMediaBlob(sessionToken, message.id);

        if (!isMounted) return;

        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
        setMediaError("");
      } catch {
        if (!isMounted) return;

        setMediaError("No se pudo cargar el archivo.");
      }
    }

    loadMedia();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isMedia, message.hasMedia, message.id, sessionToken]);

  if (type === "text") {
    return <p>{message.content || ""}</p>;
  }

  if (type === "image") {
    if (mediaError) {
      return <p>{mediaError}</p>;
    }

    if (!mediaUrl) {
      return <p>Cargando imagen...</p>;
    }

    return (
      <div className="web-chat-media">
        <a href={mediaUrl} target="_blank" rel="noreferrer">
          <img src={mediaUrl} alt={message.attachmentName || "Imagen recibida"} />
        </a>
        {message.content ? <p>{message.content}</p> : null}
      </div>
    );
  }

  if (type === "audio") {
    if (mediaError) {
      return <p>{mediaError}</p>;
    }

    if (!mediaUrl) {
      return <p>Cargando audio...</p>;
    }

    return (
      <div className="web-chat-media">
        <audio src={mediaUrl} controls />
        <a href={mediaUrl} target="_blank" rel="noreferrer">Abrir audio</a>
      </div>
    );
  }

  if (type === "document" || type === "file") {
    const fileName = message.attachmentName || "Archivo recibido";

    return (
      <div className="web-chat-file-card">
        <strong>Archivo</strong>
        <p>{fileName}</p>
        {message.attachmentSize ? <span>{formatFileSize(message.attachmentSize)}</span> : null}
        {mediaUrl ? (
          <a href={mediaUrl} target="_blank" rel="noreferrer" download={fileName}>
            Descargar
          </a>
        ) : (
          <span>{mediaError || "Preparando descarga..."}</span>
        )}
      </div>
    );
  }

  return <p>{message.content || message.attachmentName || `Mensaje ${message.type}`}</p>;
}

function WebChatComposer({ onSendMessage, onUploadAttachment }) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSending(true);

    try {
      await onSendMessage(content.trim());
      setContent("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="web-chat-composer" onSubmit={handleSubmit}>
      <WebChatAttachmentButton onUploadAttachment={onUploadAttachment} />
      <input
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button type="submit" className="broadcast-button broadcast-button--primary" disabled={isSending}>
        {isSending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}

function WebChatAttachmentButton({ onUploadAttachment }) {
  return (
    <label className="web-chat-attach">
      Adjuntar
      <input
        type="file"
        hidden
        onChange={(event) => onUploadAttachment(event.target.files?.[0] || null)}
      />
    </label>
  );
}

function NewCampaign({ session }) {
  const canSelectLine = canChooseCampaignLine();
  const [selectedCampaignType, setSelectedCampaignType] = useState("solicitud_contacto");
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  const visibleCampaignTypes = useMemo(() => {
    if (session?.role === "admin_cliente") {
      return campaignTypes;
    }

    const allowedTemplateNames = new Set(
      allowedTemplates.map((template) => template.templateName || template.template_name)
    );

    return campaignTypes.filter(
      (type) => type.officialTemplateName && allowedTemplateNames.has(type.officialTemplateName)
    );
  }, [allowedTemplates, session?.role]);
  const selectedCampaign =
    visibleCampaignTypes.find((type) => type.id === selectedCampaignType) ||
    visibleCampaignTypes[0] ||
    campaignTypes[0];
  const selectedAllowedTemplate = allowedTemplates.find(
    (template) =>
      (template.templateName || template.template_name) === selectedCampaign.officialTemplateName
  );
  const [campaignName, setCampaignName] = useState("Nueva campana CACP");
  const [connections, setConnections] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [messageBody, setMessageBody] = useState(selectedCampaign.template);
  const [sendStatus, setSendStatus] = useState({ type: "idle", message: "" });
  const [recipients, setRecipients] = useState([]);
  const [excelFileName, setExcelFileName] = useState("");
  const [generalAttachment, setGeneralAttachment] = useState(null);
  const [personalizedAttachments, setPersonalizedAttachments] = useState(false);
  const [isReadyToConfirm, setIsReadyToConfirm] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [sendSummary, setSendSummary] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const previewRecipient = recipients[0] || sampleRecipients[0];
  const senderName = getCampaignSenderName(session);
  const hasCampaignTemplateAccess = session?.role === "admin_cliente" || visibleCampaignTypes.length > 0;

  useEffect(() => {
    let isMounted = true;

    if (!session?.sessionToken) {
      setAllowedTemplates([]);
      return () => {
        isMounted = false;
      };
    }

    getBroadcastAllowedTemplates(session.sessionToken)
      .then((items) => {
        if (!isMounted) return;
        setAllowedTemplates(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setAllowedTemplates([]);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.sessionToken]);

  useEffect(() => {
    if (!visibleCampaignTypes.length) {
      return;
    }

    if (!visibleCampaignTypes.some((type) => type.id === selectedCampaignType)) {
      setSelectedCampaignType(visibleCampaignTypes[0].id);
      const allowedTemplate = allowedTemplates.find(
        (template) =>
          (template.templateName || template.template_name) === visibleCampaignTypes[0].officialTemplateName
      );
      setMessageBody(allowedTemplate?.bodyText || visibleCampaignTypes[0].template);
    }
  }, [allowedTemplates, selectedCampaignType, visibleCampaignTypes]);

  useEffect(() => {
    setMessageBody(selectedAllowedTemplate?.bodyText || selectedCampaign.template);
  }, [selectedAllowedTemplate?.bodyText, selectedCampaign.id, selectedCampaign.template]);

  useEffect(() => {
    let isMounted = true;

    if (!session?.sessionToken) {
      setConnections([]);
      return () => {
        isMounted = false;
      };
    }

    getWhatsAppConnections(session.sessionToken)
      .then((items) => {
        if (!isMounted) return;

        const connectedItems = items
          .map(normalizeWhatsAppConnection)
          .filter((connection) => connection.connectionStatus === "connected");
        const primaryConnection = getPrimaryWhatsAppConnection(connectedItems);
        const allowedItems = primaryConnection ? [primaryConnection] : [];

        setConnections(allowedItems);
        setSelectedConnectionId((currentValue) => {
          if (allowedItems.some((connection) => connection.id === currentValue)) {
            return currentValue;
          }

          return allowedItems[0]?.id || "";
        });
      })
      .catch(() => {
        if (!isMounted) return;

        setConnections([]);
        setSelectedConnectionId(session?.whatsappConnectionId || "");
      });

    return () => {
      isMounted = false;
    };
  }, [canSelectLine, session?.sessionToken, session?.whatsappConnectionId]);

  function handleCampaignTypeChange(event) {
    const nextCampaignType = event.target.value;
    const nextCampaign = visibleCampaignTypes.find((type) => type.id === nextCampaignType) || visibleCampaignTypes[0] || campaignTypes[0];

    setSelectedCampaignType(nextCampaignType);
    const allowedTemplate = allowedTemplates.find(
      (template) => (template.templateName || template.template_name) === nextCampaign.officialTemplateName
    );
    setMessageBody(allowedTemplate?.bodyText || nextCampaign.template);
    setSendStatus({ type: "idle", message: "" });
    setIsReadyToConfirm(false);
    setValidationErrors([]);
    setRecipients([]);
    setExcelFileName("");
    setSendSummary(null);
  }

  async function handleExcelUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsedRecipients = await parseCampaignExcel(file, selectedCampaign);

      setRecipients(parsedRecipients);
      setExcelFileName(file.name);
      setIsReadyToConfirm(false);
      setSendSummary(null);
      setValidationErrors([]);
      setSendStatus({
        type: "success",
        message: `${parsedRecipients.length} contactos cargados desde Excel.`,
      });
    } catch (error) {
      setRecipients([]);
      setExcelFileName("");
      setSendStatus({
        type: "error",
        message: error.message || "No se pudo leer el Excel.",
      });
    }
  }

  function handleGeneralAttachmentUpload(event) {
    const file = event.target.files?.[0] || null;

    setGeneralAttachment(file);
    setIsReadyToConfirm(false);
    setSendSummary(null);
  }

  function handleCampaignSubmit(event) {
    event.preventDefault();

    const errors = validateCampaignBeforeConfirm({
      selectedCampaign,
      recipients,
      uploadedExcel: Boolean(recipients.length),
      personalizedAttachments,
    });

    if (!hasCampaignTemplateAccess) {
      errors.push("Tu usuario no tiene plantillas oficiales asignadas.");
    }

    setValidationErrors(errors);

    if (errors.length) {
      setIsReadyToConfirm(false);
      setSendStatus({
        type: "error",
        message: "Corrige los datos marcados antes de continuar.",
      });
      return;
    }

    setIsReadyToConfirm(true);
    setSendStatus({
      type: "success",
      message:
        "Validacion correcta. Revisa la confirmacion antes de enviar.",
    });
  }

  async function handleConfirmCampaign() {
    setIsSendingCampaign(true);
    setSendStatus({
      type: "loading",
      message: "Enviando campana por WhatsApp...",
    });

    try {
      const attachmentPayload = await readAttachmentFile(generalAttachment);
      const result = await sendBroadcastCampaign(session.sessionToken, {
        name: campaignName,
        type: selectedCampaign.id,
        connectionId: selectedConnectionId,
        messageTemplate: messageBody,
        templateName: selectedCampaign.officialTemplateName || null,
        languageCode: selectedCampaign.languageCode || null,
        variableMapping: selectedCampaign.variables || [],
        recipients,
        senderName,
        attachmentMode: attachmentPayload ? "general" : "none",
        generalAttachment: attachmentPayload,
      });

      setSendSummary(result);
      setIsReadyToConfirm(false);
      setSendStatus({
        type: result.failedCount ? "error" : "success",
        message: `Envio procesado: ${result.sentCount} enviados, ${result.failedCount} fallidos.`,
      });
    } catch (error) {
      setSendStatus({
        type: "error",
        message: error.message || "No se pudo enviar la campana.",
      });
    } finally {
      setIsSendingCampaign(false);
    }
  }

  const previewText = useMemo(
    () => {
      const previewValues = [
        previewRecipient.nombre,
        previewRecipient.diplomado,
        senderName,
        previewRecipient.fecha_inicio,
        previewRecipient.horario,
      ];

      return messageBody
        .replaceAll("{{1}}", previewValues[0] || "")
        .replaceAll("{{2}}", selectedCampaign.id === "solicitud_contacto" ? senderName : previewValues[1] || "")
        .replaceAll("{{3}}", previewValues[2] || "")
        .replaceAll("{{4}}", previewValues[3] || "")
        .replaceAll("{{5}}", previewValues[4] || "")
        .replaceAll("{{nombre_alumno}}", previewRecipient.nombre)
        .replaceAll("{{nombre}}", previewRecipient.nombre)
        .replaceAll("{{diplomado}}", previewRecipient.diplomado)
        .replaceAll("{{nombre_curso}}", previewRecipient.diplomado)
        .replaceAll("{{usuario}}", previewRecipient.usuario)
        .replaceAll("{{contrasena}}", previewRecipient.contrasena)
        .replaceAll("{{contrasena}}", previewRecipient.contrasena)
        .replaceAll("{{fecha_inicio}}", previewRecipient.fecha_inicio)
        .replaceAll("{{fecha}}", previewRecipient.fecha_inicio)
        .replaceAll("{{dia}}", previewRecipient.fecha_inicio)
        .replaceAll("{{horario}}", previewRecipient.horario)
        .replaceAll("{{hora}}", previewRecipient.horario)
        .replaceAll("{{hora_inicio}}", previewRecipient.horario)
        .replaceAll("{{grupo}}", previewRecipient.grupo)
        .replaceAll("{{nombre_tutora}}", senderName)
        .replaceAll("{{tutora}}", senderName)
        .replaceAll("{{docente}}", previewRecipient.observaciones || "")
        .replaceAll("{{observaciones}}", previewRecipient.observaciones || "");
    },
    [messageBody, previewRecipient, selectedCampaign.id, senderName]
  );

  return (
    <div className="broadcast-view">
      <PageHeading
        title="Nueva campaña"
        description="Formulario visual preparado para conectar carga de Excel, adjuntos y envio real en una segunda etapa."
      />

      <section className="broadcast-grid broadcast-grid--form">
        <form className="broadcast-form" onSubmit={handleCampaignSubmit}>
          <label>
            Nombre de campaña
            <input type="text" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} />
          </label>
          <label>
            Tipo de campaña
            <select
              value={selectedCampaignType}
              onChange={handleCampaignTypeChange}
            >
              {visibleCampaignTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            {!hasCampaignTemplateAccess ? (
              <span className="broadcast-field-hint">
                Tu usuario aun no tiene plantillas oficiales asignadas.
              </span>
            ) : null}
          </label>
          {canSelectLine ? (
            <label>
              Linea de envio
              <select
                value={selectedConnectionId}
                onChange={(event) => setSelectedConnectionId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecciona una linea conectada
                </option>
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.lineName ||
                      connection.displayPhoneNumber ||
                      connection.connectedPhone ||
                      connection.id}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="broadcast-form-note">
              Esta campaña se enviara desde la linea asignada a tu usuario.
            </div>
          )}
          <label className="broadcast-form__wide">
            Mensaje o plantilla
            <textarea
              rows="9"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
            />
          </label>
          <div className="broadcast-upload-row broadcast-form__wide">
            <input id="campaign-excel-input" type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} hidden />
            <input id="campaign-general-attachment-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleGeneralAttachmentUpload} hidden />
            <button
              type="button"
              className="broadcast-button broadcast-button--primary"
              onClick={() => document.getElementById("campaign-excel-input")?.click()}
            >
              Cargar Excel
            </button>
            <button
              type="button"
              className="broadcast-button"
              onClick={() => document.getElementById("campaign-general-attachment-input")?.click()}
            >
              Adjuntar PDF o imagen general
            </button>
            <button
              type="button"
              className="broadcast-button"
              onClick={() => {
                setPersonalizedAttachments((currentValue) => !currentValue);
                setIsReadyToConfirm(false);
              }}
            >
              Adjuntos personalizados
            </button>
          </div>
          <div className="broadcast-upload-status broadcast-form__wide">
            <span className={recipients.length ? "broadcast-upload-status__item--ready" : ""}>
              Excel: {recipients.length ? `${recipients.length} contactos cargados (${excelFileName})` : "pendiente"}
            </span>
            <span className={generalAttachment ? "broadcast-upload-status__item--ready" : ""}>
              Adjunto general: {generalAttachment ? generalAttachment.name : "sin archivo"}
            </span>
            <span className={personalizedAttachments ? "broadcast-upload-status__item--ready" : ""}>
              Adjuntos personalizados: {personalizedAttachments ? "cargados" : "sin archivos"}
            </span>
          </div>
          <div className="broadcast-form-note broadcast-form__wide">
            <strong>Columnas esperadas para {selectedCampaign.label}</strong>
            <span>
              Respeta este orden en el Excel para que el sistema lea cada columna correctamente.
            </span>
            <ol className="broadcast-column-guide">
              {selectedCampaign.columns.map((column) => (
                <li key={column}>{column}</li>
              ))}
            </ol>
          </div>
          <div className="broadcast-campaign-actions broadcast-form__wide">
            <button
              type="submit"
              className="broadcast-button broadcast-button--primary"
              disabled={!recipients.length || isSendingCampaign || !hasCampaignTemplateAccess}
            >
              Enviar campaña
            </button>
            <span>
              Se validara el Excel y despues podras confirmar el envio real por WhatsApp.
            </span>
          </div>
          {sendStatus.message ? (
            <p className={`broadcast-form-status broadcast-form-status--${sendStatus.type} broadcast-form__wide`}>
              {sendStatus.message}
            </p>
          ) : null}
          {validationErrors.length ? (
            <div className="broadcast-validation-list broadcast-form__wide">
              <strong>Errores por corregir</strong>
              <ul>
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {isReadyToConfirm ? (
            <div className="broadcast-confirm-panel broadcast-form__wide">
              <strong>Confirmar campaña</strong>
              <p>
                Usted esta por mandar {recipients.length} mensajes
                {generalAttachment || personalizedAttachments
                  ? " con datos adjuntos"
                  : " sin datos adjuntos"}
                . Campaña seleccionada: {selectedCampaign.label}.
              </p>
              <button
                type="button"
                className="broadcast-button broadcast-button--primary"
                onClick={handleConfirmCampaign}
                disabled={isSendingCampaign}
              >
                {isSendingCampaign ? "Enviando..." : "Confirmar envio"}
              </button>
            </div>
          ) : null}
          {sendSummary ? (
            <div className="broadcast-confirm-panel broadcast-form__wide">
              <strong>Resultado del envio</strong>
              <p>
                Total: {sendSummary.total}. Enviados: {sendSummary.sentCount}. Fallidos:{" "}
                {sendSummary.failedCount}.
              </p>
              {sendSummary.results?.slice(0, 5).map((result) => (
                <p key={`${result.phone}-${result.status}`}>
                  {result.phone}: {result.status}
                  {result.errorMessage ? ` - ${result.errorMessage}` : ""}
                </p>
              ))}
            </div>
          ) : null}
        </form>

        <aside className="broadcast-preview-panel">
          <h2>Vista previa</h2>
          <div className="broadcast-phone-preview">
            <div className="broadcast-phone-preview__top">
              <strong>CACP</strong>
              <span>WhatsApp</span>
            </div>
            <p>{previewText}</p>
            <span className="broadcast-phone-preview__time">10:42</span>
          </div>
        </aside>
      </section>

      <section className="broadcast-panel">
        <div className="broadcast-panel__header">
          <div>
            <h2>Previsualizacion de destinatarios</h2>
            <p>Contactos leidos desde el Excel cargado.</p>
          </div>
          <StatusPill>{recipients.length} contactos cargados</StatusPill>
        </div>
        <DataTable
          columns={[
            "Nombre",
            "Telefono",
            "Usuario",
            "Contrasena",
            "Diplomado",
            "Fecha inicio",
            "Horario",
            "Grupo",
            "Archivo",
          ]}
          rows={recipients.map((item) => [
            item.nombre,
            item.telefono,
            item.usuario,
            item.contrasena,
            item.diplomado,
            item.fecha_inicio,
            item.horario,
            item.grupo,
            item.archivo_personalizado,
          ])}
          emptyMessage="Carga un Excel para ver los destinatarios."
        />
      </section>
    </div>
  );
}

function validateCampaignBeforeConfirm({
  selectedCampaign,
  recipients,
  uploadedExcel,
  personalizedAttachments,
}) {
  const errors = [];

  if (!uploadedExcel) {
    errors.push("Carga el Excel antes de validar la campaña.");
    return errors;
  }

  if (!recipients.length) {
    errors.push("El Excel no tiene contactos cargados.");
    return errors;
  }

  selectedCampaign.columns.forEach((columnName) => {
    const fieldName = RECIPIENT_FIELD_MAP[columnName];

    if (!fieldName) {
      errors.push(`No existe una regla de lectura para la columna ${columnName}.`);
      return;
    }

    recipients.forEach((recipient, index) => {
      const value = recipient[fieldName];

      if (value === undefined || value === null || String(value).trim() === "") {
        errors.push(`Fila ${index + 1}: falta completar la columna ${columnName}.`);
      }
    });
  });

  recipients.forEach((recipient, index) => {
    const phone = String(recipient.telefono || "").trim();

    if (!/^\d{10}$/.test(phone)) {
      errors.push(`Fila ${index + 1}: el telefono debe tener exactamente 10 digitos.`);
    }
  });

  if (personalizedAttachments) {
    recipients.forEach((recipient, index) => {
      const fileName = String(recipient.archivo_personalizado || "").trim();

      if (!fileName) {
        errors.push(
          `Fila ${index + 1}: falta el nombre del archivo personalizado.`
        );
        return;
      }

      if (!/\.(pdf|jpg|jpeg|png)$/i.test(fileName)) {
        errors.push(
          `Fila ${index + 1}: el archivo personalizado debe ser PDF, JPG, JPEG o PNG.`
        );
      }
    });
  }

  return [...new Set(errors)];
}

function Usage({ client, lines, session }) {
  return (
    <div className="broadcast-view">
      <PageHeading
        title="Consumo mensual"
        description="Panel de capacidad comercial y operativa de CACP."
      />
      <section className="broadcast-panel broadcast-usage-panel">
        <div className="broadcast-usage-main">
          <span>Uso actual</span>
          <strong>
            {client.used} / {client.totalCapacity}
          </strong>
          <ProgressBar value={client.used} total={client.totalCapacity} />
        </div>
        <div className="broadcast-usage-rules">
          <p>Plan contratado: 1,000 envios</p>
          <p>Proteccion operativa: 300 envios</p>
          <p>Bloques adicionales: +50 envios por $75 MXN</p>
          <p>Los mensajes manuales enviados desde WhatsApp Business App no cuentan aqui.</p>
        </div>
      </section>
      <Lines lines={lines} session={session} />
    </div>
  );
}

function Admin() {
  return (
    <div className="broadcast-view">
      <PageHeading
        title="Administracion interna GCodemaker"
        description="Vista preparada para seguimiento multiempresa, integracion y estado comercial."
      />
      <DataTable
        columns={[
          "Cliente",
          "Plan",
          "Proteccion",
          "Capacidad",
          "Lineas",
          "Mensualidad",
          "Bloque adicional",
          "Integracion",
          "Alertas",
          "Bloques",
          "Ultima campaña",
          "Pago",
          "Cuenta",
        ]}
        rows={internalClients.map((client) => [
          client.client,
          client.plan,
          client.protection,
          client.capacity,
          client.lines,
          client.monthlyFee,
          client.extraBlock,
          client.integrationStatus,
          client.alerts,
          client.extraBlocks,
          client.lastCampaign,
          client.paymentDate,
          client.accountStatus,
        ])}
      />
      <section className="broadcast-panel broadcast-future-panel">
        <h2>Bandeja de respuestas</h2>
        <p>
          Modulo pendiente para una etapa posterior. Si la coexistencia con WhatsApp
          Business App es posible, las respuestas podran revisarse desde el celular.
          Si no, esta bandeja recibira respuestas dentro del panel.
        </p>
      </section>
    </div>
  );
}

function Settings({ client, users, onClientUpdated }) {
  const [planForm, setPlanForm] = useState({
    plan: String(client.plan),
    protection: String(client.protection),
    totalCapacity: String(client.totalCapacity),
    extraBlockSize: String(client.extraBlockSize),
    extraBlockPrice: String(client.extraBlockPrice).replace(/[^\d.]/g, ""),
    monthlyFee: String(client.monthlyFee).replace(/[^\d.]/g, ""),
  });
  const [settingsStatus, setSettingsStatus] = useState("");

  function updatePlanForm(event) {
    const { name, value } = event.target;

    setPlanForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handlePlanSave(event) {
    event.preventDefault();

    const nextClient = {
      ...client,
      plan: Number(planForm.plan),
      protection: Number(planForm.protection),
      totalCapacity: Number(planForm.totalCapacity),
      extraBlockSize: Number(planForm.extraBlockSize),
      extraBlockPrice: `$${Number(planForm.extraBlockPrice)} MXN`,
      monthlyFee: `$${Number(planForm.monthlyFee)} MXN`,
    };

    onClientUpdated(nextClient);
    setSettingsStatus("Cambios guardados localmente para esta cuenta.");
  }

  return (
    <div className="broadcast-view">
      <PageHeading
        title="Configuración"
        description="Ajustes generales del cliente, plan contratado y reglas operativas de GC Broadcast."
      />

      <section className="broadcast-grid broadcast-grid--two">
        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Datos del cliente</h2>
              <p>Información base para identificar la cuenta dentro de GC Broadcast.</p>
            </div>
          </div>
          <form className="broadcast-form broadcast-form--single">
            <label>
              Cliente
              <input type="text" value={client.name} readOnly />
            </label>
            <label>
              Alias interno
              <input type="text" value={client.alias} readOnly />
            </label>
            <label>
              Mensualidad
              <input type="text" value={client.monthlyFee} readOnly />
            </label>
          </form>
        </div>

        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Plan y capacidad</h2>
              <p>Reglas comerciales que controlan alertas y consumo mensual.</p>
            </div>
          </div>
          <form className="broadcast-form broadcast-form--single" onSubmit={handlePlanSave}>
            <label>
              Plan contratado
              <input
                type="number"
                min="0"
                step="50"
                name="plan"
                value={planForm.plan}
                onChange={updatePlanForm}
              />
            </label>
            <label>
              Protección operativa
              <input
                type="number"
                min="0"
                step="50"
                name="protection"
                value={planForm.protection}
                onChange={updatePlanForm}
              />
            </label>
            <label>
              Capacidad operativa
              <input
                type="number"
                min="0"
                step="50"
                name="totalCapacity"
                value={planForm.totalCapacity}
                onChange={updatePlanForm}
              />
            </label>
            <label>
              Tamaño de bloque adicional
              <input
                type="number"
                min="0"
                step="10"
                name="extraBlockSize"
                value={planForm.extraBlockSize}
                onChange={updatePlanForm}
              />
            </label>
            <label>
              Precio de bloque adicional
              <input
                type="number"
                min="0"
                step="1"
                name="extraBlockPrice"
                value={planForm.extraBlockPrice}
                onChange={updatePlanForm}
              />
            </label>
            <label>
              Mensualidad
              <input
                type="number"
                min="0"
                step="1"
                name="monthlyFee"
                value={planForm.monthlyFee}
                onChange={updatePlanForm}
              />
            </label>
            <button type="submit" className="broadcast-button broadcast-button--primary">
              Guardar cambios
            </button>
            {settingsStatus ? (
              <p className="broadcast-form-status broadcast-form-status--success">
                {settingsStatus}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <section className="broadcast-grid broadcast-grid--two">
        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Reglas de consumo</h2>
              <p>Estas reglas se aplicarán cuando el backend quede conectado.</p>
            </div>
          </div>
          <div className="broadcast-permission-list">
            <article>
              <strong>Solo cuentan envíos desde GC Broadcast</strong>
              <span>Los mensajes manuales enviados desde WhatsApp Business no se descuentan aquí.</span>
            </article>
            <article>
              <strong>Alertas automáticas</strong>
              <span>El sistema alertará al 80%, 95% y 100% de consumo.</span>
            </article>
            <article>
              <strong>Bloques adicionales</strong>
              <span>Al superar la capacidad operativa se registra un bloque adicional.</span>
            </article>
          </div>
        </div>

        <div className="broadcast-panel">
          <div className="broadcast-panel__header">
            <div>
              <h2>Accesos actuales</h2>
              <p>Resumen de usuarios creados localmente para esta cuenta.</p>
            </div>
          </div>
          <div className="broadcast-settings-list">
            <article>
              <span>Usuarios registrados</span>
              <strong>{users.length}</strong>
            </article>
            <article>
              <span>Administradores</span>
              <strong>{users.filter((user) => user.role === "Admin cliente").length}</strong>
            </article>
            <article>
              <span>Operadores</span>
              <strong>{users.filter((user) => user.role === "Operador cliente").length}</strong>
            </article>
            <article>
              <span>Solo lectura</span>
              <strong>{users.filter((user) => user.role === "Solo lectura").length}</strong>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

function PageHeading({ title, description, actionLabel, actionProps = {} }) {
  return (
    <div className="broadcast-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actionLabel ? (
        <button
          type={actionProps.type || "button"}
          form={actionProps.form}
          onClick={actionProps.onClick}
          className="broadcast-button broadcast-button--primary"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function DataTable({ columns, rows, emptyMessage = "Sin registros por mostrar." }) {
  return (
    <div className="broadcast-table-wrap">
      <table className="broadcast-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="broadcast-table__empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const logoSrc = `${import.meta.env.BASE_URL}logo-gcodemaker.png`;
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateCredentials(event) {
    const { name, value } = event.target;

    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    loginBroadcastUser(credentials)
      .then((session) => {
        window.localStorage.setItem(
          LOCAL_SESSION_KEY,
          JSON.stringify(normalizeSession(session))
        );
        onLogin();
      })
      .catch((error) => {
        if (
          ENABLE_LOCAL_LOGIN_FALLBACK &&
          credentials.username === LOCAL_ADMIN_CREDENTIALS.username &&
          credentials.password === LOCAL_ADMIN_CREDENTIALS.password
        ) {
          window.localStorage.setItem(
            LOCAL_SESSION_KEY,
            JSON.stringify({
              username: credentials.username,
              name: "Administrador CACP",
              role: "admin_cliente",
              menuAccess: tabs.map((tab) => tab.id),
              createdAt: new Date().toISOString(),
            })
          );
          onLogin();
          return;
        }

        setError(error.message || "Usuario o contrasena incorrectos.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <main className="broadcast-login">
      <section className="broadcast-login__panel">
        <div className="broadcast-login__brand">
          <img
            src={logoSrc}
            alt="Logo de GCodemaker"
            className="broadcast-login__logo"
          />
          <div>
            <strong>GC Broadcast</strong>
            <span>Acceso privado</span>
          </div>
        </div>

        <div className="broadcast-login__copy">
          <h1>Iniciar sesion</h1>
          <p>
            Accede al panel administrativo de CACP para probar usuarios, lineas,
            campañas y consumo local.
          </p>
        </div>

        <form className="broadcast-login__form" onSubmit={handleSubmit}>
          <label>
            Telefono
            <input
              type="text"
              name="username"
              value={credentials.username}
              autoComplete="username"
              placeholder="numero de telefono a 10 digitos"
              onChange={updateCredentials}
              required
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              name="password"
              value={credentials.password}
              autoComplete="current-password"
              placeholder="contrasena"
              onChange={updateCredentials}
              required
            />
          </label>

          {error ? <p className="broadcast-login__error">{error}</p> : null}

          <button
            type="submit"
            className="broadcast-button broadcast-button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validando..." : "Entrar al panel"}
          </button>
        </form>
      </section>
    </main>
  );
}

function GcBroadcastPage() {
  const logoSrc = `${import.meta.env.BASE_URL}logo-gcodemaker.png`;
  const session = getLocalSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(getLocalSession());
  });
  const [broadcastState, setBroadcastState] = useState({
    client: mockBroadcastClient,
    lines: mockBroadcastLines,
    users: mockBroadcastUsers,
    campaigns: mockCampaigns,
  });
  const [sourceStatus, setSourceStatus] = useState("Usando datos mock");

  useEffect(() => {
    let isMounted = true;

    async function loadBroadcastData() {
      try {
        const [overview, apiCampaigns] = await Promise.all([
          getBroadcastOverview(),
          getBroadcastCampaigns(),
        ]);

        if (!isMounted) return;

        setBroadcastState(buildBroadcastStateFromApi(overview, apiCampaigns));
        setSourceStatus("Conectado al backend local");
      } catch (error) {
        if (!isMounted) return;

        console.warn("GC Broadcast usando datos mock", error);
        setSourceStatus("Backend no disponible, usando datos mock");
      }
    }

    loadBroadcastData();

    return () => {
      isMounted = false;
    };
  }, []);

  const { client, lines, users, campaigns } = broadcastState;
  const sessionMenuAccess =
    session?.role === "admin_cliente"
      ? tabs.map((tab) => tab.id)
      : Array.from(new Set([...(session?.menuAccess || []), "delivery"]));
  const visibleTabs = tabs.filter((tab) => sessionMenuAccess.includes(tab.id));
  const canOpenSettings = session?.role === "admin_cliente";

  function handleUserCreated(user) {
    setBroadcastState((currentState) => ({
      ...currentState,
      users: [...currentState.users, user],
    }));
  }

  function handleUserUpdated(updatedUser) {
    setBroadcastState((currentState) => ({
      ...currentState,
      users: currentState.users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      ),
    }));
  }

  function handleClientUpdated(updatedClient) {
    setBroadcastState((currentState) => ({
      ...currentState,
      client: updatedClient,
    }));
  }

  function handleLogout() {
    window.localStorage.removeItem(LOCAL_SESSION_KEY);
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const safeActiveTab =
    activeTab === "settings" && canOpenSettings
      ? activeTab
      : visibleTabs.some((tab) => tab.id === activeTab)
        ? activeTab
        : visibleTabs[0]?.id || "dashboard";

  const content = {
    dashboard: (
      <Dashboard
        client={client}
        lines={lines}
        sourceStatus={sourceStatus}
        session={session}
      />
    ),
    users: (
      <Users
        users={users}
        session={session}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    ),
    lines: <Lines lines={lines} session={session} />,
    "web-chat": <WebChatPage session={session} />,
    campaigns: <Campaigns campaignsData={campaigns} />,
    new: <NewCampaign session={session} />,
    delivery: <DeliveryReports session={session} />,
    history: <Campaigns campaignsData={campaigns} history />,
    usage: <Usage client={client} lines={lines} session={session} />,
    admin: <Admin />,
    settings: (
      <Settings
        client={client}
        users={users}
        onClientUpdated={handleClientUpdated}
      />
    ),
  }[safeActiveTab];

  return (
    <main className="broadcast-app">
      <aside className="broadcast-sidebar">
        <div className="broadcast-brand">
          <span className="broadcast-brand__logo-wrap">
            <img
              src={logoSrc}
              alt="Logo de GCodemaker"
              className="broadcast-brand__logo-image"
            />
          </span>
          <div>
            <strong>GC Broadcast</strong>
            <span>{client.alias}</span>
          </div>
        </div>
        <nav className="broadcast-nav" aria-label="Navegacion GC Broadcast">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`broadcast-nav__item ${
                safeActiveTab === tab.id ? "broadcast-nav__item--active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="broadcast-shell">
        <header className="broadcast-topbar">
          <div>
            <span>Cliente</span>
            <strong>{client.name}</strong>
          </div>
          <div className="broadcast-topbar__actions">
            <StatusPill>
              Rol: {session?.role === "admin_cliente" ? "Admin cliente" : "Usuario"}
            </StatusPill>
            {canOpenSettings ? (
              <button
                type="button"
                className="broadcast-button"
                onClick={() => setActiveTab("settings")}
              >
                Configuracion
              </button>
            ) : null}
            <button type="button" className="broadcast-button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </header>
        {content}
      </section>
    </main>
  );
}

export default GcBroadcastPage;


