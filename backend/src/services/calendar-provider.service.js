const env = require("../config/env");
const googleCalendarProvider = require("./google-calendar-availability.service");
const mockCalendarProvider = require("./calendar-availability.service");

function getCalendarProviderName() {
  if (env.googleCalendarEnabled) {
    return "GOOGLE";
  }

  if (env.nodeEnv === "development") {
    return "MOCK";
  }

  return "DISABLED";
}

function getCalendarProvider() {
  const name = getCalendarProviderName();

  if (name === "GOOGLE") {
    return googleCalendarProvider;
  }

  if (name === "MOCK") {
    return mockCalendarProvider;
  }

  return {
    async getAvailableSlots() {
      const error = new Error("Calendar provider no configurado");
      error.code = "calendar_provider_disabled";
      error.statusCode = 503;
      throw error;
    },
    async createAppointment() {
      const error = new Error("Calendar provider no configurado");
      error.code = "calendar_provider_disabled";
      error.statusCode = 503;
      throw error;
    },
  };
}

module.exports = {
  getCalendarProvider,
  getCalendarProviderName,
};
