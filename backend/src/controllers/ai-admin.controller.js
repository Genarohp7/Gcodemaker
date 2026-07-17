const aiAdminService = require("../services/ai-admin.service");

async function getAdminLeads(req, res) {
  const leads = await aiAdminService.getLeads(req.query);

  return res.status(200).json({
    ok: true,
    data: leads,
  });
}

async function getAdminLead(req, res) {
  const lead = await aiAdminService.getLeadById(req.params.id);

  if (!lead) {
    return res.status(404).json({
      ok: false,
      message: "Lead no encontrado",
    });
  }

  return res.status(200).json({
    ok: true,
    data: lead,
  });
}

async function updateAdminLeadStatus(req, res) {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      ok: false,
      message: "El campo status es obligatorio",
    });
  }

  const lead = await aiAdminService.updateLeadStatus({
    leadId: req.params.id,
    status,
  });

  if (!lead) {
    return res.status(404).json({
      ok: false,
      message: "Lead no encontrado",
    });
  }

  return res.status(200).json({
    ok: true,
    data: lead,
  });
}

async function getAdminConversationMessages(req, res) {
  const messages = await aiAdminService.getConversationMessages({
    conversationId: req.params.id,
    limit: req.query.limit,
  });

  return res.status(200).json({
    ok: true,
    data: messages,
  });
}

async function activateAdminDemo(req, res) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      ok: false,
      message: "El campo phone es obligatorio",
    });
  }

  const result = await aiAdminService.activateDemo({ phone });

  return res.status(200).json({
    ok: true,
    data: result,
  });
}

async function deactivateAdminDemo(req, res) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      ok: false,
      message: "El campo phone es obligatorio",
    });
  }

  const result = await aiAdminService.deactivateDemo({ phone });

  return res.status(200).json({
    ok: true,
    data: result,
  });
}

async function getAdminMetrics(req, res) {
  const metrics = await aiAdminService.getMetrics();

  return res.status(200).json({
    ok: true,
    data: metrics,
  });
}

async function getAdminSettings(req, res) {
  const settings = await aiAdminService.getSettings();

  return res.status(200).json({
    ok: true,
    data: settings,
  });
}

async function updateAdminSetting(req, res) {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({
      ok: false,
      message: "El campo key es obligatorio",
    });
  }

  const setting = await aiAdminService.updateSetting({ key, value });

  return res.status(200).json({
    ok: true,
    data: setting,
  });
}

module.exports = {
  getAdminLeads,
  getAdminLead,
  updateAdminLeadStatus,
  getAdminConversationMessages,
  activateAdminDemo,
  deactivateAdminDemo,
  getAdminMetrics,
  getAdminSettings,
  updateAdminSetting,
};
