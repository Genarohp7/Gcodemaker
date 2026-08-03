const express = require("express");

const platformAdminController = require("../controllers/platform-admin.controller");
const {
  requirePlatformAuth,
  requirePlatformPermission,
  requireTenantUserManagement,
} = require("../middleware/platform-auth.middleware");

const router = express.Router();

router.get("/permissions", requirePlatformAuth, platformAdminController.getPermissions);
router.get(
  "/users",
  requirePlatformAuth,
  requirePlatformPermission("users.view"),
  platformAdminController.getUsers
);
router.post(
  "/users",
  requirePlatformAuth,
  requireTenantUserManagement,
  platformAdminController.createUser
);
router.patch(
  "/users/:userId",
  requirePlatformAuth,
  requireTenantUserManagement,
  platformAdminController.updateUser
);
router.patch(
  "/users/:userId/status",
  requirePlatformAuth,
  requireTenantUserManagement,
  platformAdminController.updateUserStatus
);

module.exports = router;
