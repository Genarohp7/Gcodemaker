const env = require("../config/env");
const {
  requirePlatformAuth,
  requirePlatformPermission,
} = require("./platform-auth.middleware");

function requireMaluQaPanelEnabled(_req, res, next) {
  if (!env.gcMaluQaPanelEnabled) {
    return res.status(403).json({
      ok: false,
      message: "Panel QA de Malu no habilitado",
    });
  }

  return next();
}

function requireMaluQaAdmin(req, res, next) {
  return requirePlatformAuth(req, res, () =>
    requirePlatformPermission("qa.access")(req, res, next)
  );
}

module.exports = {
  requireMaluQaPanelEnabled,
  requireMaluQaAdmin,
};
