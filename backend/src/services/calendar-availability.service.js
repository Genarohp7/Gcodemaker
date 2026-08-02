const env = require("../config/env");

const MOCK_SLOT_TIME_ZONE = "America/Mexico_City";

function ensureDevelopmentMock() {
  if (env.nodeEnv !== "development") {
    const error = new Error("Calendario MOCK disponible solo en development");
    error.code = "calendar_mock_not_available";
    throw error;
  }
}

function addBusinessDays(date, days) {
  const next = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    next.setUTCDate(next.getUTCDate() + 1);
    const day = next.getUTCDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return next;
}

function buildMockSlot(index, baseDate, hour, { modality = null, location = null } = {}) {
  const startsAt = new Date(baseDate);
  startsAt.setUTCHours(hour, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setUTCMinutes(endsAt.getUTCMinutes() + 30);

  return {
    id: `mock-slot-${index}`,
    label: `Opcion ${index}`,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    durationMinutes: 30,
    timeZone: MOCK_SLOT_TIME_ZONE,
    modality,
    location,
    simulated: true,
  };
}

async function getAvailableSlots({
  now = new Date(),
  modality = null,
  location = null,
  preferredSlot = null,
} = {}) {
  ensureDevelopmentMock();

  const firstDay = addBusinessDays(now, 1);
  const secondDay = addBusinessDays(now, 2);
  const preferred = preferredSlot
    ? {
        ...preferredSlot,
        id: preferredSlot.id || "mock-preferred-slot",
        label: preferredSlot.label || "Horario solicitado",
        modality: modality || preferredSlot.modality || null,
        location: location || preferredSlot.location || null,
        simulated: true,
      }
    : null;

  return [
    preferred,
    buildMockSlot(1, firstDay, 16, { modality, location }),
    buildMockSlot(2, firstDay, 18, { modality, location }),
    buildMockSlot(3, secondDay, 17, { modality, location }),
  ].filter(Boolean);
}

async function createAppointment({ slot, summary, modality = null, location = null }) {
  ensureDevelopmentMock();

  if (!slot?.id || !slot?.startsAt) {
    const error = new Error("Slot invalido");
    error.code = "invalid_slot";
    throw error;
  }

  return {
    id: `mock-appointment-${slot.id}`,
    status: "confirmed",
    slot,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    timeZone: slot.timeZone || MOCK_SLOT_TIME_ZONE,
    modality: modality || slot.modality || null,
    location: location || slot.location || null,
    confirmedAt: new Date().toISOString(),
    googleCalendarEventId: null,
    summary,
    simulated: true,
  };
}

module.exports = {
  getAvailableSlots,
  createAppointment,
};
