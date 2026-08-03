const crypto = require("crypto");

const { pool } = require("../db");
const broadcastService = require("./broadcast-db.service");
const permissionsService = require("./platform-permissions.service");

const STATUS_OPTIONS = ["active", "invitation_pending", "suspended"];
const LEGACY_ROLE_BY_PLATFORM_ROLE = {
  ADMIN: "admin_cliente",
  MANAGER: "operador_cliente",
  SALES: "operador_cliente",
  VIEWER: "lectura_cliente",
};

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha512").toString("hex");
  return `pbkdf2$100000$${salt}$${hash}`;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.phone,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    tenantType: user.tenantType,
    role: user.platformRole,
    legacyRole: user.role,
    status: user.status,
    permissions: user.permissions,
    dashboardPermissions: user.dashboardPermissions,
    canManageUsers: user.canManageUsers,
    lastAccessAt: user.lastAccessAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isVisibleTenantUserStatus(status) {
  return status !== "suspended";
}

function intersectPermissions(requestedPermissions, actorPermissions) {
  const normalizedRequested = permissionsService.normalizePermissionList(requestedPermissions);
  const actorAllowed = new Set(actorPermissions || []);

  return normalizedRequested.filter((permission) => actorAllowed.has(permission));
}

function getAssignablePermissions({ platformRole, requestedPermissions, actor }) {
  if (platformRole === "ADMIN") {
    return [];
  }

  const rolePermissions = permissionsService.getRolePermissions(platformRole);
  const requested = requestedPermissions?.length ? requestedPermissions : rolePermissions;
  return intersectPermissions(requested, actor.permissions);
}

async function recordAudit({ actor, action, entityType, entityId, metadata = {} }) {
  await pool.query(
    `
      INSERT INTO gc_platform_audit_logs (
        id,
        tenant_id,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      createId("audit"),
      actor.tenantId,
      actor.id === "backend-admin-key" ? null : actor.id,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata),
    ]
  );
}

async function listTenantUsers(actor) {
  const users = await pool.query(
    `
      SELECT id
      FROM gc_broadcast_users
      WHERE tenant_id = $1
        AND status <> 'suspended'
      ORDER BY created_at ASC
    `,
    [actor.tenantId]
  );

  const mapped = await Promise.all(users.rows.map((row) => broadcastService.getUserById(row.id)));
  return mapped.filter(Boolean).map(sanitizeUser);
}

async function createTenantUser(actor, payload = {}) {
  if (actor.tenantType === "DEMO") {
    throw new Error("El tenant demo no permite gestion de usuarios");
  }

  const name = String(payload.name || "").trim();
  const username = String(payload.username || payload.email || "").trim();
  const password = String(payload.password || payload.temporaryPassword || "").trim();
  const platformRole = permissionsService.normalizePlatformRole(payload.role);

  if (!name || !username || !password) {
    throw new Error("Nombre, usuario y password temporal son obligatorios");
  }

  if (platformRole === "ADMIN" && !permissionsService.hasPermission(actor, "users.manage")) {
    throw new Error("Permiso insuficiente");
  }

  const dashboardPermissions = getAssignablePermissions({
    platformRole,
    requestedPermissions: payload.permissions,
    actor,
  });
  const legacyRole = LEGACY_ROLE_BY_PLATFORM_ROLE[platformRole] || "lectura_cliente";
  const userId = createId("user");

  try {
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
        VALUES ($1, 'cacp', $2, $3, $4, $5, $6, $7, $8::jsonb, 0, '[]'::jsonb, $9)
      `,
      [
        userId,
        actor.tenantId,
        name,
        username,
        hashPassword(password),
        legacyRole,
        platformRole,
        JSON.stringify(dashboardPermissions),
        payload.status && STATUS_OPTIONS.includes(payload.status) ? payload.status : "active",
      ]
    );
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese identificador");
    }

    throw error;
  }

  await recordAudit({
    actor,
    action: "user.created",
    entityType: "gc_broadcast_user",
    entityId: userId,
    metadata: { platformRole },
  });

  return sanitizeUser(await broadcastService.getUserById(userId));
}

async function updateTenantUser(actor, userId, payload = {}) {
  if (actor.tenantType === "DEMO") {
    throw new Error("El tenant demo no permite gestion de usuarios");
  }

  const existing = await broadcastService.getUserById(userId);

  if (!existing || existing.tenantId !== actor.tenantId) {
    throw new Error("Usuario no encontrado");
  }

  const nextRole = payload.role
    ? permissionsService.normalizePlatformRole(payload.role)
    : existing.platformRole;
  const nextPermissions = getAssignablePermissions({
    platformRole: nextRole,
    requestedPermissions: payload.permissions || existing.dashboardPermissions,
    actor,
  });
  const nextLegacyRole = LEGACY_ROLE_BY_PLATFORM_ROLE[nextRole] || existing.role;
  const nextStatus =
    payload.status && STATUS_OPTIONS.includes(payload.status) ? payload.status : existing.status;

  await pool.query(
    `
      UPDATE gc_broadcast_users
      SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        role = $3,
        platform_role = $4,
        dashboard_permissions = $5::jsonb,
        status = $6,
        updated_at = NOW()
      WHERE id = $7
        AND tenant_id = $8
    `,
    [
      payload.name ? String(payload.name).trim() : null,
      payload.username ? String(payload.username).trim() : null,
      nextLegacyRole,
      nextRole,
      JSON.stringify(nextPermissions),
      nextStatus,
      userId,
      actor.tenantId,
    ]
  );

  await recordAudit({
    actor,
    action: "user.updated",
    entityType: "gc_broadcast_user",
    entityId: userId,
    metadata: { platformRole: nextRole, status: nextStatus },
  });

  return sanitizeUser(await broadcastService.getUserById(userId));
}

async function updateTenantUserStatus(actor, userId, status) {
  return updateTenantUser(actor, userId, { status });
}

function getPermissionsMetadata(actor) {
  return {
    tenant: {
      id: actor.tenantId,
      name: actor.tenantName,
      type: actor.tenantType,
      canManageUsers: permissionsService.canManageUsers(actor),
    },
    roles: Object.entries(permissionsService.ROLE_PERMISSIONS).map(([role, permissions]) => ({
      role,
      permissions: permissions.filter((permission) => actor.permissions.includes(permission)),
    })),
    modules: permissionsService.MODULE_PERMISSIONS.filter((modulePermission) =>
      actor.permissions.includes(modulePermission.permission)
    ),
    currentUser: sanitizeUser({
      ...actor,
      platformRole: actor.platformRole,
      status: "active",
      phone: null,
      dashboardPermissions: [],
      lastAccessAt: null,
      createdAt: null,
      updatedAt: null,
    }),
  };
}

module.exports = {
  createTenantUser,
  getPermissionsMetadata,
  isVisibleTenantUserStatus,
  listTenantUsers,
  updateTenantUser,
  updateTenantUserStatus,
};
