const dashboardService = require("../services/malu-dashboard.service");

function sendData(res, data) {
  res.json({
    ok: true,
    data,
  });
}

function sendError(res, error) {
  res.status(500).json({
    ok: false,
    message: "No se pudo cargar el dashboard de Malu",
    error: error.message,
  });
}

async function getOverview(req, res) {
  try {
    sendData(res, await dashboardService.getDashboardOverview(req.query));
  } catch (error) {
    sendError(res, error);
  }
}

async function getConversations(req, res) {
  try {
    sendData(res, await dashboardService.getDashboardConversations(req.query));
  } catch (error) {
    sendError(res, error);
  }
}

async function getConversationDetail(req, res) {
  try {
    const data = await dashboardService.getDashboardConversationDetail(req.params.conversationId);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Conversacion no encontrada",
      });
    }

    return sendData(res, data);
  } catch (error) {
    return sendError(res, error);
  }
}

async function getLeads(req, res) {
  try {
    sendData(res, await dashboardService.getDashboardLeads(req.query));
  } catch (error) {
    sendError(res, error);
  }
}

async function getAppointments(req, res) {
  try {
    sendData(res, await dashboardService.getDashboardAppointments(req.query));
  } catch (error) {
    sendError(res, error);
  }
}

async function getUsage(req, res) {
  try {
    sendData(res, await dashboardService.getDashboardUsage(req.query));
  } catch (error) {
    sendError(res, error);
  }
}

async function getStatus(req, res) {
  try {
    sendData(res, await dashboardService.getDashboardStatus());
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = {
  getAppointments,
  getConversationDetail,
  getConversations,
  getLeads,
  getOverview,
  getStatus,
  getUsage,
};
