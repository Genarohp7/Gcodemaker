const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const permissionsService = require("./platform-permissions.service");

const COMPANY_ID = "cacp";
const MALU_TENANT_ID = "tenant-gcodemaker-malu";
const MALU_AGENT_ID = "agent-malu";
const MENU_ACCESS_OPTIONS = [
  "dashboard",
  "users",
  "lines",
  "campaigns",
  "new",
  "history",
  "usage",
  "admin",
];
const PRIMARY_WHATSAPP_PHONE_NUMBER_ID = "1330058020181653";
const PRIMARY_WHATSAPP_DISPLAY_PHONE = "15549110102";
const ROLE_OPTIONS = ["admin_cliente", "operador_cliente", "lectura_cliente"];
const STATUS_OPTIONS = ["active", "invitation_pending", "suspended"];
const CACP_SIGNATURE = {
  code: "cacp",
  name: "CACP",
  text: "⚫🟤 ¡CACP!\nCentro de Actualizacion y Capacitacion Profesional",
};
const CACP_TEMPLATE_NAMES = [
  "confirmacion_envio_info_acad_cacp",
  "bienvenida_curso_cacp",
  "calendario_clases_cacp",
  "verificacion_datos_egreso_cacp",
];

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function getConnectionTokenKey() {
  const secret = getSessionSecret();

  return crypto.createHash("sha256").update(`gc-broadcast-wa-token:${secret}`).digest();
}

function encryptAccessToken(accessToken) {
  if (!accessToken) {
    return null;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getConnectionTokenKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(accessToken), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "enc:v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

function decryptAccessToken(storedAccessToken) {
  if (!storedAccessToken) {
    return null;
  }

  if (!String(storedAccessToken).startsWith("enc:v1:")) {
    return storedAccessToken;
  }

  const [, , encodedIv, encodedTag, encodedValue] = String(storedAccessToken).split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getConnectionTokenKey(),
    Buffer.from(encodedIv, "base64url")
  );

  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encodedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function getTokenLast4(storedAccessToken) {
  const accessToken = decryptAccessToken(storedAccessToken);

  return accessToken ? accessToken.slice(-4) : null;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha512").toString("hex");
  return `pbkdf2$100000$${salt}$${hash}`;
}

function verifyPassword(password, storedPasswordHash) {
  if (!storedPasswordHash) {
    return false;
  }

  const [algorithm, iterations, salt, originalHash] = storedPasswordHash.split("$");

  if (algorithm !== "pbkdf2" || !iterations || !salt || !originalHash) {
    return false;
  }

  const hash = crypto
    .pbkdf2Sync(String(password), salt, Number(iterations), 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function getSessionSecret() {
  if (!env.gcBroadcastAdminKey) {
    throw new Error("Falta configurar GC_BROADCAST_ADMIN_KEY");
  }

  return env.gcBroadcastAdminKey;
}

function signSessionToken(user) {
  const platformRole = permissionsService.normalizePlatformRole(user.platform_role);
  const dashboardPermissions = Array.isArray(user.dashboard_permissions)
    ? user.dashboard_permissions
    : [];
  const effectivePermissions = permissionsService.getEffectivePermissions({
    platformRole,
    dashboardPermissions,
  });
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlEncode({
    sub: user.id,
    role: user.role,
    companyId: user.company_id,
    tenantId: user.tenant_id || MALU_TENANT_ID,
    tenantType: user.tenant_type || "NORMAL",
    agentId: user.agent_id || MALU_AGENT_ID,
    platformRole,
    permissions: effectivePermissions,
    whatsappConnectionId: user.whatsapp_connection_id || null,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  });
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token) {
    return null;
  }

  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return null;
  }

  const session = base64UrlDecode(payload);

  if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return session;
}

function isLastDayOfMonth(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
}

function validateAssignedMessages(assignedMessages) {
  const numericAssignedMessages = Number(assignedMessages);
  const allowedMessageOptions = Array.from({ length: 10 }, (_, index) => (index + 1) * 100);

  if (!allowedMessageOptions.includes(numericAssignedMessages) && numericAssignedMessages !== 1300) {
    throw new Error("La cantidad de mensajes asignados no es valida");
  }

  return numericAssignedMessages;
}

function validateMenuAccess(menuAccess) {
  if (!Array.isArray(menuAccess)) {
    return [];
  }

  return menuAccess.filter((menuId) => MENU_ACCESS_OPTIONS.includes(menuId));
}

function mapCompany(row) {
  return {
    id: row.id,
    name: row.name,
    alias: row.alias,
    planLimit: Number(row.plan_limit),
    operationalProtection: Number(row.operational_protection),
    operationalCapacity: Number(row.operational_capacity),
    monthlyFee: Number(row.monthly_fee),
    extraBlockSize: Number(row.extra_block_size),
    extraBlockPrice: Number(row.extra_block_price),
    usageResetAt: row.usage_reset_at ? row.usage_reset_at.toISOString() : null,
  };
}

function mapLine(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    ownerName: row.owner_name,
    phone: row.phone,
    phoneInternational: row.phone_international,
    monthlyLimit: Number(row.monthly_limit),
    used: Number(row.used),
    campaigns: Number(row.campaigns),
    status: row.status,
    lastSent: row.last_sent_at ? row.last_sent_at.toISOString() : "Sin envios",
  };
}

function mapUser(row) {
  const platformRole = permissionsService.normalizePlatformRole(row.platform_role);
  const dashboardPermissions = Array.isArray(row.dashboard_permissions)
    ? row.dashboard_permissions
    : [];
  const effectivePermissions = permissionsService.getEffectivePermissions({
    platformRole,
    dashboardPermissions,
  });

  return {
    id: row.id,
    companyId: row.company_id,
    tenantId: row.tenant_id || MALU_TENANT_ID,
    tenantName: row.tenant_name || "GCodemaker / Malu",
    tenantType: row.tenant_type || "NORMAL",
    agentId: row.agent_id || MALU_AGENT_ID,
    agentName: row.agent_name || "Malu",
    name: row.name,
    phone: row.phone,
    whatsappConnectionId: row.whatsapp_connection_id,
    whatsappLineName: row.whatsapp_line_name || null,
    whatsappDisplayPhoneNumber: row.whatsapp_display_phone_number || null,
    whatsappPhoneNumberId: row.whatsapp_phone_number_id || null,
    hasPassword: Boolean(row.password_hash),
    role: row.role,
    platformRole,
    dashboardPermissions,
    permissions: effectivePermissions,
    canManageUsers: row.tenant_type !== "DEMO" && effectivePermissions.includes("users.manage"),
    assignedMessages: Number(row.assigned_messages),
    menuAccess: Array.isArray(row.menu_access) ? row.menu_access : [],
    status: row.status,
    signatureCode: row.signature_code || null,
    signatureName: row.signature_name || null,
    signatureText: row.signature_text || null,
    deliveryResultsResetAt: row.delivery_results_reset_at
      ? row.delivery_results_reset_at.toISOString()
      : null,
    lastAccess: row.last_access_at ? row.last_access_at.toISOString() : "Sin acceso",
  };
}

function mapUserTemplateAssignment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    whatsappConnectionId: row.whatsapp_connection_id,
    templateName: row.template_name,
    templateLanguage: row.template_language,
    templateCategory: row.template_category,
    templateStatus: row.template_status,
    bodyText: row.body_text || null,
    header: row.header_json || null,
    footerText: row.footer_text || null,
    buttons: row.buttons_json || [],
    variableCount: Number(row.variable_count || 0),
    variableSchema: row.variable_schema || [],
    components: row.components || [],
    signatureCode: row.signature_code,
    signatureName: row.signature_name,
    signatureText: row.signature_text,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getTemplateComponents(template) {
  return Array.isArray(template?.components) ? template.components : [];
}

function getTemplateComponent(template, type) {
  return getTemplateComponents(template).find(
    (component) => String(component.type || "").toUpperCase() === type
  );
}

function extractTemplateBodyText(template) {
  return getTemplateComponent(template, "BODY")?.text || null;
}

function extractTemplateHeader(template) {
  return getTemplateComponent(template, "HEADER") || null;
}

function extractTemplateFooterText(template) {
  return getTemplateComponent(template, "FOOTER")?.text || null;
}

function extractTemplateButtons(template) {
  return getTemplateComponent(template, "BUTTONS")?.buttons || [];
}

function extractTemplateVariableSchema(template) {
  const bodyText = extractTemplateBodyText(template) || "";
  const matches = [...bodyText.matchAll(/\{\{\s*(\d+)\s*\}\}/g)];
  const indexes = Array.from(new Set(matches.map((match) => Number(match[1])))).sort(
    (a, b) => a - b
  );

  return indexes.map((index) => ({
    index,
    placeholder: `{{${index}}}`,
    component: "BODY",
    required: true,
  }));
}

function inferSignatureCode(templateName) {
  const match = String(templateName || "").match(/_([a-z0-9]+)$/i);

  return match ? match[1].toLowerCase() : null;
}

function mapCampaign(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    type: row.type,
    lineId: row.line_id,
    whatsappConnectionId: row.whatsapp_connection_id || null,
    messageTemplate: row.message_template,
    templateName: row.template_name || null,
    languageCode: row.language_code || null,
    variableMapping: row.variable_mapping || null,
    recipientCount: Number(row.recipient_count),
    attachments: row.attachment_mode,
    status: row.status,
    owner: row.responsible_name || "Pendiente",
    createdAt: row.created_at ? row.created_at.toISOString() : "Pendiente",
    sendAt: row.sent_at ? row.sent_at.toISOString() : "Pendiente",
  };
}

async function ensureSeedData() {
  await pool.query(
    `
      INSERT INTO gc_broadcast_companies (
        id,
        name,
        alias,
        plan_limit,
        operational_protection,
        operational_capacity,
        monthly_fee,
        extra_block_size,
        extra_block_price
      )
      VALUES ($1, $2, $3, 1000, 300, 1300, 4500, 50, 75)
      ON CONFLICT (id) DO NOTHING
    `,
    [COMPANY_ID, "Centro de Actualizacion y Capacitacion Profesional", "CACP"]
  );

  await pool.query(
    `
      INSERT INTO gc_broadcast_users (
        id,
        company_id,
        tenant_id,
        name,
        phone,
        password_hash,
        role,
        platform_role,
        dashboard_permissions,
        assigned_messages,
        menu_access,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADMIN', '[]'::jsonb, 1300, $8::jsonb, 'active')
      ON CONFLICT (id) DO NOTHING
    `,
    [
      "admin-cacp",
      COMPANY_ID,
      MALU_TENANT_ID,
      "Administrador CACP",
      "Pendiente",
      hashPassword("123456789"),
      "admin_cliente",
      JSON.stringify(MENU_ACCESS_OPTIONS),
    ]
  );
}

async function getCompany() {
  await ensureSeedData();

  const result = await pool.query("SELECT * FROM gc_broadcast_companies WHERE id = $1", [
    COMPANY_ID,
  ]);

  return mapCompany(result.rows[0]);
}

async function getOverview() {
  const company = await getCompany();
  const [lines, users, usageResult] = await Promise.all([
    getLines(),
    getUsers(),
    pool.query(
      `
        SELECT COUNT(*)::int AS used
        FROM gc_broadcast_campaign_recipients recipients
        INNER JOIN gc_broadcast_campaigns campaigns ON campaigns.id = recipients.campaign_id
        WHERE campaigns.company_id = $1
          AND recipients.status = 'sent'
          AND recipients.sent_at >= GREATEST(
            date_trunc('month', NOW()),
            COALESCE(
              (SELECT usage_reset_at FROM gc_broadcast_companies WHERE id = $1),
              date_trunc('month', NOW())
            )
          )
      `,
      [COMPANY_ID]
    ),
  ]);

  return {
    company,
    lines,
    users,
    usage: {
      period: "current_month",
      used: Number(usageResult.rows[0]?.used || 0),
      capacity: company.operationalCapacity,
      alerts: {
        warning: 80,
        critical: 95,
        exhausted: 100,
      },
    },
    backendStatus: "database_ready",
  };
}

async function getLines() {
  await ensureSeedData();

  const result = await pool.query(
    "SELECT * FROM gc_broadcast_lines WHERE company_id = $1 ORDER BY created_at ASC",
    [COMPANY_ID]
  );

  return result.rows.map(mapLine);
}

async function getUsers() {
  await ensureSeedData();

  const result = await pool.query(
    `
      SELECT
        users.*,
        tenants.name AS tenant_name,
        tenants.type AS tenant_type,
        agents.id AS agent_id,
        agents.name AS agent_name,
        connections.line_name AS whatsapp_line_name,
        connections.display_phone_number AS whatsapp_display_phone_number,
        connections.phone_number_id AS whatsapp_phone_number_id,
        signatures.signature_code,
        signatures.signature_name,
        signatures.signature_text
      FROM gc_broadcast_users users
      LEFT JOIN gc_platform_tenants tenants
        ON tenants.id = users.tenant_id
      LEFT JOIN gc_platform_agents agents
        ON agents.tenant_id = tenants.id
        AND agents.slug = 'malu'
      LEFT JOIN gc_broadcast_whatsapp_connections connections
        ON connections.id = users.whatsapp_connection_id
      LEFT JOIN (
        SELECT DISTINCT ON (user_id)
          user_id,
          signature_code,
          signature_name,
          signature_text
        FROM gc_broadcast_user_template_assignments
        WHERE is_active = true
        ORDER BY user_id, updated_at DESC
      ) signatures ON signatures.user_id = users.id
      WHERE users.company_id = $1
        AND users.tenant_id = $2
      ORDER BY users.created_at ASC
    `,
    [COMPANY_ID, MALU_TENANT_ID]
  );

  return result.rows.map(mapUser);
}

async function getUserById(userId) {
  const result = await pool.query(
    `
      SELECT
        users.*,
        tenants.name AS tenant_name,
        tenants.type AS tenant_type,
        agents.id AS agent_id,
        agents.name AS agent_name,
        connections.line_name AS whatsapp_line_name,
        connections.display_phone_number AS whatsapp_display_phone_number,
        connections.phone_number_id AS whatsapp_phone_number_id,
        signatures.signature_code,
        signatures.signature_name,
        signatures.signature_text
      FROM gc_broadcast_users users
      LEFT JOIN gc_platform_tenants tenants
        ON tenants.id = users.tenant_id
      LEFT JOIN gc_platform_agents agents
        ON agents.tenant_id = tenants.id
        AND agents.slug = 'malu'
      LEFT JOIN gc_broadcast_whatsapp_connections connections
        ON connections.id = users.whatsapp_connection_id
      LEFT JOIN (
        SELECT DISTINCT ON (user_id)
          user_id,
          signature_code,
          signature_name,
          signature_text
        FROM gc_broadcast_user_template_assignments
        WHERE is_active = true
        ORDER BY user_id, updated_at DESC
      ) signatures ON signatures.user_id = users.id
      WHERE users.id = $1
        AND users.company_id = $2
      LIMIT 1
    `,
    [userId, COMPANY_ID]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

async function validateUserWhatsAppConnection({ whatsappConnectionId, role }) {
  const normalizedConnectionId = String(whatsappConnectionId || "").trim();

  if (!normalizedConnectionId) {
    if (role === "admin_cliente") {
      return null;
    }

    throw new Error("Debes asignar una linea de WhatsApp al usuario");
  }

  const result = await pool.query(
    `
      SELECT id
      FROM gc_broadcast_whatsapp_connections
      WHERE id = $1
        AND (company_id = $2 OR company_id IS NULL)
        AND connection_status = 'connected'
      LIMIT 1
    `,
    [normalizedConnectionId, COMPANY_ID]
  );

  if (!result.rows[0]) {
    throw new Error("La linea de WhatsApp asignada no existe o no esta conectada");
  }

  return normalizedConnectionId;
}

async function getPrimaryWhatsAppConnectionId() {
  const result = await pool.query(
    `
      SELECT id
      FROM gc_broadcast_whatsapp_connections
      WHERE (company_id = $1 OR company_id IS NULL)
        AND connection_status = 'connected'
        AND (
          phone_number_id = $2
          OR display_phone_number LIKE $3
          OR connected_phone LIKE $3
        )
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [COMPANY_ID, PRIMARY_WHATSAPP_PHONE_NUMBER_ID, `%${PRIMARY_WHATSAPP_DISPLAY_PHONE}%`]
  );

  if (!result.rows[0]) {
    throw new Error("No se encontro la linea principal de WhatsApp conectada");
  }

  return result.rows[0].id;
}

async function createUser({
  name,
  phone,
  password,
  role,
  tenantId = MALU_TENANT_ID,
  platformRole = "VIEWER",
  dashboardPermissions = [],
  assignedMessages,
  menuAccess = [],
  whatsappConnectionId = null,
}) {
  await ensureSeedData();

  const normalizedPhone = String(phone).trim();

  if (!ROLE_OPTIONS.includes(role)) {
    throw new Error("Rol no valido para GC Broadcast");
  }

  const normalizedPlatformRole = permissionsService.normalizePlatformRole(platformRole);
  const normalizedDashboardPermissions =
    permissionsService.normalizePermissionList(dashboardPermissions);

  const normalizedWhatsAppConnectionId = await getPrimaryWhatsAppConnectionId();

  try {
    const result = await pool.query(
      `
        INSERT INTO gc_broadcast_users (
          id,
          company_id,
          tenant_id,
          name,
          phone,
          password_hash,
          role,
          platform_role,
          dashboard_permissions,
          whatsapp_connection_id,
          assigned_messages,
          menu_access,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12::jsonb, 'invitation_pending')
        RETURNING *
      `,
      [
        createId("user"),
        COMPANY_ID,
        tenantId,
        String(name).trim(),
        normalizedPhone,
        hashPassword(password),
        role,
        normalizedPlatformRole,
        JSON.stringify(normalizedDashboardPermissions),
        normalizedWhatsAppConnectionId,
        validateAssignedMessages(assignedMessages),
        JSON.stringify(validateMenuAccess(menuAccess)),
      ]
    );

    return getUserById(result.rows[0].id);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese telefono");
    }

    throw error;
  }
}

async function login({ username, password }) {
  await ensureSeedData();

  const normalizedUsername = String(username).trim();
  const lookupValue =
    normalizedUsername.toLowerCase() === "pruebaadmin" ? "admin-cacp" : normalizedUsername;

  const result = await pool.query(
    `
      SELECT
        users.*,
        tenants.name AS tenant_name,
        tenants.type AS tenant_type,
        agents.id AS agent_id,
        agents.name AS agent_name,
        connections.line_name AS whatsapp_line_name,
        connections.display_phone_number AS whatsapp_display_phone_number,
        connections.phone_number_id AS whatsapp_phone_number_id,
        signatures.signature_code,
        signatures.signature_name,
        signatures.signature_text
      FROM gc_broadcast_users users
      LEFT JOIN gc_platform_tenants tenants
        ON tenants.id = users.tenant_id
      LEFT JOIN gc_platform_agents agents
        ON agents.tenant_id = tenants.id
        AND agents.slug = 'malu'
      LEFT JOIN gc_broadcast_whatsapp_connections connections
        ON connections.id = users.whatsapp_connection_id
      LEFT JOIN (
        SELECT DISTINCT ON (user_id)
          user_id,
          signature_code,
          signature_name,
          signature_text
        FROM gc_broadcast_user_template_assignments
        WHERE is_active = true
        ORDER BY user_id, updated_at DESC
      ) signatures ON signatures.user_id = users.id
      WHERE users.company_id = $1
        AND (
          users.id = $2
          OR lower(users.name) = lower($2)
          OR users.phone = $2
        )
      LIMIT 1
    `,
    [COMPANY_ID, lookupValue]
  );

  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error("Usuario o contrasena incorrectos");
  }

  if (user.status === "suspended") {
    throw new Error("Este usuario esta suspendido");
  }

  if (user.status !== "active" && user.status !== "invitation_pending") {
    throw new Error("Este usuario no esta activo");
  }

  await pool.query(
    `
      UPDATE gc_broadcast_users
      SET last_access_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [user.id]
  );

  return {
    ...mapUser({
      ...user,
      last_access_at: new Date(),
    }),
    username: normalizedUsername,
    sessionToken: signSessionToken(user),
  };
}

async function updateUserStatus({ userId, status }) {
  if (!STATUS_OPTIONS.includes(status)) {
    throw new Error("Estado no valido para el usuario");
  }

  const result = await pool.query(
    `
      UPDATE gc_broadcast_users
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND company_id = $3
      RETURNING *
    `,
    [status, userId, COMPANY_ID]
  );

  if (!result.rows[0]) {
    throw new Error("Usuario no encontrado");
  }

  return mapUser(result.rows[0]);
}

async function updateUserMessages({ userId, assignedMessages }) {
  if (!isLastDayOfMonth()) {
    throw new Error("Los mensajes asignados solo pueden cambiarse el ultimo dia del mes");
  }

  const result = await pool.query(
    `
      UPDATE gc_broadcast_users
      SET assigned_messages = $1, updated_at = NOW()
      WHERE id = $2 AND company_id = $3
      RETURNING *
    `,
    [validateAssignedMessages(assignedMessages), userId, COMPANY_ID]
  );

  if (!result.rows[0]) {
    throw new Error("Usuario no encontrado");
  }

  return mapUser(result.rows[0]);
}

async function updateUserAccess({ userId, menuAccess }) {
  const result = await pool.query(
    `
      UPDATE gc_broadcast_users
      SET menu_access = $1::jsonb, updated_at = NOW()
      WHERE id = $2 AND company_id = $3
      RETURNING *
    `,
    [JSON.stringify(validateMenuAccess(menuAccess)), userId, COMPANY_ID]
  );

  if (!result.rows[0]) {
    throw new Error("Usuario no encontrado");
  }

  return mapUser(result.rows[0]);
}

async function updateCompanyPlan({
  planLimit,
  operationalProtection,
  operationalCapacity,
  monthlyFee,
  extraBlockSize,
  extraBlockPrice,
}) {
  const numericValues = [
    Number(planLimit),
    Number(operationalProtection),
    Number(operationalCapacity),
    Number(monthlyFee),
    Number(extraBlockSize),
    Number(extraBlockPrice),
  ];

  if (numericValues.some((value) => Number.isNaN(value) || value < 0)) {
    throw new Error("Los valores del plan deben ser numeros validos");
  }

  const result = await pool.query(
    `
      UPDATE gc_broadcast_companies
      SET
        plan_limit = $1,
        operational_protection = $2,
        operational_capacity = $3,
        monthly_fee = $4,
        extra_block_size = $5,
        extra_block_price = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `,
    [...numericValues, COMPANY_ID]
  );

  if (!result.rows[0]) {
    throw new Error("Cliente no encontrado");
  }

  return mapCompany(result.rows[0]);
}

async function getCampaigns() {
  await ensureSeedData();

  const result = await pool.query(
    `
      SELECT campaigns.*, users.name AS responsible_name
      FROM gc_broadcast_campaigns campaigns
      LEFT JOIN gc_broadcast_users users ON users.id = campaigns.responsible_user_id
      WHERE campaigns.company_id = $1
      ORDER BY campaigns.created_at DESC
    `,
    [COMPANY_ID]
  );

  return result.rows.map(mapCampaign);
}

function resolveDeliveryStatus({ recipientStatus, logStatus, statusEvents }) {
  const events = Array.isArray(statusEvents) ? statusEvents : [];
  const eventStatuses = events.map((event) => event.status);

  if (eventStatuses.includes("read")) return "read";
  if (eventStatuses.includes("delivered")) return "delivered";

  const latestEvent = events[events.length - 1];

  if (latestEvent?.status) return latestEvent.status;
  if (logStatus === "failed" || recipientStatus === "failed") return "failed";
  if (logStatus === "submitted") return "submitted";
  if (recipientStatus === "sent") return "sent";

  return "pending";
}

function createDeliverySummary(items) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      summary[item.deliveryStatus] = (summary[item.deliveryStatus] || 0) + 1;
      if (["sent", "delivered", "read"].includes(item.deliveryStatus)) {
        summary.accepted += 1;
      }
      return summary;
    },
    {
      total: 0,
      accepted: 0,
      pending: 0,
      submitted: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    }
  );
}

async function getCampaignDeliveryReports({
  companyId = COMPANY_ID,
  responsibleUserId = null,
  createdAfter = null,
  limit = 30,
} = {}) {
  await ensureSeedData();

  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const filters = ["campaigns.company_id = $1"];
  const values = [companyId];

  if (responsibleUserId) {
    values.push(responsibleUserId);
    filters.push(`campaigns.responsible_user_id = $${values.length}`);
  }

  if (createdAfter) {
    values.push(createdAfter);
    filters.push(`campaigns.created_at >= $${values.length}::timestamptz`);
  }

  values.push(safeLimit);

  const campaignsResult = await pool.query(
    `
      SELECT
        campaigns.*,
        users.name AS responsible_name,
        connections.line_name AS whatsapp_line_name,
        connections.display_phone_number AS whatsapp_display_phone_number
      FROM gc_broadcast_campaigns campaigns
      LEFT JOIN gc_broadcast_users users ON users.id = campaigns.responsible_user_id
      LEFT JOIN gc_broadcast_whatsapp_connections connections
        ON connections.id = campaigns.whatsapp_connection_id
      WHERE ${filters.join(" AND ")}
      ORDER BY campaigns.created_at DESC
      LIMIT $${values.length}
    `,
    values
  );

  const reports = [];

  for (const campaign of campaignsResult.rows) {
    const recipientsResult = await pool.query(
      `
        SELECT
          recipients.id,
          recipients.phone,
          recipients.payload,
          recipients.status AS recipient_status,
          recipients.error_message AS recipient_error,
          recipients.sent_at AS recipient_sent_at,
          logs.id AS log_id,
          logs.template_name,
          logs.whatsapp_message_id,
          logs.status AS log_status,
          logs.error_message AS log_error,
          logs.created_at AS log_created_at
        FROM gc_broadcast_campaign_recipients recipients
        LEFT JOIN LATERAL (
          SELECT *
          FROM gc_broadcast_whatsapp_template_logs logs
          WHERE (
            logs.campaign_id = $1
            OR (
              logs.campaign_id IS NULL
              AND logs.recipient_phone = recipients.phone
              AND logs.created_at >= $2::timestamptz - INTERVAL '1 minute'
              AND logs.created_at <= COALESCE($3::timestamptz, $4::timestamptz, NOW()) + INTERVAL '10 minutes'
            )
          )
          ORDER BY logs.created_at DESC
          LIMIT 1
        ) logs ON true
        WHERE recipients.campaign_id = $1
        ORDER BY recipients.created_at ASC
      `,
      [campaign.id, campaign.created_at, campaign.sent_at, campaign.updated_at]
    );

    const messageIds = recipientsResult.rows
      .map((recipient) => recipient.whatsapp_message_id)
      .filter(Boolean);
    const statusesResult = messageIds.length
      ? await pool.query(
          `
            SELECT
              whatsapp_message_id,
              status,
              recipient_id,
              error_code,
              error_title,
              error_message,
              created_at
            FROM gc_broadcast_whatsapp_message_statuses
            WHERE whatsapp_message_id = ANY($1::text[])
            ORDER BY created_at ASC
          `,
          [messageIds]
        )
      : { rows: [] };

    const statusesByMessage = statusesResult.rows.reduce((acc, status) => {
      if (!acc[status.whatsapp_message_id]) {
        acc[status.whatsapp_message_id] = [];
      }
      acc[status.whatsapp_message_id].push(status);
      return acc;
    }, {});

    const recipients = recipientsResult.rows.map((recipient) => {
      const events = statusesByMessage[recipient.whatsapp_message_id] || [];
      const deliveryStatus = resolveDeliveryStatus({
        recipientStatus: recipient.recipient_status,
        logStatus: recipient.log_status,
        statusEvents: events,
      });
      const latestEvent = events[events.length - 1] || null;

      return {
        id: recipient.id,
        phone: recipient.phone,
        name:
          recipient.payload?.nombre_alumno ||
          recipient.payload?.nombre ||
          recipient.payload?.usuario ||
          "Sin nombre",
        templateName: recipient.template_name || campaign.template_name || null,
        whatsappMessageId: recipient.whatsapp_message_id || null,
        deliveryStatus,
        statusTimeline: events.map((event) => ({
          status: event.status,
          createdAt: event.created_at ? event.created_at.toISOString() : null,
          errorCode: event.error_code || null,
          errorTitle: event.error_title || null,
          errorMessage: event.error_message || null,
        })),
        errorMessage:
          recipient.recipient_error ||
          recipient.log_error ||
          latestEvent?.error_message ||
          latestEvent?.error_title ||
          null,
        sentAt: recipient.recipient_sent_at
          ? recipient.recipient_sent_at.toISOString()
          : recipient.log_created_at
          ? recipient.log_created_at.toISOString()
          : null,
      };
    });

    reports.push({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      templateName: campaign.template_name,
      languageCode: campaign.language_code,
      lineName: campaign.whatsapp_line_name || "Linea principal",
      linePhone: campaign.whatsapp_display_phone_number || null,
      responsible: campaign.responsible_name || "Pendiente",
      attachmentMode: campaign.attachment_mode,
      status: campaign.status,
      recipientCount: Number(campaign.recipient_count),
      createdAt: campaign.created_at ? campaign.created_at.toISOString() : null,
      sentAt: campaign.sent_at ? campaign.sent_at.toISOString() : null,
      summary: createDeliverySummary(recipients),
      recipients,
    });
  }

  return reports;
}

async function createCampaign({
  name,
  type,
  lineId,
  whatsappConnectionId,
  messageTemplate,
  templateName = null,
  languageCode = null,
  variableMapping = null,
  recipients,
  attachmentMode = "none",
  responsibleUserId = null,
}) {
  await ensureSeedData();

  const campaignId = createId("campaign");
  const safeRecipients = Array.isArray(recipients) ? recipients : [];

  await pool.query("BEGIN");

  try {
    const campaignResult = await pool.query(
      `
        INSERT INTO gc_broadcast_campaigns (
          id,
          company_id,
          name,
          type,
          line_id,
          whatsapp_connection_id,
          message_template,
          template_name,
          language_code,
          variable_mapping,
          recipient_count,
          attachment_mode,
          responsible_user_id,
          status
        )
        VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), $7, NULLIF($8, ''), NULLIF($9, ''), $10::jsonb, $11, $12, $13, 'draft')
        RETURNING *
      `,
      [
        campaignId,
        COMPANY_ID,
        String(name).trim(),
        type,
        lineId || null,
        whatsappConnectionId || null,
        messageTemplate,
        templateName || null,
        languageCode || null,
        JSON.stringify(variableMapping || {}),
        safeRecipients.length,
        attachmentMode,
        responsibleUserId,
      ]
    );

    for (const recipient of safeRecipients) {
      await pool.query(
        `
          INSERT INTO gc_broadcast_campaign_recipients (
            id,
            campaign_id,
            phone,
            payload,
            attachment_name
          )
          VALUES ($1, $2, $3, $4::jsonb, $5)
        `,
        [
          createId("recipient"),
          campaignId,
          String(recipient.phone || recipient.telefono || "").trim(),
          JSON.stringify(recipient),
          recipient.attachmentName || recipient.archivo_personalizado || null,
        ]
      );
    }

    await pool.query("COMMIT");

    return mapCampaign(campaignResult.rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function updateCampaignRecipientResult({
  campaignId,
  phone,
  status,
  errorMessage = null,
}) {
  await pool.query(
    `
      UPDATE gc_broadcast_campaign_recipients
      SET
        status = $1,
        error_message = $2,
        sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END
      WHERE campaign_id = $3
        AND phone = $4
    `,
    [status, errorMessage, campaignId, phone]
  );
}

async function updateCampaignSendStatus({ campaignId, status }) {
  await pool.query(
    `
      UPDATE gc_broadcast_campaigns
      SET
        status = $1,
        sent_at = CASE WHEN $1 IN ('sent', 'partial') THEN NOW() ELSE sent_at END,
        updated_at = NOW()
      WHERE id = $2
    `,
    [status, campaignId]
  );
}

function verifyWebhookToken({ mode, token }) {
  return mode === "subscribe" && token && token === env.whatsappVerifyToken;
}

function getWebhookChanges(payload) {
  return (payload?.entry || []).flatMap((entry) => entry.changes || []);
}

async function storeWebhookStatuses(payload) {
  const changes = getWebhookChanges(payload);
  const statuses = changes.flatMap((change) => change.value?.statuses || []);

  for (const statusEvent of statuses) {
    const error = statusEvent.errors?.[0] || {};
    const normalizedStatus = error.code ? "failed" : statusEvent.status;

    await pool.query(
      `
        INSERT INTO gc_broadcast_whatsapp_message_statuses (
          id,
          whatsapp_message_id,
          status,
          recipient_id,
          conversation_id,
          pricing,
          error_code,
          error_title,
          error_message,
          raw_status
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb)
      `,
      [
        createId("wa-status"),
        statusEvent.id,
        normalizedStatus,
        statusEvent.recipient_id || null,
        statusEvent.conversation?.id || null,
        JSON.stringify(statusEvent.pricing || {}),
        error.code ? String(error.code) : null,
        error.title || null,
        error.message || error.error_data?.details || null,
        JSON.stringify(statusEvent),
      ]
    );

    await pool.query(
      `
        UPDATE gc_broadcast_whatsapp_test_messages
        SET status = $1
        WHERE whatsapp_message_id = $2
      `,
      [normalizedStatus, statusEvent.id]
    );
  }

  return statuses.length;
}

async function storeInboundMessages(payload) {
  const changes = getWebhookChanges(payload);
  const inboundMessages = changes.flatMap((change) => {
    const phoneNumberId = change.value?.metadata?.phone_number_id || null;

    return (change.value?.messages || []).map((message) => ({
      phoneNumberId,
      message,
    }));
  });

  for (const { phoneNumberId, message } of inboundMessages) {
    await pool.query(
      `
        INSERT INTO gc_broadcast_whatsapp_inbound_messages (
          id,
          whatsapp_message_id,
          from_phone,
          phone_number_id,
          message_type,
          text_body,
          raw_message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        createId("wa-inbound"),
        message.id,
        message.from,
        phoneNumberId,
        message.type || "unknown",
        message.text?.body || null,
        JSON.stringify(message),
      ]
    );

    const conversation = await getOrCreateWebChatConversation({
      phoneNumber: message.from,
      phoneNumberId,
      contactName: message.profile?.name || null,
    });

    await createWebChatMessage({
      conversationId: conversation.id,
      direction: "incoming",
      type: message.type || "unknown",
      content:
        message.text?.body ||
        message.image?.caption ||
        message.document?.caption ||
        null,
      attachmentName: message.document?.filename || message.image?.id || message.audio?.id || null,
      attachmentMimeType:
        message.document?.mime_type ||
        message.image?.mime_type ||
        message.audio?.mime_type ||
        null,
      status: "received",
      externalMessageId: message.id,
      rawPayload: {
        phoneNumberId,
        message,
      },
    });
  }

  return inboundMessages.length;
}

async function storeWebhookEvent(payload) {
  const result = await pool.query(
    `
      INSERT INTO gc_broadcast_webhook_events (id, provider, payload)
      VALUES ($1, 'whatsapp', $2::jsonb)
      RETURNING id, created_at
    `,
    [createId("webhook"), JSON.stringify(payload || {})]
  );
  const statusesProcessed = await storeWebhookStatuses(payload);
  const inboundMessagesProcessed = await storeInboundMessages(payload);

  return {
    stored: true,
    id: result.rows[0].id,
    createdAt: result.rows[0].created_at,
    statusesProcessed,
    inboundMessagesProcessed,
  };
}

function mapWhatsAppConnection(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    companyId: row.company_id,
    lineId: row.line_id,
    lineName: row.line_name,
    businessId: row.business_id,
    wabaId: row.waba_id,
    phoneNumberId: row.phone_number_id,
    displayPhoneNumber: row.display_phone_number,
    connectedPhone: row.connected_phone,
    provider: row.provider,
    accessTokenLast4: row.access_token_last4 || getTokenLast4(row.access_token),
    tokenExpiration: row.token_expiration,
    connectionStatus: row.connection_status,
    lastSyncedAt: row.last_synced_at,
    lineConfig: row.line_config || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWhatsAppInboundMessage(row) {
  return {
    id: row.id,
    whatsappMessageId: row.whatsapp_message_id,
    fromPhone: row.from_phone,
    phoneNumberId: row.phone_number_id,
    messageType: row.message_type,
    textBody: row.text_body,
    createdAt: row.created_at,
  };
}

function mapWebChatConversation(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    phoneNumber: row.phone_number,
    phoneNumberId: row.phone_number_id,
    contactName: row.contact_name,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: Number(row.unread_count || 0),
    lastReadAt: row.last_read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWebChatMessage(row) {
  const rawPayload = row.raw_payload || {};
  const rawMessage = rawPayload.message || {};
  const media =
    rawMessage.image ||
    rawMessage.document ||
    rawMessage.audio ||
    rawMessage.video ||
    null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    type: row.type,
    content: row.content,
    attachmentName: row.attachment_name,
    attachmentMimeType: row.attachment_mime_type,
    attachmentSize: media?.file_size || null,
    mediaId: media?.id || null,
    hasMedia: Boolean(media?.id),
    status: row.status,
    externalMessageId: row.external_message_id,
    createdAt: row.created_at,
  };
}

async function getOrCreateWebChatConversation({
  companyId = COMPANY_ID,
  phoneNumber,
  phoneNumberId = null,
  contactName = null,
}) {
  const normalizedPhone = String(phoneNumber || "").replace(/\D/g, "");
  const normalizedPhoneNumberId = phoneNumberId ? String(phoneNumberId).trim() : null;

  if (!normalizedPhone) {
    throw new Error("Telefono de conversacion invalido");
  }

  const existing = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_web_chat_conversations
      WHERE company_id = $1
        AND phone_number = $2
      LIMIT 1
    `,
    [companyId, normalizedPhone]
  );

  if (existing.rows[0]) {
    const result = await pool.query(
      `
        UPDATE gc_broadcast_web_chat_conversations
        SET
          contact_name = COALESCE($2, contact_name),
          phone_number_id = COALESCE($3, phone_number_id),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [existing.rows[0].id, contactName, normalizedPhoneNumberId]
    );

    return mapWebChatConversation(result.rows[0]);
  }

  const result = await pool.query(
    `
      INSERT INTO gc_broadcast_web_chat_conversations (
        id,
        company_id,
        phone_number,
        phone_number_id,
        contact_name
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      createId("webchat-conv"),
      companyId,
      normalizedPhone,
      normalizedPhoneNumberId,
      contactName,
    ]
  );

  return mapWebChatConversation(result.rows[0]);
}

async function createWebChatMessage({
  conversationId,
  direction,
  type = "text",
  content = null,
  attachmentName = null,
  attachmentMimeType = null,
  status = "received",
  externalMessageId = null,
  rawPayload = {},
}) {
  if (externalMessageId) {
    const existing = await pool.query(
      `
        SELECT *
        FROM gc_broadcast_web_chat_messages
        WHERE external_message_id = $1
        LIMIT 1
      `,
      [externalMessageId]
    );

    if (existing.rows[0]) {
      return mapWebChatMessage(existing.rows[0]);
    }
  }

  const result = await pool.query(
    `
      INSERT INTO gc_broadcast_web_chat_messages (
        id,
        conversation_id,
        direction,
        type,
        content,
        attachment_name,
        attachment_mime_type,
        status,
        external_message_id,
        raw_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      RETURNING *
    `,
    [
      createId("webchat-msg"),
      conversationId,
      direction,
      type,
      content,
      attachmentName,
      attachmentMimeType,
      status,
      externalMessageId,
      JSON.stringify(rawPayload || {}),
    ]
  );

  const preview =
    content ||
    (attachmentName ? `Adjunto: ${attachmentName}` : type === "text" ? "" : `Mensaje ${type}`);

  await pool.query(
    `
      UPDATE gc_broadcast_web_chat_conversations
      SET
        last_message = $1,
        last_message_at = $2,
        unread_count = CASE
          WHEN $3 = 'incoming' THEN unread_count + 1
          ELSE unread_count
        END,
        updated_at = NOW()
      WHERE id = $4
    `,
    [preview, result.rows[0].created_at, direction, conversationId]
  );

  return mapWebChatMessage(result.rows[0]);
}

async function getWebChatConversations(companyId = COMPANY_ID, phoneNumberId = null) {
  const params = [companyId];
  const lineFilter = phoneNumberId ? "AND phone_number_id = $2" : "";

  if (phoneNumberId) {
    params.push(phoneNumberId);
  }

  const result = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_web_chat_conversations
      WHERE company_id = $1
        ${lineFilter}
      ORDER BY COALESCE(last_message_at, updated_at, created_at) DESC
    `,
    params
  );

  return result.rows.map(mapWebChatConversation);
}

async function getWebChatConversationMessages({
  conversationId,
  companyId = COMPANY_ID,
  phoneNumberId = null,
}) {
  const params = [conversationId, companyId];
  const lineFilter = phoneNumberId ? "AND phone_number_id = $3" : "";

  if (phoneNumberId) {
    params.push(phoneNumberId);
  }

  const conversation = await pool.query(
    `
      SELECT id
      FROM gc_broadcast_web_chat_conversations
      WHERE id = $1 AND company_id = $2
        ${lineFilter}
      LIMIT 1
    `,
    params
  );

  if (!conversation.rows[0]) {
    throw new Error("Conversacion no encontrada");
  }

  const result = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_web_chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `,
    [conversationId]
  );

  return result.rows.map(mapWebChatMessage);
}

async function getWebChatMessageForMedia({ messageId, companyId = COMPANY_ID }) {
  const result = await pool.query(
    `
      SELECT
        messages.*,
        conversations.company_id
      FROM gc_broadcast_web_chat_messages messages
      INNER JOIN gc_broadcast_web_chat_conversations conversations
        ON conversations.id = messages.conversation_id
      WHERE messages.id = $1
        AND conversations.company_id = $2
      LIMIT 1
    `,
    [messageId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("Mensaje no encontrado");
  }

  return result.rows[0];
}

async function markWebChatConversationAsRead({ conversationId, companyId = COMPANY_ID }) {
  const result = await pool.query(
    `
      UPDATE gc_broadcast_web_chat_conversations
      SET unread_count = 0, last_read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `,
    [conversationId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("Conversacion no encontrada");
  }

  return mapWebChatConversation(result.rows[0]);
}

async function createWhatsAppConnection({
  companyId = COMPANY_ID,
  lineId = null,
  lineName = null,
  businessId = null,
  wabaId = null,
  phoneNumberId = null,
  displayPhoneNumber = null,
  connectedPhone = null,
  accessToken = null,
  tokenExpiration = null,
  connectionStatus = "pending_assets",
  provider = "meta_embedded_signup",
  rawResponse = {},
  lineConfig = {},
}) {
  const result = await pool.query(
    `
      INSERT INTO gc_broadcast_whatsapp_connections (
        id,
        company_id,
        line_id,
        line_name,
        business_id,
        waba_id,
        phone_number_id,
        display_phone_number,
        connected_phone,
        access_token,
        token_expiration,
        connection_status,
        provider,
        raw_response,
        line_config
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb)
      RETURNING *
    `,
    [
      createId("wa-connection"),
      companyId,
      lineId,
      lineName,
      businessId,
      wabaId,
      phoneNumberId,
      displayPhoneNumber,
      connectedPhone,
      encryptAccessToken(accessToken),
      tokenExpiration,
      connectionStatus,
      provider,
      JSON.stringify(rawResponse || {}),
      JSON.stringify(lineConfig || {}),
    ]
  );

  return mapWhatsAppConnection(result.rows[0]);
}

async function getWhatsAppConnections(companyId = COMPANY_ID) {
  const result = await pool.query(
    `
      SELECT
        id,
        company_id,
        line_id,
        line_name,
        business_id,
        waba_id,
        phone_number_id,
        display_phone_number,
        connected_phone,
        provider,
        access_token,
        token_expiration,
        connection_status,
        last_synced_at,
        line_config,
        created_at,
        updated_at
      FROM gc_broadcast_whatsapp_connections
      WHERE (company_id = $1 OR company_id IS NULL)
        AND connection_status = 'connected'
      ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows.map(mapWhatsAppConnection);
}

async function getWhatsAppInboundMessages({ companyId = COMPANY_ID, limit = 30 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const result = await pool.query(
    `
      SELECT
        inbound.id,
        inbound.whatsapp_message_id,
        inbound.from_phone,
        inbound.phone_number_id,
        inbound.message_type,
        inbound.text_body,
        inbound.created_at
      FROM gc_broadcast_whatsapp_inbound_messages inbound
      LEFT JOIN gc_broadcast_whatsapp_connections connections
        ON connections.phone_number_id = inbound.phone_number_id
      WHERE connections.company_id = $1
        OR connections.company_id IS NULL
        OR connections.id IS NULL
      ORDER BY inbound.created_at DESC
      LIMIT $2
    `,
    [companyId, safeLimit]
  );

  return result.rows.map(mapWhatsAppInboundMessage);
}

async function createManualWhatsAppConnection({
  companyId = COMPANY_ID,
  lineName,
  displayPhoneNumber,
  wabaId,
  phoneNumberId,
  accessToken,
}) {
  const normalizedLineName = String(lineName || "").trim();
  const normalizedDisplayPhoneNumber = String(displayPhoneNumber || "").trim();
  const normalizedWabaId = String(wabaId || "").trim();
  const normalizedPhoneNumberId = String(phoneNumberId || "").trim();
  const normalizedAccessToken = String(accessToken || "").trim();

  if (
    !normalizedLineName ||
    !normalizedDisplayPhoneNumber ||
    !normalizedWabaId ||
    !normalizedPhoneNumberId ||
    !normalizedAccessToken
  ) {
    throw new Error("Faltan datos obligatorios para la conexion manual");
  }

  const existingConnection = await pool.query(
    `
      SELECT id
      FROM gc_broadcast_whatsapp_connections
      WHERE phone_number_id = $1
      LIMIT 1
    `,
    [normalizedPhoneNumberId]
  );

  if (existingConnection.rows[0]) {
    const result = await pool.query(
      `
        UPDATE gc_broadcast_whatsapp_connections
        SET
          company_id = $2,
          line_name = $3,
          business_id = $4,
          waba_id = $5,
          display_phone_number = $6,
          connected_phone = $6,
          access_token = $7,
          connection_status = 'connected',
          provider = 'meta_cloud_api',
          raw_response = $8::jsonb,
          line_config = COALESCE(line_config, '{}'::jsonb) || $9::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        existingConnection.rows[0].id,
        companyId,
        normalizedLineName,
        normalizedWabaId,
        normalizedWabaId,
        normalizedDisplayPhoneNumber,
        encryptAccessToken(normalizedAccessToken),
        JSON.stringify({
          source: "manual_cloud_api",
          tokenStored: true,
          updated: true,
        }),
        JSON.stringify({
          manualRegistration: true,
          managesOwnTemplates: true,
        }),
      ]
    );

    return mapWhatsAppConnection(result.rows[0]);
  }

  return createWhatsAppConnection({
    companyId,
    lineName: normalizedLineName,
    businessId: normalizedWabaId,
    wabaId: normalizedWabaId,
    phoneNumberId: normalizedPhoneNumberId,
    displayPhoneNumber: normalizedDisplayPhoneNumber,
    connectedPhone: normalizedDisplayPhoneNumber,
    accessToken: normalizedAccessToken,
    connectionStatus: "connected",
    provider: "meta_cloud_api",
    rawResponse: {
      source: "manual_cloud_api",
      tokenStored: true,
    },
    lineConfig: {
      manualRegistration: true,
      managesOwnTemplates: true,
    },
  });
}

async function syncWhatsAppConnectionTemplates({ connectionId, templates }) {
  const connection = await getWhatsAppConnectionForSending({ connectionId });
  const safeTemplates = Array.isArray(templates) ? templates : [];

  await pool.query("BEGIN");

  try {
    await pool.query(
      "DELETE FROM gc_broadcast_whatsapp_connection_templates WHERE connection_id = $1",
      [connection.id]
    );

    for (const template of safeTemplates) {
      const variableSchema = extractTemplateVariableSchema(template);
      const signatureCode = inferSignatureCode(template.name);
      await pool.query(
        `
          INSERT INTO gc_broadcast_whatsapp_connection_templates (
            id,
            connection_id,
            waba_id,
            template_id,
            name,
            language,
            status,
            category,
            components,
            body_text,
            header_json,
            footer_text,
            buttons_json,
            variable_count,
            variable_schema,
            signature_code,
            is_active,
            raw_template,
            synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb, $12, $13::jsonb, $14, $15::jsonb, $16, $17, $18::jsonb, NOW())
          ON CONFLICT (connection_id, name, language)
          DO UPDATE SET
            template_id = EXCLUDED.template_id,
            status = EXCLUDED.status,
            category = EXCLUDED.category,
            components = EXCLUDED.components,
            body_text = EXCLUDED.body_text,
            header_json = EXCLUDED.header_json,
            footer_text = EXCLUDED.footer_text,
            buttons_json = EXCLUDED.buttons_json,
            variable_count = EXCLUDED.variable_count,
            variable_schema = EXCLUDED.variable_schema,
            signature_code = EXCLUDED.signature_code,
            is_active = EXCLUDED.is_active,
            raw_template = EXCLUDED.raw_template,
            synced_at = NOW(),
            updated_at = NOW()
        `,
        [
          createId("wa-template-def"),
          connection.id,
          connection.wabaId,
          template.id || null,
          template.name,
          template.language,
          template.status || null,
          template.category || null,
          JSON.stringify(template.components || []),
          extractTemplateBodyText(template),
          JSON.stringify(extractTemplateHeader(template)),
          extractTemplateFooterText(template),
          JSON.stringify(extractTemplateButtons(template)),
          variableSchema.length,
          JSON.stringify(variableSchema),
          signatureCode,
          template.status === "APPROVED",
          JSON.stringify(template || {}),
        ]
      );
    }

    await pool.query(
      `
        UPDATE gc_broadcast_whatsapp_connections
        SET last_synced_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `,
      [connection.id]
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  return getWhatsAppConnectionTemplates({ connectionId: connection.id });
}

async function getWhatsAppConnectionTemplates({ connectionId }) {
  const result = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_whatsapp_connection_templates
      WHERE connection_id = $1
      ORDER BY name ASC, language ASC
    `,
    [connectionId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    connectionId: row.connection_id,
    wabaId: row.waba_id,
    templateId: row.template_id,
    name: row.name,
    language: row.language,
    status: row.status,
    category: row.category,
    components: row.components || [],
    bodyText: row.body_text || null,
    header: row.header_json || null,
    footerText: row.footer_text || null,
    buttons: row.buttons_json || [],
    variableCount: Number(row.variable_count || 0),
    variableSchema: row.variable_schema || [],
    signatureCode: row.signature_code || null,
    isActive: Boolean(row.is_active),
    syncedAt: row.synced_at,
    updatedAt: row.updated_at,
  }));
}

async function getApprovedConnectionTemplate({ connectionId, templateName, languageCode = "es_MX" }) {
  const result = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_whatsapp_connection_templates
      WHERE connection_id = $1
        AND name = $2
        AND language = $3
        AND status = 'APPROVED'
      LIMIT 1
    `,
    [connectionId, templateName, languageCode]
  );

  return result.rows[0] || null;
}

async function getAllowedTemplatesForUser({
  userId,
  companyId = COMPANY_ID,
  role = null,
  whatsappConnectionId = null,
} = {}) {
  if (!userId) {
    return [];
  }

  if (role === "admin_cliente") {
    const params = [companyId];
    const connectionFilter = whatsappConnectionId ? "AND templates.connection_id = $2" : "";

    if (whatsappConnectionId) {
      params.push(whatsappConnectionId);
    }

    const result = await pool.query(
      `
        SELECT
          templates.id,
          NULL::text AS user_id,
          templates.connection_id AS whatsapp_connection_id,
          templates.name AS template_name,
          templates.language AS template_language,
          templates.category AS template_category,
          templates.status AS template_status,
          templates.body_text,
          templates.header_json,
          templates.footer_text,
          templates.buttons_json,
          templates.variable_count,
          templates.variable_schema,
          templates.components,
          NULL::text AS signature_code,
          NULL::text AS signature_name,
          NULL::text AS signature_text,
          true AS is_active,
          templates.created_at,
          templates.updated_at
        FROM gc_broadcast_whatsapp_connection_templates templates
        INNER JOIN gc_broadcast_whatsapp_connections connections
          ON connections.id = templates.connection_id
        WHERE (connections.company_id = $1 OR connections.company_id IS NULL)
          AND templates.status = 'APPROVED'
          ${connectionFilter}
        ORDER BY templates.name ASC
      `,
      params
    );

    return result.rows.map(mapUserTemplateAssignment);
  }

  const result = await pool.query(
    `
      SELECT
        assignments.*,
        templates.body_text,
        templates.header_json,
        templates.footer_text,
        templates.buttons_json,
        templates.variable_count,
        templates.variable_schema,
        templates.components
      FROM gc_broadcast_user_template_assignments assignments
      INNER JOIN gc_broadcast_whatsapp_connections connections
        ON connections.id = assignments.whatsapp_connection_id
      INNER JOIN gc_broadcast_whatsapp_connection_templates templates
        ON templates.connection_id = assignments.whatsapp_connection_id
        AND templates.name = assignments.template_name
        AND templates.language = assignments.template_language
      WHERE assignments.user_id = $1
        AND (connections.company_id = $2 OR connections.company_id IS NULL)
        AND assignments.is_active = true
        AND assignments.template_status = 'APPROVED'
        AND templates.status = 'APPROVED'
        AND ($3::text IS NULL OR assignments.whatsapp_connection_id = $3)
      ORDER BY assignments.template_name ASC
    `,
    [userId, companyId, whatsappConnectionId || null]
  );

  return result.rows.map(mapUserTemplateAssignment);
}

async function validateUserTemplateAssignment({
  userId,
  companyId = COMPANY_ID,
  role = null,
  whatsappConnectionId,
  templateName,
  languageCode = "es_MX",
}) {
  if (!templateName) {
    return null;
  }

  const approvedTemplate = await getApprovedConnectionTemplate({
    connectionId: whatsappConnectionId,
    templateName,
    languageCode,
  });

  if (!approvedTemplate) {
    throw new Error(`La plantilla ${templateName} no esta aprobada para la linea seleccionada`);
  }

  if (role === "admin_cliente") {
    return {
      templateName,
      templateLanguage: languageCode,
      templateCategory: approvedTemplate.category,
      templateStatus: approvedTemplate.status,
      bodyText: approvedTemplate.body_text,
      variableCount: Number(approvedTemplate.variable_count || 0),
      variableSchema: approvedTemplate.variable_schema || [],
      components: approvedTemplate.components || [],
      signatureCode: null,
    };
  }

  const result = await pool.query(
    `
      SELECT
        assignments.*,
        templates.body_text,
        templates.header_json,
        templates.footer_text,
        templates.buttons_json,
        templates.variable_count,
        templates.variable_schema,
        templates.components
      FROM gc_broadcast_user_template_assignments assignments
      INNER JOIN gc_broadcast_whatsapp_connection_templates templates
        ON templates.connection_id = assignments.whatsapp_connection_id
        AND templates.name = assignments.template_name
        AND templates.language = assignments.template_language
      WHERE assignments.user_id = $1
        AND assignments.whatsapp_connection_id = $2
        AND assignments.template_name = $3
        AND assignments.template_language = $4
        AND assignments.template_status = 'APPROVED'
        AND assignments.is_active = true
        AND templates.status = 'APPROVED'
        AND templates.is_active = true
      LIMIT 1
    `,
    [userId, whatsappConnectionId, templateName, languageCode]
  );

  if (!result.rows[0]) {
    throw new Error(`Tu usuario no tiene asignada la plantilla ${templateName}`);
  }

  return mapUserTemplateAssignment(result.rows[0]);
}

async function assignSignatureTemplatesToUser({
  userId,
  whatsappConnectionId,
  signatureCode,
  signatureName,
  signatureText,
  expectedTemplateNames,
  languageCode = "es_MX",
}) {
  const safeTemplateNames = Array.isArray(expectedTemplateNames) ? expectedTemplateNames : [];

  if (!userId || !whatsappConnectionId || !signatureCode || !safeTemplateNames.length) {
    throw new Error("Faltan datos para asignar plantillas al usuario");
  }

  const templatesResult = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_whatsapp_connection_templates
      WHERE connection_id = $1
        AND language = $2
        AND name = ANY($3::text[])
      ORDER BY name ASC
    `,
    [whatsappConnectionId, languageCode, safeTemplateNames]
  );

  const templatesByName = templatesResult.rows.reduce((acc, template) => {
    acc[template.name] = template;
    return acc;
  }, {});
  const validation = safeTemplateNames.map((templateName) => {
    const template = templatesByName[templateName] || null;

    return {
      templateName,
      exists: Boolean(template),
      status: template?.status || "missing",
      category: template?.category || null,
      isApproved: template?.status === "APPROVED",
    };
  });
  const missingOrNotApproved = validation.filter((item) => !item.isApproved);

  if (missingOrNotApproved.length) {
    return {
      ok: false,
      assigned: [],
      validation,
      missingOrNotApproved,
    };
  }

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        UPDATE gc_broadcast_user_template_assignments
        SET is_active = false, updated_at = NOW()
        WHERE user_id = $1
          AND whatsapp_connection_id = $2
          AND signature_code = $3
      `,
      [userId, whatsappConnectionId, signatureCode]
    );

    for (const templateName of safeTemplateNames) {
      const template = templatesByName[templateName];

      await pool.query(
        `
          INSERT INTO gc_broadcast_user_template_assignments (
            id,
            user_id,
            whatsapp_connection_id,
            template_name,
            template_language,
            template_category,
            template_status,
            signature_code,
            signature_name,
            signature_text,
            is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
          ON CONFLICT (user_id, whatsapp_connection_id, template_name, template_language)
          DO UPDATE SET
            template_category = EXCLUDED.template_category,
            template_status = EXCLUDED.template_status,
            signature_code = EXCLUDED.signature_code,
            signature_name = EXCLUDED.signature_name,
            signature_text = EXCLUDED.signature_text,
            is_active = true,
            updated_at = NOW()
        `,
        [
          createId("user-template"),
          userId,
          whatsappConnectionId,
          templateName,
          languageCode,
          template.category || null,
          template.status || null,
          signatureCode,
          signatureName,
          signatureText,
        ]
      );
    }

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  return {
    ok: true,
    assigned: await getAllowedTemplatesForUser({
      userId,
      whatsappConnectionId,
    }),
    validation,
    missingOrNotApproved: [],
  };
}

async function assignCacpTemplatesToGabriela() {
  const userResult = await pool.query(
    `
      SELECT *
      FROM gc_broadcast_users
      WHERE company_id = $1
        AND phone = '9612411222'
      LIMIT 1
    `,
    [COMPANY_ID]
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new Error("No se encontro el usuario Gabriela Montoya con telefono 9612411222");
  }

  const connectionId = user.whatsapp_connection_id || (await getPrimaryWhatsAppConnectionId());
  const expectedTemplateNames = [
    "confirmacion_envio_info_acad_cacp",
    "bienvenida_curso_cacp",
    "calendario_clases_cacp",
    "verificacion_datos_egreso_cacp",
  ];

  return {
    user: mapUser(user),
    ...(await assignSignatureTemplatesToUser({
      userId: user.id,
      whatsappConnectionId: connectionId,
      signatureCode: CACP_SIGNATURE.code,
      signatureName: CACP_SIGNATURE.name,
      signatureText: CACP_SIGNATURE.text,
      expectedTemplateNames,
      languageCode: "es_MX",
    })),
  };
}

async function getWhatsAppConnectionForSending({ connectionId, companyId = COMPANY_ID }) {
  const result = await pool.query(
    `
      SELECT
        id,
        company_id,
        line_name,
        waba_id,
        phone_number_id,
        display_phone_number,
        connected_phone,
        access_token,
        provider,
        connection_status
      FROM gc_broadcast_whatsapp_connections
      WHERE id = $1
        AND (company_id = $2 OR company_id IS NULL)
      LIMIT 1
    `,
    [connectionId, companyId]
  );

  const connection = result.rows[0];

  if (!connection) {
    throw new Error("Conexion de WhatsApp no encontrada");
  }

  if (connection.connection_status !== "connected") {
    throw new Error("La conexion de WhatsApp no esta activa");
  }

  const accessToken = decryptAccessToken(connection.access_token);

  if (!accessToken) {
    throw new Error("La conexion no tiene access token configurado");
  }

  return {
    id: connection.id,
    companyId: connection.company_id,
    lineName: connection.line_name,
    wabaId: connection.waba_id,
    phoneNumberId: connection.phone_number_id,
    displayPhoneNumber: connection.display_phone_number || connection.connected_phone,
    provider: connection.provider,
    accessToken,
  };
}

async function getDefaultWhatsAppConnectionForSending({ companyId = COMPANY_ID } = {}) {
  const result = await pool.query(
    `
      SELECT
        id
      FROM gc_broadcast_whatsapp_connections
      WHERE (company_id = $1 OR company_id IS NULL)
        AND connection_status = 'connected'
        AND access_token IS NOT NULL
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `,
    [companyId]
  );

  if (!result.rows[0]) {
    throw new Error("No hay una linea de WhatsApp conectada");
  }

  return getWhatsAppConnectionForSending({
    connectionId: result.rows[0].id,
    companyId,
  });
}

async function getWhatsAppConnectionByPhoneNumberIdForSending({
  phoneNumberId,
  companyId = COMPANY_ID,
}) {
  const result = await pool.query(
    `
      SELECT id
      FROM gc_broadcast_whatsapp_connections
      WHERE phone_number_id = $1
        AND (company_id = $2 OR company_id IS NULL)
        AND connection_status = 'connected'
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `,
    [phoneNumberId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("Conexion de WhatsApp no encontrada para el media");
  }

  return getWhatsAppConnectionForSending({
    connectionId: result.rows[0].id,
    companyId,
  });
}

module.exports = {
  getOverview,
  getLines,
  getUsers,
  getUserById,
  login,
  verifySessionToken,
  createUser,
  updateUserStatus,
  updateUserMessages,
  updateUserAccess,
  updateCompanyPlan,
  getCampaigns,
  getCampaignDeliveryReports,
  createCampaign,
  updateCampaignRecipientResult,
  updateCampaignSendStatus,
  verifyWebhookToken,
  storeWebhookEvent,
  createWhatsAppConnection,
  createManualWhatsAppConnection,
  getWhatsAppConnections,
  getWhatsAppInboundMessages,
  getWhatsAppConnectionForSending,
  getDefaultWhatsAppConnectionForSending,
  getWhatsAppConnectionByPhoneNumberIdForSending,
  syncWhatsAppConnectionTemplates,
  getWhatsAppConnectionTemplates,
  getAllowedTemplatesForUser,
  validateUserTemplateAssignment,
  assignSignatureTemplatesToUser,
  assignCacpTemplatesToGabriela,
  MALU_TENANT_ID,
  MALU_AGENT_ID,
  getOrCreateWebChatConversation,
  createWebChatMessage,
  getWebChatConversations,
  getWebChatConversationMessages,
  getWebChatMessageForMedia,
  markWebChatConversationAsRead,
};
