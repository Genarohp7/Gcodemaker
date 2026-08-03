const assert = require("node:assert/strict");
const test = require("node:test");

const platformAdmin = require("../platform-admin.service");

const demoAdmin = {
  id: "user-demo-admin",
  tenantId: "tenant-gcodemaker-demo",
  tenantName: "GCodemaker Demo",
  tenantType: "DEMO",
  platformRole: "ADMIN",
  permissions: [
    "overview.view",
    "settings.view",
    "users.view",
    "users.manage",
  ],
};

test("Demo tenant cannot create users from dashboard context", async () => {
  await assert.rejects(
    platformAdmin.createTenantUser(demoAdmin, {
      name: "Demo User",
      username: "demo@example.com",
      password: "temporal",
      role: "VIEWER",
    }),
    /tenant demo/
  );
});

test("permissions metadata hides modules outside current user permissions", () => {
  const metadata = platformAdmin.getPermissionsMetadata({
    id: "sales-1",
    tenantId: "tenant-gcodemaker-malu",
    tenantName: "GCodemaker / Malu",
    tenantType: "NORMAL",
    platformRole: "SALES",
    permissions: ["overview.view", "conversations.view", "leads.view"],
  });

  assert.equal(metadata.tenant.canManageUsers, false);
  assert.deepEqual(
    metadata.modules.map((item) => item.permission),
    ["overview.view", "conversations.view", "leads.view"]
  );
});

test("suspended legacy users are hidden from the active tenant user list", () => {
  assert.equal(platformAdmin.isVisibleTenantUserStatus("active"), true);
  assert.equal(platformAdmin.isVisibleTenantUserStatus("invitation_pending"), true);
  assert.equal(platformAdmin.isVisibleTenantUserStatus("suspended"), false);
});
