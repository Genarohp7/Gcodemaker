const { google } = require("googleapis");

const env = require("../config/env");
const { encryptSecret } = require("./secret-encryption.service");

const CALENDAR_SCOPES = Object.freeze([
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
]);

function ensureOAuthConfig() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    const error = new Error("Google Calendar OAuth no configurado");
    error.code = "google_oauth_not_configured";
    error.statusCode = 503;
    throw error;
  }
}

function createOAuthClient() {
  ensureOAuthConfig();

  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

function getAuthorizationUrl({ state } = {}) {
  const oauth2Client = createOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
    state,
  });
}

async function exchangeAuthorizationCode({ code }) {
  if (!code) {
    const error = new Error("Authorization code requerido");
    error.code = "google_oauth_code_required";
    error.statusCode = 400;
    throw error;
  }

  const oauth2Client = createOAuthClient();
  let tokens;

  try {
    const response = await oauth2Client.getToken({
      code,
      redirect_uri: env.googleRedirectUri,
    });
    tokens = response.tokens;
  } catch (error) {
    const safeError = new Error("Google OAuth token exchange failed");
    safeError.code = "google_oauth_token_exchange_failed";
    safeError.statusCode = error?.response?.status || error?.status || 502;
    safeError.details = {
      stage: "token_exchange",
      name: error?.name || null,
      message: error?.message || null,
      httpStatus: error?.response?.status || error?.status || null,
      googleError: error?.response?.data?.error || null,
      googleErrorDescriptionPresent: Boolean(error?.response?.data?.error_description),
    };
    throw safeError;
  }

  let encryptedRefreshToken = null;
  if (tokens.refresh_token && env.googleTokenEncryptionKey) {
    try {
      encryptedRefreshToken = encryptSecret(tokens.refresh_token, env.googleTokenEncryptionKey);
    } catch (error) {
      const safeError = new Error("Google OAuth refresh token encryption failed");
      safeError.code = "google_oauth_refresh_token_encryption_failed";
      safeError.statusCode = 500;
      safeError.details = {
        stage: "refresh_token_encryption",
        name: error?.name || null,
        code: error?.code || null,
      };
      throw safeError;
    }
  }

  return {
    hasAccessToken: Boolean(tokens.access_token),
    hasRefreshToken: Boolean(tokens.refresh_token),
    expiryDate: tokens.expiry_date || null,
    scopes: tokens.scope ? String(tokens.scope).split(/\s+/).filter(Boolean) : [],
    encryptedRefreshToken,
  };
}

async function revokeConnection({ refreshToken } = {}) {
  const token = refreshToken || env.googleRefreshToken;
  if (!token) {
    return {
      revoked: false,
      reason: "refresh_token_missing",
    };
  }

  const oauth2Client = createOAuthClient();
  await oauth2Client.revokeToken(token);

  return {
    revoked: true,
  };
}

module.exports = {
  CALENDAR_SCOPES,
  createOAuthClient,
  exchangeAuthorizationCode,
  getAuthorizationUrl,
  revokeConnection,
};
