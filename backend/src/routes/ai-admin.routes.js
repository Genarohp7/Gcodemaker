const express = require("express");

const {
  activateAdminDemo,
  createLearningFinding,
  createLearningFrameworkVersion,
  deactivateAdminDemo,
  getAdminConversationMessages,
  getAdminLead,
  getAdminLeads,
  getAdminMetrics,
  getAdminSettings,
  getLearningConversation,
  getLearningPendingReviews,
  listLearningFindings,
  saveLearningConversationReview,
  updateLearningFindingStatus,
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
router.get("/ai-learning/reviews/pending", getLearningPendingReviews);
router.get("/ai-learning/conversations/:id", getLearningConversation);
router.post("/ai-learning/conversations/:id/reviews", saveLearningConversationReview);
router.get("/ai-learning/findings", listLearningFindings);
router.post("/ai-learning/findings", createLearningFinding);
router.patch("/ai-learning/findings/:id/status", updateLearningFindingStatus);
router.post("/ai-learning/framework-versions", createLearningFrameworkVersion);

module.exports = router;
