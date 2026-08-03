const express = require("express");

const dashboardController = require("../controllers/malu-dashboard.controller");
const {
  requirePlatformAuth,
  requirePlatformPermission,
} = require("../middleware/platform-auth.middleware");
const {
  requireMaluQaPanelEnabled,
} = require("../middleware/malu-qa-auth.middleware");

const router = express.Router();

router.use(requireMaluQaPanelEnabled);
router.use(requirePlatformAuth);

router.get("/overview", requirePlatformPermission("overview.view"), dashboardController.getOverview);
router.get(
  "/conversations",
  requirePlatformPermission("conversations.view"),
  dashboardController.getConversations
);
router.get(
  "/conversations/:conversationId",
  requirePlatformPermission("conversations.view"),
  dashboardController.getConversationDetail
);
router.get("/leads", requirePlatformPermission("leads.view"), dashboardController.getLeads);
router.get("/appointments", requirePlatformPermission("agenda.view"), dashboardController.getAppointments);
router.get("/usage", requirePlatformPermission("usage.view"), dashboardController.getUsage);
router.get("/status", requirePlatformPermission("status.view"), dashboardController.getStatus);

module.exports = router;
