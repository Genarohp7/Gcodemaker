const express = require("express");

const dashboardController = require("../controllers/malu-dashboard.controller");
const {
  requireMaluQaAdmin,
  requireMaluQaPanelEnabled,
} = require("../middleware/malu-qa-auth.middleware");

const router = express.Router();

router.use(requireMaluQaPanelEnabled);
router.use(requireMaluQaAdmin);

router.get("/overview", dashboardController.getOverview);
router.get("/conversations", dashboardController.getConversations);
router.get("/conversations/:conversationId", dashboardController.getConversationDetail);
router.get("/leads", dashboardController.getLeads);
router.get("/appointments", dashboardController.getAppointments);
router.get("/usage", dashboardController.getUsage);
router.get("/status", dashboardController.getStatus);

module.exports = router;
