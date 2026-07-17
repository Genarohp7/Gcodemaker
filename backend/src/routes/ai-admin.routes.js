const express = require("express");

const {
  activateAdminDemo,
  deactivateAdminDemo,
  getAdminConversationMessages,
  getAdminLead,
  getAdminLeads,
  getAdminMetrics,
  getAdminSettings,
  updateAdminLeadStatus,
  updateAdminSetting,
} = require("../controllers/ai-admin.controller");
const { requireAiAdmin } = require("../middleware/ai-admin-auth.middleware");

const router = express.Router();

router.use(requireAiAdmin);

router.get("/leads", getAdminLeads);
router.get("/leads/:id", getAdminLead);
router.patch("/leads/:id/status", updateAdminLeadStatus);
router.get("/conversations/:id/messages", getAdminConversationMessages);
router.post("/demo/activate", activateAdminDemo);
router.post("/demo/deactivate", deactivateAdminDemo);
router.get("/metrics", getAdminMetrics);
router.get("/settings", getAdminSettings);
router.patch("/settings", updateAdminSetting);

module.exports = router;
