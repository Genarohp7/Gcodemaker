const express = require("express");

const {
  createDemoLead,
  handleAiDemo,
} = require("../controllers/demo.controller");

const router = express.Router();

router.post("/demo-leads", createDemoLead);
router.post("/ai-demo", handleAiDemo);

module.exports = router;
