const express = require("express");

const {
  receiveWhatsAppAgentWebhook,
  verifyWhatsAppAgentWebhook,
} = require("../controllers/whatsapp-agent.controller");

const router = express.Router();

router.get("/webhooks/whatsapp", verifyWhatsAppAgentWebhook);
router.post("/webhooks/whatsapp", receiveWhatsAppAgentWebhook);

module.exports = router;
