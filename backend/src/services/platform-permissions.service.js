const ROLE_PERMISSIONS = {
  ADMIN: [
    "overview.view",
    "conversations.view",
    "leads.view",
    "agenda.view",
    "analytics.view",
    "usage.view",
    "status.view",
    "qa.access",
    "settings.view",
    "users.view",
    "users.manage",
  ],
  MANAGER: [
    "overview.view",
    "conversations.view",
    "leads.view",
    "agenda.view",
    "analytics.view",
    "status.view",
  ],
  SALES: [
    "overview.view",
    "conversations.view",
    "leads.view",
    "agenda.view",
  ],
  VIEWER: [
    "overview.view",
    "analytics.view",
    "status.view",
  ],
};

const MODULE_PERMISSIONS = [
  { id: "overview", label: "Overview", permission: "overview.view" },
  { id: "conversations", label: "Conversaciones", permission: "conversations.view" },
  { id: "leads", label: "Leads", permission: "leads.view" },
  { id: "agenda", label: "Agenda", permission: "agenda.view" },
  { id: "analytics", label: "Analytics", permission: "analytics.view" },
  { id: "usage", label: "Consumo", permission: "usage.view" },
  { id: "status", label: "Estado", permission: "status.view" },
  { id: "qa", label: "QA de Malu", permission: "qa.access" },
  { id: "settings", label: "Configuracion", permission: "settings.view" },
  { id: "users", label: "Usuarios", permission: "users.manage" },
];

function normalizePlatformRole(role) {
  const normalized = String(role || "").trim().toUpperCase();
  return ROLE_PERMISSIONS[normalized] ? normalized : "VIEWER";
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[normalizePlatformRole(role)];
}

function normalizePermissionList(permissions = []) {
  return Array.from(
    new Set(
      (Array.isArray(permissions) ? permissions : [])
        .map((permission) => String(permission || "").trim())
        .filter((permission) =>
          MODULE_PERMISSIONS.some((modulePermission) => modulePermission.permission === permission)
        )
    )
  );
}

function getEffectivePermissions({ platformRole, dashboardPermissions = [] } = {}) {
  const rolePermissions = getRolePermissions(platformRole);
  const overrides = normalizePermissionList(dashboardPermissions);

  if (!overrides.length || normalizePlatformRole(platformRole) === "ADMIN") {
    return rolePermissions;
  }

  return rolePermissions.filter((permission) => overrides.includes(permission));
}

function hasPermission(user, permission) {
  const permissions = user?.permissions || getEffectivePermissions(user);
  return permissions.includes(permission);
}

function canManageUsers(user) {
  return user?.tenantType !== "DEMO" && hasPermission(user, "users.manage");
}

module.exports = {
  MODULE_PERMISSIONS,
  ROLE_PERMISSIONS,
  canManageUsers,
  getEffectivePermissions,
  getRolePermissions,
  hasPermission,
  normalizePermissionList,
  normalizePlatformRole,
};
