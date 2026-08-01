const maluSimulatorService = require("../services/malu-simulator.service");
const { getCalendarProviderName } = require("../services/calendar-provider.service");

function sendError(res, error) {
  return res.status(error.statusCode || 500).json({
    ok: false,
    message: error.statusCode ? error.message : "Error interno del simulador",
  });
}

async function startSimulatorConversation(req, res) {
  try {
    const session = await maluSimulatorService.ensureSimulatorSession({
      sessionId: req.body?.sessionId,
    });
    const conversation = await maluSimulatorService.getSimulatorConversation({
      sessionId: session.sessionId,
    });

    return res.status(201).json({
      ok: true,
      data: {
        ...conversation,
        liveAiAvailable: maluSimulatorService.hasLiveAiKey(),
        calendarProvider: getCalendarProviderName(),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getSimulatorConversation(req, res) {
  try {
    const conversation = await maluSimulatorService.getSimulatorConversation({
      sessionId: req.params.sessionId,
    });

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        message: "Conversacion simulada no encontrada",
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        ...conversation,
        liveAiAvailable: maluSimulatorService.hasLiveAiKey(),
        calendarProvider: getCalendarProviderName(),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function sendSimulatorMessage(req, res) {
  try {
    const result = await maluSimulatorService.sendSimulatorMessage({
      sessionId: req.params.sessionId,
      text: req.body?.text,
      mode: req.body?.mode,
      messageId: req.body?.messageId,
    });

    return res.status(200).json({
      ok: true,
      data: {
        ...result,
        liveAiAvailable: maluSimulatorService.hasLiveAiKey(),
        calendarProvider: getCalendarProviderName(),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function resetSimulatorConversation(req, res) {
  try {
    const result = await maluSimulatorService.resetSimulatorSession({
      sessionId: req.params.sessionId,
    });

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  startSimulatorConversation,
  getSimulatorConversation,
  sendSimulatorMessage,
  resetSimulatorConversation,
};
