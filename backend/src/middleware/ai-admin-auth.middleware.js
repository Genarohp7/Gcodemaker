const env = require("../config/env");

function requireAiAdmin(req, res, next) {
  if (!env.gcAiAdminKey) {
    return res.status(503).json({
      ok: false,
      message: "Administracion IA no configurada",
    });
  }

  const adminKey = req.header("x-admin-key");

  if (!adminKey || adminKey !== env.gcAiAdminKey) {
    return res.status(401).json({
      ok: false,
      message: "No autorizado",
    });
  }

  return next();
}

module.exports = {
  requireAiAdmin,
};
