const env = require("../config/env");
const broadcastService = require("../services/broadcast-db.service");

function requireMaluQaPanelEnabled(_req, res, next) {
  if (!env.gcMaluQaPanelEnabled) {
    return res.status(403).json({
      ok: false,
      message: "Panel QA de Malu no habilitado",
    });
  }

  return next();
}

function getBearerToken(req) {
  const authorization = req.get("authorization") || "";
  const [type, token] = authorization.split(" ");

  return type === "Bearer" && token ? token : null;
}

function hasBackendAdminKey(req) {
  const adminKey = req.get("x-admin-key");

  return Boolean(env.gcAiAdminKey && adminKey && adminKey === env.gcAiAdminKey);
}

function getBroadcastAdminSession(req) {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    const session = broadcastService.verifySessionToken(token);

    return session?.role === "admin_cliente" ? session : null;
  } catch (_error) {
    return null;
  }
}

function requireMaluQaAdmin(req, res, next) {
  if (hasBackendAdminKey(req)) {
    return next();
  }

  const session = getBroadcastAdminSession(req);

  if (session) {
    req.maluQaAdminSession = session;
    return next();
  }

  return res.status(401).json({
    ok: false,
    message: "No autorizado",
  });
}

module.exports = {
  requireMaluQaPanelEnabled,
  requireMaluQaAdmin,
};
