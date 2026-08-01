const crypto = require("crypto");

const { google } = require("googleapis");

const env = require("../config/env");
const { pool } = require("../db");
const googleCalendarConnectionService = require("./google-calendar-connection.service");
const { createOAuthClient } = require("./google-calendar-oauth.service");

const BUSINESS_HOURS = Object.freeze({
  1: { start: 9, end: 19 },
  2: { start: 9, end: 19 },
  3: { start: 9, end: 19 },
  4: { start: 9, end: 19 },
  5: { start: 9, end: 19 },
  6: { start: 9, end: 17 },
});

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function sanitizeGoogleError(error) {
  return {
    message: error?.message || "Error de Google Calendar",
    code: error?.code || error?.response?.status || null,
    reason: error?.errors?.[0]?.reason || error?.response?.data?.error || null,
  };
}

async function ensureEnabledAndConfigured() {
  if (!env.googleCalendarEnabled) {
    const error = new Error("Google Calendar deshabilitado");
    error.code = "google_calendar_disabled";
    error.statusCode = 503;
    throw error;
  }

  const refreshToken = await googleCalendarConnectionService.getRefreshTokenForGoogleCalendar();
  if (!refreshToken) {
    const error = new Error("Google Calendar sin refresh token");
    error.code = "google_calendar_refresh_token_missing";
    error.statusCode = 503;
    throw error;
  }

  return refreshToken;
}

async function getAuthorizedCalendarClient() {
  const refreshToken = await ensureEnabledAndConfigured();
  const auth = createOAuthClient();
  auth.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayMap = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    dayOfWeek: dayMap[values.weekday],
  };
}

function zonedTimeToUtc({ year, month, day, hour, minute = 0 }, timeZone) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utcGuess);
  const values = Object.fromEntries(formatted.map((part) => [part.type, part.value]));
  const actualUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  const wantedUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  return new Date(utcGuess.getTime() + (wantedUtc - actualUtc));
}

function overlapsBusy(slotStart, slotEnd, busy = [], bufferMinutes = 0) {
  return busy.some((range) => {
    const busyStart = addMinutes(new Date(range.start), -bufferMinutes);
    const busyEnd = addMinutes(new Date(range.end), bufferMinutes);

    return slotStart < busyEnd && slotEnd > busyStart;
  });
}

function buildCandidateSlots({
  now,
  busy,
  modality,
  location,
  durationMinutes,
  timeZone,
  lookaheadDays,
  minNoticeHours,
  bufferMinutes,
}) {
  const earliest = addMinutes(now, minNoticeHours * 60);
  const slots = [];

  for (let offset = 0; offset <= lookaheadDays; offset += 1) {
    const cursor = new Date(now);
    cursor.setUTCDate(cursor.getUTCDate() + offset);
    const parts = getDateParts(cursor, timeZone);
    const hours = BUSINESS_HOURS[parts.dayOfWeek];

    if (!hours) {
      continue;
    }

    for (let hour = hours.start; hour < hours.end; hour += 1) {
      const start = zonedTimeToUtc({ ...parts, hour }, timeZone);
      const end = addMinutes(start, durationMinutes);

      if (start < earliest || end > zonedTimeToUtc({ ...parts, hour: hours.end }, timeZone)) {
        continue;
      }

      if (overlapsBusy(start, end, busy, bufferMinutes)) {
        continue;
      }

      slots.push({
        id: `google-slot-${start.toISOString()}`,
        label: `Opcion ${slots.length + 1}`,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        durationMinutes,
        timeZone,
        modality,
        location,
        simulated: false,
      });

      if (slots.length >= 3) {
        return slots;
      }
    }
  }

  return slots;
}

async function findAppointmentByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT *
      FROM gc_ai_calendar_appointments
      WHERE idempotency_key = $1
      LIMIT 1
    `,
    [idempotencyKey]
  );

  return result.rows[0] || null;
}

async function saveConfirmedAppointment({
  leadId,
  conversationId,
  appointment,
  idempotencyKey,
  prospectTimeZone,
}) {
  await pool.query(
    `
      INSERT INTO gc_ai_calendar_appointments (
        id,
        conversation_id,
        lead_id,
        status,
        modality,
        starts_at,
        ends_at,
        engineer_timezone,
        prospect_timezone,
        location,
        google_calendar_event_id,
        google_meet_link,
        idempotency_key,
        confirmed_at,
        metadata
      )
      VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14::jsonb)
      ON CONFLICT (idempotency_key) DO NOTHING
    `,
    [
      appointment.id,
      conversationId,
      leadId,
      appointment.modality,
      appointment.startsAt,
      appointment.endsAt,
      appointment.timeZone,
      prospectTimeZone || null,
      JSON.stringify(appointment.location || null),
      appointment.googleCalendarEventId || null,
      appointment.googleMeetLink || null,
      idempotencyKey,
      appointment.confirmedAt,
      JSON.stringify({
        googleCalendarEventId: appointment.googleCalendarEventId || null,
        simulated: false,
      }),
    ]
  );
}

function buildEventDescription({ summary, modality, location }) {
  const lines = [
    "Consultoria comercial GCodemaker",
    "",
    `Prospecto: ${summary?.prospect || "Pendiente"}`,
    `Negocio: ${summary?.business || "Pendiente"}`,
    `Giro: ${summary?.businessType || "Pendiente"}`,
    `Necesidad: ${summary?.need || "Pendiente"}`,
    `Producto probable: ${summary?.product || "Pendiente"}`,
    `Modalidad: ${modality || "Pendiente"}`,
    `Ubicacion: ${location?.city || location?.state || "No especificada"}`,
    `Conversation ID: ${summary?.conversationId || "Pendiente"}`,
    `Lead ID: ${summary?.leadId || "Pendiente"}`,
    "",
    "Contexto:",
    ...(summary?.relevantContext || []).map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}

async function getAvailableSlots({
  now = new Date(),
  modality = null,
  location = null,
  durationMinutes = env.googleCalendarDefaultDurationMinutes,
  engineerTimeZone = env.googleCalendarTimeZone,
  prospectTimeZone = null,
} = {}) {
  const calendar = await getAuthorizedCalendarClient();
  const timeMin = addMinutes(now, env.googleCalendarMinNoticeHours * 60).toISOString();
  const timeMax = addMinutes(now, env.googleCalendarLookaheadDays * 24 * 60).toISOString();
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: engineerTimeZone,
      items: [
        {
          id: env.googleCalendarId,
        },
      ],
    },
  });
  const busy = response.data.calendars?.[env.googleCalendarId]?.busy || [];

  return buildCandidateSlots({
    now,
    busy,
    modality,
    location,
    durationMinutes,
    timeZone: engineerTimeZone,
    prospectTimeZone,
    lookaheadDays: env.googleCalendarLookaheadDays,
    minNoticeHours: env.googleCalendarMinNoticeHours,
    bufferMinutes: env.googleCalendarBufferMinutes,
  });
}

async function createAppointment({
  slot,
  summary,
  modality = null,
  location = null,
  attendee = null,
  idempotencyKey = null,
  prospectTimeZone = null,
}) {
  if (!slot?.startsAt || !slot?.endsAt) {
    const error = new Error("Slot invalido");
    error.code = "invalid_slot";
    throw error;
  }

  const existing = await findAppointmentByIdempotencyKey(idempotencyKey);
  if (existing?.google_calendar_event_id) {
    return {
      id: existing.id,
      status: "confirmed",
      startsAt: existing.starts_at.toISOString(),
      endsAt: existing.ends_at.toISOString(),
      timeZone: existing.engineer_timezone,
      modality: existing.modality,
      location: existing.location,
      googleCalendarEventId: existing.google_calendar_event_id,
      googleMeetLink: existing.google_meet_link || null,
      confirmedAt: existing.confirmed_at?.toISOString() || null,
      summary,
      simulated: false,
      reused: true,
    };
  }

  const calendar = await getAuthorizedCalendarClient();
  const event = {
    summary:
      summary?.eventTitle ||
      `Consultoria GCodemaker - ${summary?.business || summary?.prospect || "Prospecto"}`,
    description: buildEventDescription({ summary, modality, location }),
    start: {
      dateTime: slot.startsAt,
      timeZone: slot.timeZone || env.googleCalendarTimeZone,
    },
    end: {
      dateTime: slot.endsAt,
      timeZone: slot.timeZone || env.googleCalendarTimeZone,
    },
    extendedProperties: {
      private: {
        conversationId: summary?.conversationId || "",
        leadId: summary?.leadId || "",
        idempotencyKey: idempotencyKey || "",
        modality: modality || "",
      },
    },
  };

  if (attendee?.email) {
    event.attendees = [{ email: attendee.email, displayName: attendee.name || undefined }];
  }

  if (modality === "VIDEOLLAMADA") {
    event.conferenceData = {
      createRequest: {
        requestId: idempotencyKey || createId("meet"),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  } else if (modality === "PRESENCIAL" && location?.address) {
    event.location = location.address;
  }

  try {
    const response = await calendar.events.insert({
      calendarId: env.googleCalendarId,
      conferenceDataVersion: modality === "VIDEOLLAMADA" ? 1 : 0,
      requestBody: event,
    });
    const created = response.data;
    const appointment = {
      id: createId("appointment"),
      status: "confirmed",
      slot,
      startsAt: created.start?.dateTime || slot.startsAt,
      endsAt: created.end?.dateTime || slot.endsAt,
      timeZone: created.start?.timeZone || slot.timeZone || env.googleCalendarTimeZone,
      modality,
      location,
      googleCalendarEventId: created.id || null,
      googleMeetLink: created.hangoutLink || null,
      confirmedAt: new Date().toISOString(),
      summary,
      simulated: false,
    };

    await saveConfirmedAppointment({
      leadId: summary?.leadId,
      conversationId: summary?.conversationId,
      appointment,
      idempotencyKey,
      prospectTimeZone,
    });

    return appointment;
  } catch (error) {
    const safeError = new Error("No se pudo crear el evento de Google Calendar");
    safeError.code = "google_calendar_event_create_failed";
    safeError.statusCode = 502;
    safeError.details = sanitizeGoogleError(error);
    throw safeError;
  }
}

module.exports = {
  buildCandidateSlots,
  createAppointment,
  getAvailableSlots,
};
