const express = require("express");

const {
  disconnectGoogleCalendar,
  getCalendarStatus,
  getGoogleAuthorizationUrl,
  handleGoogleOAuthCallback,
} = require("../controllers/calendar-admin.controller");
const { requireAiAdmin } = require("../middleware/ai-admin-auth.middleware");

const router = express.Router();

router.get("/calendar/google/callback", handleGoogleOAuthCallback);

router.use(requireAiAdmin);

router.get("/calendar/status", getCalendarStatus);
router.get("/calendar/google/oauth-url", getGoogleAuthorizationUrl);
router.post("/calendar/google/callback", handleGoogleOAuthCallback);
router.post("/calendar/google/disconnect", disconnectGoogleCalendar);

module.exports = router;
