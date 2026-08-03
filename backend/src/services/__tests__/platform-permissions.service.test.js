const assert = require("node:assert/strict");
const test = require("node:test");

const permissions = require("../platform-permissions.service");

test("maps base platform roles to deterministic permissions", () => {
  assert.equal(permissions.hasPermission({ platformRole: "ADMIN" }, "users.manage"), true);
  assert.equal(permissions.hasPermission({ platformRole: "MANAGER" }, "analytics.view"), true);
  assert.equal(permissions.hasPermission({ platformRole: "SALES" }, "usage.view"), false);
  assert.equal(permissions.hasPermission({ platformRole: "VIEWER" }, "conversations.view"), false);
});

test("applies dashboard permission overrides within the base role", () => {
  const user = {
    platformRole: "SALES",
    dashboardPermissions: ["conversations.view", "usage.view"],
  };

  assert.deepEqual(permissions.getEffectivePermissions(user), ["conversations.view"]);
});

test("does not allow Demo tenants to manage users", () => {
  assert.equal(
    permissions.canManageUsers({
      tenantType: "DEMO",
      platformRole: "ADMIN",
    }),
    false
  );
});

test("normalizes unknown roles and permissions safely", () => {
  assert.equal(permissions.normalizePlatformRole("superadmin"), "VIEWER");
  assert.deepEqual(
    permissions.normalizePermissionList(["overview.view", "unknown.permission", "overview.view"]),
    ["overview.view"]
  );
});
