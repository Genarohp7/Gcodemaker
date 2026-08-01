const express = require("express");

const {
  getSimulatorConversation,
  resetSimulatorConversation,
  sendSimulatorMessage,
  startSimulatorConversation,
} = require("../controllers/malu-simulator.controller");
const {
  requireMaluQaAdmin,
  requireMaluQaPanelEnabled,
} = require("../middleware/malu-qa-auth.middleware");

const router = express.Router();

router.use(requireMaluQaPanelEnabled);
router.use(requireMaluQaAdmin);

router.post("/conversations", startSimulatorConversation);
router.get("/conversations/:sessionId", getSimulatorConversation);
router.post("/conversations/:sessionId/messages", sendSimulatorMessage);
router.post("/conversations/:sessionId/reset", resetSimulatorConversation);

module.exports = router;
