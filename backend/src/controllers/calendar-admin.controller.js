const env = require("../config/env");
const googleCalendarConnectionService = require("../services/google-calendar-connection.service");
const { getCalendarProviderName } = require("../services/calendar-provider.service");
const googleCalendarOauthService = require("../services/google-calendar-oauth.service");
const googleCalendarOAuthStateService = require("../services/google-calendar-oauth-state.service");

async function getCalendarStatus(req, res) {
  const activeConnection = await googleCalendarConnectionService.getActiveConnection();

  return res.status(200).json({
    ok: true,
    data: {
      provider: getCalendarProviderName(),
      googleCalendarEnabled: env.googleCalendarEnabled,
      oauthConfigured: Boolean(env.googleClientId && env.googleClientSecret && env.googleRedirectUri),
      connected: Boolean(activeConnection),
      connectionStatus: activeConnection?.status || "DISCONNECTED",
      calendarId: activeConnection?.calendarId || env.googleCalendarId || "primary",
      configured: {
        clientId: Boolean(env.googleClientId),
        clientSecret: Boolean(env.googleClientSecret),
        redirectUri: Boolean(env.googleRedirectUri),
        calendarId: Boolean(env.googleCalendarId),
        refreshToken: Boolean(activeConnection || env.googleRefreshToken),
        tokenEncryptionKey: Boolean(env.googleTokenEncryptionKey),
      },
      scopes: googleCalendarOauthService.CALENDAR_SCOPES,
    },
  });
}

function getGoogleAuthorizationUrl(req, res) {
  try {
    const state = googleCalendarOAuthStateService.createState();
    const url = googleCalendarOauthService.getAuthorizationUrl({
      state,
    });

    return res.status(200).json({
      ok: true,
      data: {
        authorizationUrl: url,
        state,
        scopes: googleCalendarOauthService.CALENDAR_SCOPES,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.statusCode ? error.message : "No se pudo generar la URL OAuth",
    });
  }
}

async function handleGoogleOAuthCallback(req, res) {
  let stage = "callback_start";
  try {
    if (req.query?.error) {
      stage = "google_returned_error";
      return res.status(400).send(
        "Google Calendar OAuth no fue autorizado. Puedes cerrar esta ventana y volver a intentarlo desde el panel admin."
      );
    }

    const code = req.method === "GET" ? req.query?.code : req.body?.code;
    if (req.method === "GET") {
      stage = "state_validation";
      googleCalendarOAuthStateService.consumeState(req.query?.state);
    }
    stage = "token_exchange";
    const result = await googleCalendarOauthService.exchangeAuthorizationCode({
      code,
    });
    let connection = await googleCalendarConnectionService.getActiveConnection();

    if (result.encryptedRefreshToken) {
      connection = await googleCalendarConnectionService.saveEncryptedRefreshToken({
        encryptedRefreshToken: result.encryptedRefreshToken,
        scopes: result.scopes,
        calendarId: env.googleCalendarId,
      });
    }
    stage = "callback_response";

    if (req.method === "GET") {
      return res.status(200).send(
        [
          "Google Calendar autorizado correctamente.",
          result.hasRefreshToken
            ? "Se obtuvo un refresh token y fue procesado de forma segura."
            : connection
              ? "No se recibio refresh token nuevo; se conserva la conexion activa existente."
            : "No se recibio refresh token; genera una nueva autorizacion con consentimiento offline.",
          "Puedes cerrar esta ventana.",
        ].join(" ")
      );
    }

    return res.status(200).json({
      ok: true,
      data: {
        hasAccessToken: result.hasAccessToken,
        hasRefreshToken: result.hasRefreshToken,
        expiryDate: result.expiryDate,
        scopes: result.scopes,
        encryptedRefreshTokenReady: Boolean(result.encryptedRefreshToken),
        connected: Boolean(connection),
      },
    });
  } catch (error) {
    console.error("google_calendar_oauth_callback_failed", {
      stage,
      errorCode: error.code || null,
      statusCode: error.statusCode || null,
      details: error.details || null,
    });

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.statusCode ? error.message : "No se pudo completar OAuth",
    });
  }
}

async function disconnectGoogleCalendar(req, res) {
  try {
    const refreshToken = await googleCalendarConnectionService.getRefreshTokenForGoogleCalendar();
    const revokeResult = await googleCalendarOauthService.revokeConnection({ refreshToken });
    const disconnectResult = await googleCalendarConnectionService.disconnectActiveConnection();

    return res.status(200).json({
      ok: true,
      data: {
        revoked: revokeResult.revoked,
        disconnected: disconnectResult.disconnected,
        reason: revokeResult.reason || disconnectResult.reason || null,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.statusCode ? error.message : "No se pudo desconectar Calendar",
    });
  }
}

module.exports = {
  disconnectGoogleCalendar,
  getCalendarStatus,
  getGoogleAuthorizationUrl,
  handleGoogleOAuthCallback,
};
