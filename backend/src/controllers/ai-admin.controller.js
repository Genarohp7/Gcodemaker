const aiAdminService = require("../services/ai-admin.service");

function getReviewerUserId(req) {
  return req.header("x-admin-user-id") || null;
}

function sendError(res, error) {
  return res.status(error.statusCode || 500).json({
    ok: false,
    message: error.statusCode ? error.message : "Error interno",
  });
}

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

async function getLearningPendingReviews(req, res) {
  try {
    const data = await aiAdminService.listPendingLearningReviews(req.query);

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getLearningConversation(req, res) {
  try {
    const data = await aiAdminService.getLearningConversationDetail({
      conversationId: req.params.id,
    });

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Conversacion no encontrada",
      });
    }

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function saveLearningConversationReview(req, res) {
  try {
    const data = await aiAdminService.saveConversationReview({
      conversationId: req.params.id,
      reviewerUserId: getReviewerUserId(req),
      review: req.body || {},
    });

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function createLearningFinding(req, res) {
  try {
    const data = await aiAdminService.createLearningFinding({
      finding: req.body || {},
      createdBy: getReviewerUserId(req),
    });

    return res.status(201).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listLearningFindings(req, res) {
  try {
    const data = await aiAdminService.listLearningFindings(req.query);

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateLearningFindingStatus(req, res) {
  try {
    const data = await aiAdminService.updateLearningFindingStatus({
      findingId: req.params.id,
      status: req.body?.status,
      targetVersion: req.body?.targetVersion,
      approvedBy: getReviewerUserId(req),
    });

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Hallazgo no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function createLearningFrameworkVersion(req, res) {
  try {
    const data = await aiAdminService.createFrameworkVersion({
      version: req.body || {},
      createdBy: getReviewerUserId(req),
    });

    return res.status(201).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
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
  getLearningPendingReviews,
  getLearningConversation,
  saveLearningConversationReview,
  createLearningFinding,
  listLearningFindings,
  updateLearningFindingStatus,
  createLearningFrameworkVersion,
};
