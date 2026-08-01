const crypto = require("crypto");

const env = require("../config/env");
const { pool } = require("../db");
const { decryptSecret } = require("./secret-encryption.service");

const PROVIDER = "google_calendar";

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function mapConnection(row) {
  if (!row) return null;

  return {
    id: row.id,
    provider: row.provider,
    calendarId: row.calendar_id,
    status: row.status,
    scopes: row.scopes || [],
    tokenVersion: row.token_version,
    connectedAt: row.connected_at,
    disconnectedAt: row.disconnected_at,
    hasEncryptedRefreshToken: Boolean(row.encrypted_refresh_token),
  };
}

async function getActiveConnection() {
  const result = await pool.query(
    `
      SELECT *
      FROM gc_ai_calendar_connections
      WHERE provider = $1
        AND status = 'ACTIVE'
      ORDER BY connected_at DESC, created_at DESC
      LIMIT 1
    `,
    [PROVIDER]
  );

  return mapConnection(result.rows[0]);
}

async function getEncryptedActiveConnection() {
  const result = await pool.query(
    `
      SELECT *
      FROM gc_ai_calendar_connections
      WHERE provider = $1
        AND status = 'ACTIVE'
      ORDER BY connected_at DESC, created_at DESC
      LIMIT 1
    `,
    [PROVIDER]
  );

  return result.rows[0] || null;
}

async function getRefreshTokenForGoogleCalendar() {
  const active = await getEncryptedActiveConnection();
  if (active?.encrypted_refresh_token) {
    return decryptSecret(active.encrypted_refresh_token, env.googleTokenEncryptionKey);
  }

  return env.googleRefreshToken || null;
}

async function saveEncryptedRefreshToken({ encryptedRefreshToken, scopes = [], calendarId } = {}) {
  if (!encryptedRefreshToken) {
    const error = new Error("Refresh token cifrado requerido");
    error.code = "encrypted_refresh_token_required";
    error.statusCode = 400;
    throw error;
  }

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        UPDATE gc_ai_calendar_connections
        SET
          status = 'DISCONNECTED',
          encrypted_refresh_token = NULL,
          disconnected_at = COALESCE(disconnected_at, NOW()),
          updated_at = NOW()
        WHERE provider = $1
          AND status = 'ACTIVE'
      `,
      [PROVIDER]
    );

    const result = await pool.query(
      `
        INSERT INTO gc_ai_calendar_connections (
          id,
          provider,
          calendar_id,
          encrypted_refresh_token,
          status,
          scopes,
          connected_at
        )
        VALUES ($1, $2, $3, $4, 'ACTIVE', $5::jsonb, NOW())
        RETURNING *
      `,
      [
        createId("calendar-connection"),
        PROVIDER,
        calendarId || env.googleCalendarId || "primary",
        encryptedRefreshToken,
        JSON.stringify(scopes || []),
      ]
    );

    await pool.query("COMMIT");
    return mapConnection(result.rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function disconnectActiveConnection() {
  const active = await getEncryptedActiveConnection();
  if (!active) {
    return {
      disconnected: false,
      reason: "active_connection_missing",
    };
  }

  await pool.query(
    `
      UPDATE gc_ai_calendar_connections
      SET
        status = 'DISCONNECTED',
        encrypted_refresh_token = NULL,
        disconnected_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [active.id]
  );

  return {
    disconnected: true,
    connectionId: active.id,
  };
}

module.exports = {
  disconnectActiveConnection,
  getActiveConnection,
  getRefreshTokenForGoogleCalendar,
  saveEncryptedRefreshToken,
};
