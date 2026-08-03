const env = require("../config/env");
const broadcastService = require("../services/broadcast-db.service");
const permissionsService = require("../services/platform-permissions.service");

function getBearerToken(req) {
  const authorization = req.get("authorization") || "";
  const [type, token] = authorization.split(" ");

  return type === "Bearer" && token ? token : null;
}

function hasBackendAdminKey(req) {
  const adminKey = req.get("x-admin-key");

  return Boolean(env.gcAiAdminKey && adminKey && adminKey === env.gcAiAdminKey);
}

function createBackendAdminContext() {
  const platformRole = "ADMIN";
  const permissions = permissionsService.getEffectivePermissions({ platformRole });

  return {
    id: "backend-admin-key",
    tenantId: broadcastService.MALU_TENANT_ID,
    tenantName: "GCodemaker / Malu",
    tenantType: "NORMAL",
    agentId: broadcastService.MALU_AGENT_ID,
    agentName: "Malu",
    platformRole,
    permissions,
    canManageUsers: true,
    authMethod: "admin-key",
  };
}

async function resolveSessionUser(req) {
  if (hasBackendAdminKey(req)) {
    return createBackendAdminContext();
  }

  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  const session = broadcastService.verifySessionToken(token);
  const user = await broadcastService.getUserById(session.sub);

  if (!user || user.status !== "active") {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    tenantType: user.tenantType,
    agentId: user.agentId,
    agentName: user.agentName,
    platformRole: user.platformRole,
    permissions: user.permissions,
    canManageUsers: user.canManageUsers,
    authMethod: "bearer",
  };
}

async function requirePlatformAuth(req, res, next) {
  try {
    const user = await resolveSessionUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "No autorizado",
      });
    }

    req.platformUser = user;
    return next();
  } catch (_error) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }
}

function requirePlatformPermission(permission) {
  return (req, res, next) => {
    if (!permissionsService.hasPermission(req.platformUser, permission)) {
      return res.status(403).json({
        ok: false,
        message: "Permiso insuficiente",
      });
    }

    return next();
  };
}

function requireTenantUserManagement(req, res, next) {
  if (req.platformUser?.tenantType === "DEMO") {
    return res.status(403).json({
      ok: false,
      message: "El tenant demo no permite gestion de usuarios",
    });
  }

  return requirePlatformPermission("users.manage")(req, res, next);
}

module.exports = {
  getBearerToken,
  hasBackendAdminKey,
  requirePlatformAuth,
  requirePlatformPermission,
  requireTenantUserManagement,
};
