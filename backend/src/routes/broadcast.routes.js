const express = require("express");

const {
  createBroadcastCampaign,
  sendBroadcastCampaign,
  getBroadcastCampaigns,
  getBroadcastLines,
  getBroadcastOverview,
  getBroadcastUsers,
  getBroadcastAllowedTemplates,
  assignCacpTemplatesToGabriela,
  loginBroadcastUser,
  createBroadcastUser,
  updateBroadcastUserStatus,
  updateBroadcastUserMessages,
  updateBroadcastUserAccess,
  updateBroadcastCompanyPlan,
  sendBienvenidaCursoTemplate,
  getBroadcastCampaignDeliveryReports,
  sendWhatsAppTestMessage,
  createManualWhatsAppConnection,
  getWhatsAppInboundMessages,
  getWebChatConversations,
  getWebChatMessages,
  sendWebChatMessage,
  uploadWebChatAttachment,
  getWebChatMessageMedia,
  markWebChatConversationAsRead,
  receiveWhatsAppWebhook,
  verifyWhatsAppWebhook,
  exchangeEmbeddedSignupCode,
  getWhatsAppConnections,
  getWhatsAppConnectionMetaSummary,
} = require("../controllers/broadcast.controller");

const router = express.Router();

router.get("/broadcast/overview", getBroadcastOverview);
router.get("/broadcast/lines", getBroadcastLines);
router.get("/broadcast/users", getBroadcastUsers);
router.get("/broadcast/templates/allowed", getBroadcastAllowedTemplates);
router.post("/broadcast/templates/assignments/cacp-gabriela", assignCacpTemplatesToGabriela);
router.post("/broadcast/auth/login", loginBroadcastUser);
router.post("/broadcast/users", createBroadcastUser);
router.patch("/broadcast/users/:userId/status", updateBroadcastUserStatus);
router.patch("/broadcast/users/:userId/messages", updateBroadcastUserMessages);
router.patch("/broadcast/users/:userId/access", updateBroadcastUserAccess);
router.patch("/broadcast/company/plan", updateBroadcastCompanyPlan);
router.get("/broadcast/campaigns", getBroadcastCampaigns);
router.get("/broadcast/campaigns/delivery-reports", getBroadcastCampaignDeliveryReports);
router.post("/broadcast/campaigns", createBroadcastCampaign);
router.post("/broadcast/campaigns/send", sendBroadcastCampaign);
router.post("/whatsapp/templates/bienvenida-curso", sendBienvenidaCursoTemplate);
router.post("/broadcast/whatsapp/test-send", sendWhatsAppTestMessage);
router.get("/broadcast/whatsapp/connections", getWhatsAppConnections);
router.get("/broadcast/whatsapp/connections/:connectionId/meta-summary", getWhatsAppConnectionMetaSummary);
router.post("/broadcast/whatsapp/connections/manual", createManualWhatsAppConnection);
router.get("/broadcast/whatsapp/inbound-messages", getWhatsAppInboundMessages);
router.post("/broadcast/meta/embedded-signup/exchange", exchangeEmbeddedSignupCode);

router.get("/web-chat/conversations", getWebChatConversations);
router.get("/web-chat/conversations/:conversationId/messages", getWebChatMessages);
router.post("/web-chat/conversations/:conversationId/messages", sendWebChatMessage);
router.post("/web-chat/conversations/:conversationId/attachments", uploadWebChatAttachment);
router.patch("/web-chat/conversations/:conversationId/read", markWebChatConversationAsRead);
router.get("/web-chat/messages/:messageId/media", getWebChatMessageMedia);

router.get("/webhooks/whatsapp", verifyWhatsAppWebhook);
router.post("/webhooks/whatsapp", receiveWhatsAppWebhook);

module.exports = router;
