const env = require("../config/env");
const whatsappAgentService = require("../services/whatsapp-agent.service");

function verifyWhatsAppAgentWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || !token || token !== env.whatsappVerifyToken) {
    return res.status(403).json({
      ok: false,
      message: "No se pudo verificar el webhook del agente WhatsApp",
    });
  }

  return res.status(200).send(challenge);
}

async function receiveWhatsAppAgentWebhook(req, res) {
  try {
    const result = await whatsappAgentService.processWebhookPayload(req.body);

    return res.status(200).json({
      ok: true,
      message: "Webhook del agente WhatsApp procesado",
      data: result,
    });
  } catch (error) {
    console.error("Error al procesar webhook del agente WhatsApp", error);

    return res.status(500).json({
      ok: false,
      message: "No se pudo procesar el webhook del agente WhatsApp",
    });
  }
}

module.exports = {
  verifyWhatsAppAgentWebhook,
  receiveWhatsAppAgentWebhook,
};
