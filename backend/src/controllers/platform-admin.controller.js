const platformAdminService = require("../services/platform-admin.service");

function sendData(res, data) {
  res.json({
    ok: true,
    data,
  });
}

function sendError(res, error) {
  const message = error.message || "No se pudo completar la operacion";
  const status =
    message.includes("Permiso insuficiente") || message.includes("tenant demo")
      ? 403
      : message.includes("no encontrado")
        ? 404
        : 400;

  res.status(status).json({
    ok: false,
    message,
  });
}

async function getPermissions(req, res) {
  try {
    sendData(res, platformAdminService.getPermissionsMetadata(req.platformUser));
  } catch (error) {
    sendError(res, error);
  }
}

async function getUsers(req, res) {
  try {
    sendData(res, await platformAdminService.listTenantUsers(req.platformUser));
  } catch (error) {
    sendError(res, error);
  }
}

async function createUser(req, res) {
  try {
    sendData(res, await platformAdminService.createTenantUser(req.platformUser, req.body));
  } catch (error) {
    sendError(res, error);
  }
}

async function updateUser(req, res) {
  try {
    sendData(
      res,
      await platformAdminService.updateTenantUser(req.platformUser, req.params.userId, req.body)
    );
  } catch (error) {
    sendError(res, error);
  }
}

async function updateUserStatus(req, res) {
  try {
    sendData(
      res,
      await platformAdminService.updateTenantUserStatus(
        req.platformUser,
        req.params.userId,
        req.body?.status
      )
    );
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = {
  createUser,
  getPermissions,
  getUsers,
  updateUser,
  updateUserStatus,
};
