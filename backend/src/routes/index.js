const express = require("express");

const demoRoutes = require("./demo.routes");
const broadcastRoutes = require("./broadcast.routes");
const aiAdminRoutes = require("./ai-admin.routes");
const calendarAdminRoutes = require("./calendar-admin.routes");
const maluSimulatorRoutes = require("./malu-simulator.routes");
const whatsappAgentRoutes = require("./whatsapp-agent.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "GCodemaker AI backend funcionando",
  });
});

router.use("/", demoRoutes);
router.use("/", whatsappAgentRoutes);
router.use("/admin", calendarAdminRoutes);
router.use("/admin", aiAdminRoutes);
router.use("/admin/malu-simulator", maluSimulatorRoutes);
router.use("/api", broadcastRoutes);

module.exports = router;
